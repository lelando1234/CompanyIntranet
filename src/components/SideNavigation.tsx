import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

interface LinkItem {
  id: string;
  title: string;
  url: string;
}

interface LinkCategory {
  id: string;
  name: string;
  links: LinkItem[];
}

interface SideNavigationProps {
  categories?: LinkCategory[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SideNavigation = ({
  categories = [
    {
      id: "1",
      name: "Human Resources",
      links: [
        {
          id: "1-1",
          title: "Employee Handbook",
          url: "https://example.com/handbook",
        },
        {
          id: "1-2",
          title: "Benefits Portal",
          url: "https://example.com/benefits",
        },
        {
          id: "1-3",
          title: "Time Off Request",
          url: "https://example.com/timeoff",
        },
      ],
    },
    {
      id: "2",
      name: "IT Resources",
      links: [
        { id: "2-1", title: "Help Desk", url: "https://example.com/helpdesk" },
        {
          id: "2-2",
          title: "Software Requests",
          url: "https://example.com/software",
        },
        {
          id: "2-3",
          title: "Password Reset",
          url: "https://example.com/password",
        },
      ],
    },
    {
      id: "3",
      name: "Finance",
      links: [
        {
          id: "3-1",
          title: "Expense Reports",
          url: "https://example.com/expenses",
        },
        {
          id: "3-2",
          title: "Payroll Portal",
          url: "https://example.com/payroll",
        },
        { id: "3-3", title: "Budget Tools", url: "https://example.com/budget" },
      ],
    },
    {
      id: "4",
      name: "Marketing",
      links: [
        {
          id: "4-1",
          title: "Brand Guidelines",
          url: "https://example.com/brand",
        },
        {
          id: "4-2",
          title: "Asset Library",
          url: "https://example.com/assets",
        },
        {
          id: "4-3",
          title: "Campaign Calendar",
          url: "https://example.com/campaigns",
        },
      ],
    },
  ],
  isCollapsed = false,
  onToggleCollapse = () => {},
}: SideNavigationProps) => {
  const [collapsed, setCollapsed] = useState(isCollapsed);

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
    onToggleCollapse();
  };

  const handleLinkClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div
      className={`h-full flex flex-col border-r bg-background transition-all duration-300 ${collapsed ? "w-16" : "w-64 md:w-72"}`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && <h2 className="text-lg font-semibold">Resources</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleCollapse}
          className={`${collapsed ? "mx-auto" : ""}`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {collapsed ? (
          <div className="py-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col items-center py-2"
              >
                <div
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-1 cursor-pointer"
                  title={category.name}
                >
                  {category.name.charAt(0)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Accordion type="multiple" className="px-2 py-2">
            {categories.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="text-sm font-medium">{category.name}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-2 py-1 space-y-1">
                    {category.links.map((link) => (
                      <Button
                        key={link.id}
                        variant="ghost"
                        className="w-full justify-start text-sm font-normal py-1.5 h-auto"
                        onClick={() => handleLinkClick(link.url)}
                      >
                        <ExternalLink
                          size={14}
                          className="mr-2 flex-shrink-0"
                        />
                        <span className="truncate">{link.title}</span>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </ScrollArea>
    </div>
  );
};

export default SideNavigation;
