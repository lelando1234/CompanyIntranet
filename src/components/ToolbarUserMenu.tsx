import type { ReactNode } from "react";
import { resolveUploadUrl } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolbarUserMenuProps {
  name: string;
  avatar?: string;
  role?: string;
  children: ReactNode;
}

export default function ToolbarUserMenu({ name, avatar, role, children }: ToolbarUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`User menu for ${name}`}
          className="flex items-center gap-2 rounded-full px-1.5 py-1 text-current hover:bg-header-foreground/10 hover:text-current"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={resolveUploadUrl(avatar)} alt={name} />
            <AvatarFallback className="bg-secondary text-[11.5px] font-bold text-primary">
              {name.split(" ").map((part) => part[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-[13.5px] md:inline-block">{name}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div>
            <p>{name}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
