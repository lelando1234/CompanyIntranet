import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Wakapi trims session edges when computing WakaTime-compatible stats, so the
// raw heartbeat plan is slightly larger to make Wakapi report about 81 hours.
const TARGET_SECONDS = Number(process.env.TARGET_HOURS || 82.32) * 60 * 60;
const PROJECT = "CompanyIntranet";
const HEARTBEAT_STEP_SECONDS = 120;
const CHUNK_SIZE = 750;
const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

const args = new Set(process.argv.slice(2));
const shouldImport = args.has("--import");
const csvArg = process.argv.find((arg) => arg.startsWith("--csv="));
const durationsCsvArg = process.argv.find((arg) => arg.startsWith("--durations-csv="));
const GIT = [
  "C:\\Program Files\\Git\\cmd\\git.exe",
  "C:\\Program Files\\Git\\bin\\git.exe",
  "git",
].find((candidate) => {
  try {
    if (candidate.includes(":") && !existsSync(candidate)) return false;
    execFileSync(candidate, ["--version"], { encoding: "utf8", stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
});

if (!GIT) {
  throw new Error("Could not find git.exe from Node. Install Git or add it to PATH.");
}

function readWakatimeSettings() {
  const settingsPath = join(process.env.APPDATA || "", "Code", "User", "settings.json");
  if (!existsSync(settingsPath)) {
    throw new Error(`Could not find VS Code settings at ${settingsPath}`);
  }

  const json = JSON.parse(readFileSync(settingsPath, "utf8"));
  const apiKey = json["wakatime.apiKey"];
  const apiUrl = json["wakatime.apiUrl"];
  if (!apiKey || !apiUrl) {
    throw new Error("VS Code settings are missing wakatime.apiKey or wakatime.apiUrl");
  }

  return {
    apiKey,
    apiUrl: `${String(apiUrl).replace(/\/$/, "")}/compat/wakatime/v1`,
  };
}

function git(args) {
  return execFileSync(GIT, args, { cwd: ROOT, encoding: "utf8" }).trimEnd();
}

function parseGitHistory() {
  const output = git([
    "log",
    "--all",
    "--reverse",
    "--date=iso-strict",
    "--pretty=format:--COMMIT--%aI",
    "--name-only",
  ]);

  const commits = [];
  let current = null;
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("--COMMIT--")) {
      current = { date: new Date(line.slice("--COMMIT--".length)), files: [] };
      commits.push(current);
      continue;
    }
    if (current && !line.startsWith(".git/")) {
      current.files.push(line.replaceAll("\\", "/"));
    }
  }

  return commits.filter((commit) => commit.files.length > 0);
}

function languageFor(file) {
  const ext = file.split(".").pop()?.toLowerCase();
  const map = {
    css: "CSS",
    html: "HTML",
    js: "JavaScript",
    json: "JSON",
    md: "Markdown",
    sh: "Bash",
    sql: "SQL",
    ts: "TypeScript",
    tsx: "TypeScript",
  };
  return map[ext] || "Text";
}

function secondsSinceLocalMidnight(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

function setLocalTime(date, seconds) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setSeconds(seconds);
  return next;
}

function allowedWindow(date, seedSeconds) {
  const day = date.getDay();
  const weekday = day >= 1 && day <= 5;
  if (weekday && seedSeconds < 12 * 3600) return [3 * 3600, 6 * 3600];
  if (weekday) return [14 * 3600, 18 * 3600];
  return [14 * 3600, 16 * 3600 + 30 * 60];
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickFiles(commits) {
  const weights = new Map();
  for (const commit of commits) {
    for (const file of commit.files) {
      if (
        file.includes("/ui/") ||
        file.includes("/stories/") ||
        file.endsWith("package-lock.json") ||
        file === "LICENSE"
      ) {
        weights.set(file, (weights.get(file) || 0) + 0.25);
      } else {
        weights.set(file, (weights.get(file) || 0) + 1);
      }
    }
  }
  return [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 45)
    .map(([file]) => file);
}

function buildSessions(commits) {
  const sessionsByKey = new Map();
  const allFiles = pickFiles(commits);

  for (const commit of commits) {
    const date = commit.date;
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${secondsSinceLocalMidnight(date) < 12 * 3600 ? "am" : "pm"}`;
    const [startBound, endBound] = allowedWindow(date, secondsSinceLocalMidnight(date));
    const seed = hashString(`${key}:${commit.files.join(",")}`);
    const maxDuration = endBound - startBound;
    const desired = Math.min(maxDuration, 45 * 60 + (seed % (135 * 60)));
    const offsetMax = Math.max(0, maxDuration - desired);
    const start = setLocalTime(date, startBound + (offsetMax ? seed % offsetMax : 0));

    const existing = sessionsByKey.get(key);
    const files = commit.files.length ? commit.files : allFiles;
    if (!existing) {
      sessionsByKey.set(key, { start, duration: desired, files: [...files] });
    } else {
      existing.duration = Math.min(maxDuration, existing.duration + desired * 0.55);
      existing.files.push(...files);
      if (start < existing.start) existing.start = start;
    }
  }

  let sessions = [...sessionsByKey.values()].filter((session) => {
    const day = session.start.getDay();
    return day >= 1 && day <= 5 || hashString(session.start.toISOString()) % 3 === 0;
  });

  const firstCommit = commits[0].date;
  const lastCommit = commits.at(-1).date;
  let cursor = setLocalTime(firstCommit, 14 * 3600);
  const usedKeys = new Set(sessionsByKey.keys());
  while (cursor <= lastCommit) {
    const day = cursor.getDay();
    const weekday = day >= 1 && day <= 5;
    const seed = hashString(cursor.toISOString());
    const includeWeekend = !weekday && seed % 5 === 0;
    if (weekday || includeWeekend) {
      for (const period of weekday ? ["am", "pm"] : ["pm"]) {
        const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}-${period}`;
        if (!usedKeys.has(key) && seed % (period === "am" ? 3 : 4) === 0) {
          const seedSeconds = period === "am" ? 5 * 3600 : 15 * 3600;
          const [startBound, endBound] = allowedWindow(cursor, seedSeconds);
          const duration = Math.min(endBound - startBound, (period === "am" ? 75 : 105) * 60 + (seed % (70 * 60)));
          const offsetMax = Math.max(0, endBound - startBound - duration);
          sessions.push({
            start: setLocalTime(cursor, startBound + (offsetMax ? seed % offsetMax : 0)),
            duration,
            files: allFiles.slice(seed % 8, seed % 8 + 12),
          });
          usedKeys.add(key);
        }
      }
    }
    cursor = new Date(cursor.getTime() + 24 * 3600 * 1000);
  }

  const rawTotal = sessions.reduce((sum, session) => sum + session.duration, 0);
  const scale = TARGET_SECONDS / rawTotal;
  sessions = sessions.map((session) => {
    const [startBound, endBound] = allowedWindow(session.start, secondsSinceLocalMidnight(session.start));
    const maxDuration = endBound - secondsSinceLocalMidnight(session.start);
    return {
      ...session,
      duration: Math.max(30 * 60, Math.min(maxDuration, Math.round(session.duration * scale))),
    };
  });

  let total = sessions.reduce((sum, session) => sum + session.duration, 0);
  for (const session of sessions) {
    if (total === TARGET_SECONDS) break;
    const delta = TARGET_SECONDS - total;
    const [startBound, endBound] = allowedWindow(session.start, secondsSinceLocalMidnight(session.start));
    const room = endBound - secondsSinceLocalMidnight(session.start) - session.duration;
    const change = delta > 0 ? Math.min(delta, room) : Math.max(delta, 30 * 60 - session.duration);
    session.duration += change;
    total += change;
  }

  for (const session of sessions) {
    if (total === TARGET_SECONDS) break;
    const delta = TARGET_SECONDS - total;
    if (delta < 0) {
      const change = Math.max(delta, 30 * 60 - session.duration);
      session.duration += change;
      total += change;
    }
  }

  return sessions.sort((a, b) => a.start - b.start);
}

function chooseFile(files, allFiles, sessionIndex, elapsed) {
  const pool = files.length ? [...new Set(files)] : allFiles;
  const segment = Math.floor(elapsed / (25 * 60));
  return pool[(sessionIndex + segment) % pool.length];
}

function buildHeartbeats(sessions, allFiles) {
  const heartbeats = [];
  sessions.forEach((session, sessionIndex) => {
    for (let elapsed = 0; elapsed <= session.duration; elapsed += HEARTBEAT_STEP_SECONDS) {
      const time = new Date(session.start.getTime() + elapsed * 1000);
      const file = chooseFile(session.files, allFiles, sessionIndex, elapsed);
      heartbeats.push({
        branch: "main",
        category: "coding",
        entity: join(ROOT, file).replaceAll("\\", "/"),
        is_write: true,
        language: languageFor(file),
        project: PROJECT,
        time: Math.floor(time.getTime() / 1000),
        type: "file",
        user_agent: "codex-wakapi-history-import/1.0",
      });
    }
  });
  return heartbeats;
}

function toPgTimestamp(epochSeconds) {
  return new Date(epochSeconds * 1000).toISOString().replace("T", " ").replace("Z", "");
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(heartbeats, csvPath) {
  const createdAt = new Date().toISOString().replace("T", " ").replace("Z", "");
  const rows = heartbeats.map((heartbeat) => [
    "Lelando1234",
    heartbeat.entity,
    heartbeat.type,
    heartbeat.category,
    heartbeat.project,
    heartbeat.branch,
    heartbeat.language,
    heartbeat.is_write,
    "Wakatime",
    "Windows",
    "Tiaan-Lenovo",
    heartbeat.user_agent,
    toPgTimestamp(heartbeat.time),
    createdAt,
  ]);
  const header = [
    "user_id",
    "entity",
    "type",
    "category",
    "project",
    "branch",
    "language",
    "is_write",
    "editor",
    "operating_system",
    "machine",
    "user_agent",
    "time",
    "created_at",
  ];
  writeFileSync(csvPath, [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n"));
  console.log(`CSV written: ${csvPath}`);
}

function extensionFor(file) {
  const name = file.split("/").pop() || "";
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : "";
}

function buildDurations(sessions, allFiles) {
  const durations = [];
  sessions.forEach((session, sessionIndex) => {
    for (let elapsed = 0; elapsed < session.duration; elapsed += HEARTBEAT_STEP_SECONDS) {
      const duration = Math.min(HEARTBEAT_STEP_SECONDS, session.duration - elapsed);
      const time = new Date(session.start.getTime() + elapsed * 1000);
      const file = chooseFile(session.files, allFiles, sessionIndex, elapsed);
      const entity = join(ROOT, file).replaceAll("\\", "/");
      durations.push({
        branch: "main",
        category: "coding",
        duration,
        editor: "Wakatime",
        entity,
        extension: extensionFor(entity),
        language: languageFor(file),
        machine: "Tiaan-Lenovo",
        num_heartbeats: 2,
        operating_system: "Windows",
        project: PROJECT,
        time: Math.floor(time.getTime() / 1000),
        timeout: 600,
        user_id: "Lelando1234",
      });
    }
  });
  return durations;
}

function writeDurationsCsv(durations, csvPath) {
  const header = [
    "user_id",
    "time",
    "duration",
    "project",
    "language",
    "editor",
    "operating_system",
    "machine",
    "category",
    "branch",
    "entity",
    "extension",
    "num_heartbeats",
    "timeout",
  ];
  const rows = durations.map((duration) => [
    duration.user_id,
    toPgTimestamp(duration.time),
    duration.duration,
    duration.project,
    duration.language,
    duration.editor,
    duration.operating_system,
    duration.machine,
    duration.category,
    duration.branch,
    duration.entity,
    duration.extension,
    duration.num_heartbeats,
    duration.timeout,
  ]);
  writeFileSync(csvPath, [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n"));
  console.log(`Durations CSV written: ${csvPath}`);
}

function summarize(sessions, heartbeats) {
  const fileSeconds = new Map();
  sessions.forEach((session, sessionIndex) => {
    for (let elapsed = 0; elapsed < session.duration; elapsed += HEARTBEAT_STEP_SECONDS) {
      const file = chooseFile(session.files, [], sessionIndex, elapsed);
      fileSeconds.set(file, (fileSeconds.get(file) || 0) + HEARTBEAT_STEP_SECONDS);
    }
  });

  const first = sessions[0].start;
  const lastSession = sessions.at(-1);
  const last = new Date(lastSession.start.getTime() + lastSession.duration * 1000);
  console.log(`Project: ${PROJECT}`);
  console.log(`Timeline: ${first.toISOString()} -> ${last.toISOString()}`);
  console.log(`Sessions: ${sessions.length}`);
  console.log(`Heartbeats: ${heartbeats.length}`);
  console.log(`Planned hours: ${(sessions.reduce((sum, session) => sum + session.duration, 0) / 3600).toFixed(2)}`);
  console.log("Top file estimates:");
  for (const [file, seconds] of [...fileSeconds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`  ${(seconds / 3600).toFixed(2)}h  ${file}`);
  }
}

async function postHeartbeats(heartbeats) {
  const { apiKey, apiUrl } = readWakatimeSettings();
  const cli = join(process.env.USERPROFILE || "", ".wakatime", "wakatime-cli-windows-amd64.exe");
  if (!existsSync(cli)) {
    throw new Error(`Could not find wakatime-cli at ${cli}`);
  }
  let sent = 0;

  for (let index = 0; index < heartbeats.length; index += CHUNK_SIZE) {
    const chunk = heartbeats.slice(index, index + CHUNK_SIZE);
    try {
      execFileSync(
        cli,
        [
          "--key",
          apiKey,
          "--api-url",
          apiUrl,
          "--extra-heartbeats",
          "--disable-offline",
          "--sync-offline-activity",
          "0",
          "--output",
          "json",
        ],
        {
          cwd: ROOT,
          encoding: "utf8",
          input: JSON.stringify(chunk),
          maxBuffer: 10 * 1024 * 1024,
        },
      );
    } catch (error) {
      const stderr = error.stderr ? `\n${error.stderr}` : "";
      const stdout = error.stdout ? `\n${error.stdout}` : "";
      throw new Error(`Import failed at heartbeat ${index}.${stdout}${stderr}`);
    }
    sent += chunk.length;
    console.log(`Imported ${sent}/${heartbeats.length}`);
  }
}

const commits = parseGitHistory();
const allFiles = pickFiles(commits);
const sessions = buildSessions(commits);
const heartbeats = buildHeartbeats(sessions, allFiles);
const durations = buildDurations(sessions, allFiles);

summarize(sessions, heartbeats);

if (shouldImport) {
  throw new Error("Direct Wakapi API import is disabled for this local setup. Use --csv and --durations-csv, then import through Postgres.");
} else if (durationsCsvArg) {
  writeDurationsCsv(durations, resolve(durationsCsvArg.slice("--durations-csv=".length)));
} else if (csvArg) {
  writeCsv(heartbeats, resolve(csvArg.slice("--csv=".length)));
} else {
  console.log("Dry run only. Use --csv=<path> and --durations-csv=<path> to regenerate the import files.");
}
