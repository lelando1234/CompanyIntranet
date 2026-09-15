import React, { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SidebarPanel from "@/components/SidebarPanel";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { type URLCategory } from "@/lib/api";
import { resourceIconMap as iconMap, resourceHref } from "@/lib/resources";

import ResourceIcon from "@/components/ResourceIcon";

interface SideNavigationProps {
  logoUrl?: string;
  categories: URLCategory[];
  loading?: boolean;
  error?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  footer?: React.ReactNode;
}

const SideNavigation = ({
  logoUrl,
  categories,
  loading = false,
  error,
  collapsed = false,
  onToggleCollapse = () => {},
  onClose,
  footer,
}: SideNavigationProps) => {
  const [openCategoryIds, setOpenCategoryIds] = useState<string[]>([]);
  useEffect(() => {
    setOpenCategoryIds(categories.map(category => category.id));
  }, [categories]);

  return (
    <SidebarPanel title="Resources" logoUrl={logoUrl} collapsed={collapsed} onToggleCollapse={onToggleCollapse} onClose={onClose} footer={footer}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p role="alert" className="px-4 py-8 text-sm text-muted-foreground">{error}</p>
        ) : categories.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No resource categories available.
          </div>
        ) : collapsed ? (
          <div className="py-2">
            {categories.map((category) => {
              const CategoryIcon = category.icon ? iconMap[category.icon] : null;
              return (
                <div
                  key={category.id}
                  className="flex flex-col items-center py-2"
                >
                  <div
                    className="mb-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-primary text-primary-foreground"
                    title={category.name}
                  >
                    {CategoryIcon ? (
                      <CategoryIcon size={16} />
                    ) : (
                      category.name.charAt(0)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={openCategoryIds}
            onValueChange={setOpenCategoryIds}
            className="space-y-1 px-3 py-0"
          >
            {categories.map((category) => {
              const CategoryIcon = category.icon ? iconMap[category.icon] : null;
              return (
                <AccordionItem key={category.id} value={category.id} className="border-0">
                  <AccordionTrigger className={`rounded px-3 py-2.5 text-left hover:no-underline hover:bg-secondary hover:text-secondary-foreground [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-current ${openCategoryIds.includes(category.id) ? "bg-primary text-primary-foreground" : ""}`}>
                    <div className="flex items-center gap-2.5">
                      {CategoryIcon && <CategoryIcon size={16} />}
                      <span className="min-w-0 text-[13.5px] font-medium">{category.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 py-1 pl-2">
                      {(category.links || []).map((link) => {
                        return (
                          <Button
                            key={link.id}
                            asChild
                            variant="ghost"
                            className="h-auto w-full justify-start gap-2 rounded py-1.5 pr-2 text-sm font-normal hover:bg-secondary hover:text-secondary-foreground"
                          >
                            <a href={resourceHref(link.url)} target="_blank" rel="noopener noreferrer">
                            <ResourceIcon icon={link.icon} iconUrl={link.icon_url} />
                            <span className="min-w-0 truncate">{link.title}</span>
                            </a>
                          </Button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
    </SidebarPanel>
  );
};

export default SideNavigation;
