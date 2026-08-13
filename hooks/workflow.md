# Workflow Hooks

## Debugging Flow
IF issue reported:
→ Run Debugger
→ THEN run Fixer
→ THEN run Reviewer

---

## Feature Development Flow
IF new feature:
→ Run Architect
→ THEN run Developer
→ THEN run Reviewer

---

## Fix Completion Hook
IF fix is successful:
→ Append to /memory/bugs.md

---

## Consistency Hook
IF code touches SQL/API/UI:
→ Check /memory/patterns.md
