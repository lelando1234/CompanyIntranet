import { useState } from "react";
import { Link2 } from "lucide-react";
import { resourceIconMap, resourceIconUrl } from "@/lib/resources";

interface ResourceIconProps {
  icon?: string;
  iconUrl?: string;
}

export default function ResourceIcon({ icon, iconUrl }: ResourceIconProps) {
  const src = iconUrl ? resourceIconUrl(iconUrl) : undefined;
  const [failedSrc, setFailedSrc] = useState<string>();
  const Icon = resourceIconMap[icon || ""] || Link2;

  return (
    <span aria-hidden="true" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted/60">
      {src && src !== failedSrc ? (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className="h-[18px] w-[18px] object-contain"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <Icon className="h-[18px] w-[18px]" />
      )}
    </span>
  );
}
