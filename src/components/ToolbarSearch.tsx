import { Search } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";

type ToolbarSearchProps = Pick<InputProps, "value" | "onChange" | "placeholder">;

export default function ToolbarSearch({ value, onChange, placeholder = "Search..." }: ToolbarSearchProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        className="h-9 rounded border-header-foreground/20 bg-header-foreground/10 pl-9 text-[13.5px] text-current placeholder:text-header-foreground/45 focus-visible:ring-1 focus-visible:ring-header-foreground/25"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
