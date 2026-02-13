import React, { useState, useEffect } from "react";
import { Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Paperclip, Loader2 } from "lucide-react";
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
import { articlesAPI, categoriesAPI, Article, Category } from "@/lib/api";

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: string;
  previewText: string;
  attachments?: Attachment[];
}

interface NewsFeedProps {
  articles?: NewsArticle[];
  useApi?: boolean;
}

const ARTICLES_PER_PAGE = 4;

const NewsFeed = ({ articles = [], useApi = false }: NewsFeedProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedArticles, setExpandedArticles] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [apiArticles, setApiArticles] = useState<NewsArticle[]>([]);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalArticles, setTotalArticles] = useState(0);

  // Fetch articles from API if useApi is true
  useEffect(() => {
    if (useApi) {
      fetchArticlesFromApi();
      fetchCategoriesFromApi();
    }
  }, [useApi, currentPage, selectedCategory, searchTerm]);

  const fetchArticlesFromApi = async () => {
    setLoading(true);
    console.log('[DEBUG NewsFeed] Fetching articles with params:', {
      page: currentPage,
      limit: ARTICLES_PER_PAGE,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchTerm || undefined,
      status: 'published'
    });
    
    try {
      const result = await articlesAPI.getAll({
        page: currentPage,
        limit: ARTICLES_PER_PAGE,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined,
        status: 'published'
      });
      
      console.log('[DEBUG NewsFeed] API result:', {
        success: result.success,
        hasData: !!result.data,
        articleCount: result.data?.articles?.length || 0,
        message: result.message
      });
      
      if (result.success && result.data) {
        const mappedArticles: NewsArticle[] = result.data.articles.map((article: Article) => ({
          id: article.id,
          title: article.title,
          content: article.content,
          author: article.author_name || 'Unknown',
          date: article.published_at ? new Date(article.published_at).toISOString().split('T')[0] : article.created_at.split('T')[0],
          category: article.category_name || 'General',
          previewText: article.excerpt || article.content.substring(0, 150) + '...',
          attachments: article.attachments?.map(att => ({
            id: att.id,
            name: att.original_name,
            url: att.url,
            type: att.mime_type
          }))
        }));
        console.log('[DEBUG NewsFeed] Mapped articles:', mappedArticles.length);
        setApiArticles(mappedArticles);
        setTotalPages(result.data.pagination.pages || 1);
        setTotalArticles(result.data.pagination.total || mappedArticles.length);
      } else {
        console.warn('[DEBUG NewsFeed] Failed to fetch articles:', result.message);
      }
    } catch (error) {
      console.error('[DEBUG NewsFeed] Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesFromApi = async () => {
    try {
      const result = await categoriesAPI.getAll();
      if (result.success && result.data) {
        setApiCategories(result.data.map((cat: Category) => cat.name));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

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
    {
      id: "5",
      title: "Employee Recognition Program",
      content:
        "We are pleased to introduce our new Employee Recognition Program! This initiative aims to celebrate and reward outstanding contributions from our team members. Nominations are now open for the monthly spotlight award. Winners will receive a bonus and featured recognition on our internal communications.",
      author: "HR Department",
      date: "2023-05-28",
      category: "HR",
      previewText:
        "We are pleased to introduce our new Employee Recognition Program! This initiative aims to celebrate and reward outstanding contributions...",
    },
    {
      id: "6",
      title: "New Partnership Announcement",
      content:
        "We are thrilled to announce a strategic partnership with TechCorp Industries. This collaboration will enable us to expand our service offerings and reach new markets. More details will be shared in the upcoming town hall meeting scheduled for next Friday.",
      author: "Executive Team",
      date: "2023-05-20",
      category: "Announcements",
      previewText:
        "We are thrilled to announce a strategic partnership with TechCorp Industries...",
    },
  ];

  // Determine which articles to display
  const displayArticles = useApi 
    ? apiArticles 
    : (articles.length > 0 ? articles : defaultArticles);

  // Get unique categories for filter
  const categories = useApi && apiCategories.length > 0
    ? ["all", ...apiCategories]
    : ["all", ...new Set(displayArticles.map((article) => article.category))];

  // Filter articles based on search term and category (client-side if not using API)
  const filteredArticles = useApi 
    ? displayArticles 
    : displayArticles.filter((article) => {
        const matchesSearch =
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" || article.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });

  // Pagination (client-side if not using API)
  const clientTotalPages = useApi ? totalPages : Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const paginatedArticles = useApi ? filteredArticles : filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    if (!useApi) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedCategory, useApi]);

  // Toggle article expansion
  const toggleArticleExpansion = (id: string) => {
    setExpandedArticles((prev) =>
      prev.includes(id)
        ? prev.filter((articleId) => articleId !== id)
        : [...prev, id],
    );
  };

  const goToPage = (page: number) => {
    const maxPages = useApi ? totalPages : clientTotalPages;
    if (page >= 1 && page <= maxPages) {
      setCurrentPage(page);
      // Scroll to top of news section
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-background p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          {paginatedArticles.map((article) => {
            const isExpanded = expandedArticles.includes(article.id);

            return (
              <Card
                key={article.id}
                className="w-full"
                style={{
                  backgroundColor: 'var(--article-card-bg, hsl(var(--card)))',
                  borderColor: 'var(--article-card-border, hsl(var(--border)))',
                }}
              >
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
                  {isExpanded ? (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  ) : (
                    <p className="text-sm">{article.previewText}</p>
                  )}
                  
                  {/* Attachments */}
                  {article.attachments && article.attachments.length > 0 && isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Attachments:</p>
                      <div className="flex flex-wrap gap-2">
                        {article.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-muted border rounded-md text-sm hover:bg-muted/80 transition-colors"
                          >
                            <Paperclip className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{attachment.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* Pagination */}
      {(useApi ? totalPages > 1 : filteredArticles.length > ARTICLES_PER_PAGE) && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: useApi ? totalPages : clientTotalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === (useApi ? totalPages : clientTotalPages)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {filteredArticles.length > 0 && (
        <div className="mt-6">
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground text-center">
            {useApi 
              ? `Showing ${(currentPage - 1) * ARTICLES_PER_PAGE + 1}-${Math.min(currentPage * ARTICLES_PER_PAGE, totalArticles)} of ${totalArticles} news articles`
              : `Showing ${startIndex + 1}-${Math.min(startIndex + ARTICLES_PER_PAGE, filteredArticles.length)} of ${filteredArticles.length} news articles`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
