import { useEffect, useId, useRef, useState } from "react";
import { Search, User, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { type URLCategory } from "@/lib/api";
import { resourceHref } from "@/lib/resources";
import ResourceIcon from "@/components/ResourceIcon";

interface ResourceSearchProps {
  categories: URLCategory[];
  canAccessAdmin: boolean;
  loading: boolean;
  error?: string;
}

export default function ResourceSearch({ categories, loading, error, canAccessAdmin }: ResourceSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const listId = useId();
  const term = query.trim().toLowerCase();
  const showAll = term === 'all' || term === '*';
  const resourceMatches = term && !loading && !error ? categories.flatMap(category =>
    (category.links || []).filter(link => showAll || `${link.title} ${category.name}`.toLowerCase().includes(term))
      .map(link => ({ ...link, categoryName: category.name }))
  ) : [];
  const pageMatches = [
    { id: 'page-profile', title: 'Profile', to: '/profile', icon: User },
    ...(canAccessAdmin ? [{ id: 'page-admin', title: 'Admin Panel', to: '/admin', icon: Settings }] : []),
  ].filter(page => term && (showAll || page.title.toLowerCase().includes(term)));
  const matches = [...pageMatches, ...resourceMatches];
  const resultKey = JSON.stringify(matches.map(match => match.id));
  useEffect(() => { setActiveIndex(-1); }, [resultKey]);
  const visible = open && !!term;

  useEffect(() => {
    const breakpoint = window.matchMedia('(min-width: 768px)');
    const close = () => setOpen(false);
    breakpoint.addEventListener('change', close);
    return () => breakpoint.removeEventListener('change', close);
  }, []);

  return (
    <Popover open={visible} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" />
          <Input
            ref={inputRef}
            role="combobox"
            aria-label="Find a page or resource"
            aria-autocomplete="list"
            aria-expanded={visible}
            aria-controls={visible ? listId : undefined}
            aria-activedescendant={visible && matches[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            autoComplete="off"
            placeholder="Find a resource…"
            className="h-9 rounded border-header-foreground/20 bg-header-foreground/10 pl-9 text-[13.5px] text-current placeholder:text-header-foreground/45 focus-visible:ring-1 focus-visible:ring-header-foreground/25"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={event => { setQuery(event.target.value); setActiveIndex(-1); setOpen(true); }}
            onKeyDown={event => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === 'Escape' || event.key === 'Tab') { setOpen(false); return; }
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setOpen(true);
                if (!matches.length) return;
                const next = event.key === 'ArrowDown'
                  ? (activeIndex + 1) % matches.length
                  : (activeIndex <= 0 ? matches.length - 1 : activeIndex - 1);
                setActiveIndex(next);
              } else if (event.key === 'Enter' && visible && matches[activeIndex]) {
                event.preventDefault();
                linksRef.current[activeIndex]?.click();
              }
            }}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] max-h-80 overflow-y-auto p-1"
        onOpenAutoFocus={event => event.preventDefault()}
        onCloseAutoFocus={event => event.preventDefault()}
        onInteractOutside={event => {
          if (event.target instanceof Node && inputRef.current?.contains(event.target)) event.preventDefault();
        }}
      >
        {loading ? <p role="status" className="p-3 text-sm">Loading resources…</p>
          : error ? <p role="alert" className="p-3 text-sm">{error}</p>
          : !matches.length ? <p role="status" className="p-3 text-sm">No matching pages or resources.</p> : null}
        <div role="listbox" id={listId} aria-label="Matching pages and resources">
          {pageMatches.length > 0 && (
            <div role="group" aria-labelledby={`${listId}-pages`}>
              <div id={`${listId}-pages`} className="px-3 py-2 text-xs font-semibold text-muted-foreground">Pages</div>
              {pageMatches.map((page, index) => (
                <Link key={page.id} to={page.to} ref={element => {
                  linksRef.current[index] = element;
                  if (visible && activeIndex === index) element?.scrollIntoView({ block: 'nearest' });
                }}
                  id={`${listId}-${index}`} role="option" aria-selected={activeIndex === index} tabIndex={-1}
                  className={`flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary hover:text-secondary-foreground ${activeIndex === index ? 'bg-secondary text-secondary-foreground' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <page.icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium">{page.title}</span>
                </Link>
              ))}
            </div>
          )}
          {resourceMatches.length > 0 && (
            <div role="group" aria-labelledby={`${listId}-resources`}>
              <div id={`${listId}-resources`} className="px-3 py-2 text-xs font-semibold text-muted-foreground">Resources</div>
          {resourceMatches.map((link, resourceIndex) => {
            const index = pageMatches.length + resourceIndex;
            return (
              <a key={link.id} ref={element => {
                linksRef.current[index] = element;
                if (visible && activeIndex === index) element?.scrollIntoView({ block: 'nearest' });
              }}
                id={`${listId}-${index}`} role="option" aria-selected={activeIndex === index} tabIndex={-1}
                href={resourceHref(link.url)} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary hover:text-secondary-foreground ${activeIndex === index ? 'bg-secondary text-secondary-foreground' : ''}`}
                onClick={() => setOpen(false)}
              >
                <ResourceIcon icon={link.icon} iconUrl={link.icon_url} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{link.title}</span>
                  <span className="block text-xs opacity-70">{link.categoryName}</span>
                </span>
              </a>
            );
          })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
