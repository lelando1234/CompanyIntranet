import React, { useState } from "react";
import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  previewText: string;
}

interface NewsFeedProps {
  articles?: NewsArticle[];
}

const NewsFeed = ({ articles = [] }: NewsFeedProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedArticles, setExpandedArticles] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Default articles if none are provided
  const defaultArticles: NewsArticle[] = [
    {
      id: "1",
      title: "Company Announces New Product Launch",
      content:
        "We are excited to announce the launch of our newest product line that will revolutionize the industry. The development team has been working tirelessly for the past year to bring this innovation to market. Join us for the virtual launch event next week where our CEO will demonstrate all the new features and capabilities.",
      author: "Marketing Team",
      date: "2023-06-15",
      category: "Announcements",
      previewText:
        "We are excited to announce the launch of our newest product line that will revolutionize the industry...",
    },
    {
      id: "2",
      title: "Quarterly Financial Results",
      content:
        "Our Q2 financial results exceeded expectations with a 15% increase in revenue compared to the same period last year. The board has approved a special dividend for shareholders and we are on track to meet our annual targets. The finance department will be hosting a detailed presentation next Monday to discuss the results in depth.",
      author: "Finance Department",
      date: "2023-06-10",
      category: "Finance",
      previewText:
        "Our Q2 financial results exceeded expectations with a 15% increase in revenue compared to the same period last year...",
    },
    {
      id: "3",
      title: "Office Closure for Company Retreat",
      content:
        "Please note that all offices will be closed from July 15-17 for our annual company retreat. This year we will be focusing on team building and strategic planning for the upcoming fiscal year. All employees are expected to attend. Remote workers will receive separate instructions for virtual participation.",
      author: "HR Department",
      date: "2023-06-05",
      category: "HR",
      previewText:
        "Please note that all offices will be closed from July 15-17 for our annual company retreat...",
    },
    {
      id: "4",
      title: "New IT Security Protocols",
      content:
        "In response to recent industry security incidents, we are implementing enhanced security protocols effective immediately. All employees must complete the mandatory security training by the end of this month. The IT department will be scheduling system updates that may cause brief service interruptions over the next two weeks.",
      author: "IT Department",
      date: "2023-06-01",
      category: "IT",
      previewText:
        "In response to recent industry security incidents, we are implementing enhanced security protocols effective immediately...",
    },
  ];

  const displayArticles = articles.length > 0 ? articles : defaultArticles;

  // Get unique categories for filter
  const categories = [
    "all",
    ...new Set(displayArticles.map((article) => article.category)),
  ];

  // Filter articles based on search term and category
  const filteredArticles = displayArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Toggle article expansion
  const toggleArticleExpansion = (id: string) => {
    setExpandedArticles((prev) =>
      prev.includes(id)
        ? prev.filter((articleId) => articleId !== id)
        : [...prev, id],
    );
  };

  return (
    <div className="w-full bg-background p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Company News</h1>
        <p className="text-muted-foreground">
          Stay updated with the latest company announcements and news
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Filter:</span>
          </div>

          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <Card className="w-full">
          <CardContent className="pt-6 text-center">
            <p>No news articles found. Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => {
            const isExpanded = expandedArticles.includes(article.id);

            return (
              <Card key={article.id} className="w-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{article.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(article.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </CardDescription>
                    </div>
                    <Badge>{article.category}</Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm">
                    {isExpanded ? article.content : article.previewText}
                  </p>
                </CardContent>

                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Posted by: {article.author}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleArticleExpansion(article.id)}
                    className="flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        Show less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {filteredArticles.length > 0 && (
        <div className="mt-6">
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredArticles.length} of {displayArticles.length} news
            articles
          </p>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
