import React, { useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import { Node } from "@tiptap/core";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  ImageIcon,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Paperclip,
  Upload,
  Code2,
  Images,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { settingsAPI } from "@/lib/api";

// Custom TipTap extension for image carousel
const ImageCarousel = Node.create({
  name: "imageCarousel",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: element => {
          const imagesAttr = element.getAttribute("data-images");
          return imagesAttr ? JSON.parse(imagesAttr) : [];
        },
        renderHTML: attributes => {
          return {
            "data-images": JSON.stringify(attributes.images),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type=\"image-carousel\"]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const images = HTMLAttributes["data-images"] ? JSON.parse(HTMLAttributes["data-images"]) : [];
    
    return [
      "div",
      {
        "data-type": "image-carousel",
        "data-images": HTMLAttributes["data-images"],
        class: "image-carousel-wrapper my-4",
      },
      [
        "div",
        { class: "image-carousel-container relative max-w-3xl mx-auto" },
        ...images.map((src: string, index: number) => [
          "img",
          {
            src,
            alt: `Slide ${index + 1}`,
            class: index === 0 ? "carousel-image block" : "carousel-image hidden",
            style: "width: 100%; height: auto; border-radius: 8px;",
          },
        ]),
        [
          "button",
          {
            class: "carousel-prev absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg",
            onclick: "const container = this.parentElement; const images = container.querySelectorAll('.carousel-image'); let current = Array.from(images).findIndex(img => !img.classList.contains('hidden')); images[current].classList.add('hidden'); current = (current - 1 + images.length) % images.length; images[current].classList.remove('hidden');",
          },
          "←",
        ],
        [
          "button",
          {
            class: "carousel-next absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg",
            onclick: "const container = this.parentElement; const images = container.querySelectorAll('.carousel-image'); let current = Array.from(images).findIndex(img => !img.classList.contains('hidden')); images[current].classList.add('hidden'); current = (current + 1) % images.length; images[current].classList.remove('hidden');",
          },
          "→",
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setImageCarousel: (images: string[]) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { images },
        });
      },
    };
  },
});

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  attachments?: Attachment[];
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

const RichTextEditor = ({
  content,
  onChange,
  attachments = [],
  onAttachmentsChange,
}: RichTextEditorProps) => {
  const [isImageDialogOpen, setIsImageDialogOpen] = React.useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = React.useState(false);
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = React.useState(false);
  const [isCarouselDialogOpen, setIsCarouselDialogOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkText, setLinkText] = React.useState("");
  const [embedCode, setEmbedCode] = React.useState("");
  const [carouselImages, setCarouselImages] = React.useState<string[]>([]);
  const [carouselImageInput, setCarouselImageInput] = React.useState("");
  const [imageUploading, setImageUploading] = React.useState(false);
  const [attachmentUploading, setAttachmentUploading] = React.useState(false);
  const [carouselUploading, setCarouselUploading] = React.useState(false);
  
  const imageFileRef = useRef<HTMLInputElement>(null);
  const attachmentFileRef = useRef<HTMLInputElement>(null);
  const carouselFileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: "w-full aspect-video rounded-lg my-4",
        },
      }),
      ImageCarousel,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none",
      },
    },
  });

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setIsImageDialogOpen(false);
    }
  }, [editor, imageUrl]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file || !editor) return;
    
    setImageUploading(true);
    try {
      // Use the settings API to upload the file
      const formData = new FormData();
      formData.append('file', file);
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || "";
      if (!API_BASE_URL) {
        // Fallback: create a local blob URL for preview (won't persist)
        const url = URL.createObjectURL(file);
        editor.chain().focus().setImage({ src: url }).run();
        setIsImageDialogOpen(false);
        return;
      }
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/settings/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      
      const result = await response.json();
      if (result.success && result.data?.url) {
        editor.chain().focus().setImage({ src: result.data.url }).run();
        setIsImageDialogOpen(false);
      } else {
        console.error('Image upload failed:', result.message);
        alert('Failed to upload image. Please try again or use a URL.');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      // Fallback to blob URL
      const url = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: url }).run();
      setIsImageDialogOpen(false);
    } finally {
      setImageUploading(false);
    }
  }, [editor]);

  const handleAttachmentUpload = useCallback(async (file: File) => {
    if (!file) return;
    
    setAttachmentUploading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "";
      if (!API_BASE_URL) {
        // No API configured - warn user that attachments won't persist
        console.warn('No VITE_API_URL configured - attachment will not be saved permanently');
        alert('Warning: Backend API not configured. Attachment will be lost when you save. Please configure the API URL.');
        const newAttachment: Attachment = {
          id: Date.now().toString(),
          name: file.name,
          url: URL.createObjectURL(file),
          type: file.type,
        };
        if (onAttachmentsChange) {
          onAttachmentsChange([...attachments, newAttachment]);
        }
        setIsAttachmentDialogOpen(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/settings/upload/attachment`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      
      // Safely parse JSON response
      let result;
      try {
        const text = await response.text();
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse upload response. Status:', response.status, 'StatusText:', response.statusText);
        alert(`Failed to upload attachment (server returned status ${response.status}). The file may be too large or the server may be misconfigured.`);
        return;
      }
      
      if (response.ok && result.success && result.data) {
        const newAttachment: Attachment = {
          id: result.data.id || Date.now().toString(),
          name: result.data.original_name || file.name,
          url: result.data.url,
          type: result.data.mime_type || file.type,
        };
        if (onAttachmentsChange) {
          onAttachmentsChange([...attachments, newAttachment]);
        }
        setIsAttachmentDialogOpen(false);
      } else {
        console.error('Attachment upload failed:', result.message, 'Status:', response.status);
        alert(`Failed to upload attachment: ${result.message || 'Unknown error'}. Please try again.`);
      }
    } catch (error) {
      console.error('Attachment upload error:', error);
      alert('Failed to upload attachment. The file will not be saved permanently. Please check your connection and try again.');
      // Fallback to local blob - but warn that it won't persist
      const newAttachment: Attachment = {
        id: Date.now().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type,
      };
      if (onAttachmentsChange) {
        onAttachmentsChange([...attachments, newAttachment]);
      }
      setIsAttachmentDialogOpen(false);
    } finally {
      setAttachmentUploading(false);
    }
  }, [attachments, onAttachmentsChange]);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      if (linkText) {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}">${linkText}</a>`)
          .run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl("");
      setLinkText("");
      setIsLinkDialogOpen(false);
    }
  }, [editor, linkUrl, linkText]);

  const addEmbed = useCallback(() => {
    if (embedCode && editor) {
      // Check if it's a YouTube URL
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = embedCode.match(youtubeRegex);
      
      if (match && match[1]) {
        // It's a YouTube URL, use the YouTube extension
        editor.chain().focus().setYoutubeVideo({
          src: embedCode,
          width: 640,
          height: 360,
        }).run();
      } else {
        // It's HTML embed code, insert directly
        editor.chain().focus().insertContent(embedCode).run();
      }
      
      setEmbedCode("");
      setIsEmbedDialogOpen(false);
    }
  }, [editor, embedCode]);

  const handleCarouselImageUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0 || !editor) return;
    
    setCarouselUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "";
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!API_BASE_URL) {
          // Fallback: create local blob URLs
          uploadedUrls.push(URL.createObjectURL(file));
          continue;
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/settings/upload/image`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        
        const result = await response.json();
        if (result.success && result.data?.url) {
          uploadedUrls.push(result.data.url);
        } else {
          console.error('Image upload failed:', result.message);
          uploadedUrls.push(URL.createObjectURL(file));
        }
      }
      
      setCarouselImages([...carouselImages, ...uploadedUrls]);
    } catch (error) {
      console.error('Carousel upload error:', error);
      alert('Some images failed to upload. Please try again.');
    } finally {
      setCarouselUploading(false);
    }
  }, [editor, carouselImages]);

  const addCarouselImage = useCallback(() => {
    if (carouselImageInput) {
      setCarouselImages([...carouselImages, carouselImageInput]);
      setCarouselImageInput("");
    }
  }, [carouselImages, carouselImageInput]);

  const removeCarouselImage = useCallback((index: number) => {
    setCarouselImages(carouselImages.filter((_, i) => i !== index));
  }, [carouselImages]);

  const insertCarousel = useCallback(() => {
    if (carouselImages.length > 0 && editor) {
      editor.chain().focus().setImageCarousel(carouselImages).run();
      setCarouselImages([]);
      setIsCarouselDialogOpen(false);
    }
  }, [editor, carouselImages]);

  const openAttachmentDialog = () => {
    setIsAttachmentDialogOpen(true);
  };

  const removeAttachment = (id: string) => {
    if (onAttachmentsChange) {
      onAttachmentsChange(attachments.filter((a) => a.id !== id));
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        {/* Font Size / Heading */}
        <Select
          value={
            editor.isActive("heading", { level: 1 })
              ? "h1"
              : editor.isActive("heading", { level: 2 })
                ? "h2"
                : editor.isActive("heading", { level: 3 })
                  ? "h3"
                  : "p"
          }
          onValueChange={(value) => {
            if (value === "p") {
              editor.chain().focus().setParagraph().run();
            } else {
              const level = parseInt(value.replace("h", "")) as 1 | 2 | 3;
              editor.chain().focus().toggleHeading({ level }).run();
            }
          }}
        >
          <SelectTrigger className="w-[130px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Paragraph</SelectItem>
            <SelectItem value="h1">Heading 1</SelectItem>
            <SelectItem value="h2">Heading 2</SelectItem>
            <SelectItem value="h3">Heading 3</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Formatting */}
        <Button
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("underline") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-8 w-8 p-0"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("strike") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="h-8 w-8 p-0"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Lists */}
        <Button
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-8 w-8 p-0"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Media */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsImageDialogOpen(true)}
          className="h-8 w-8 p-0"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCarouselDialogOpen(true)}
          className="h-8 w-8 p-0"
          title="Insert Image Carousel"
        >
          <Images className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsLinkDialogOpen(true)}
          className="h-8 w-8 p-0"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEmbedDialogOpen(true)}
          className="h-8 w-8 p-0"
          title="Embed Video/HTML"
        >
          <Code2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={openAttachmentDialog}
          className="h-8 w-8 p-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-background" />

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="p-3 border-t bg-muted/30">
          <p className="text-sm font-medium mb-2">Attachments:</p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-md text-sm"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{attachment.name}</span>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="url">Image URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Image File</Label>
                  <Input
                    ref={imageFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={imageUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, GIF, WebP
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImageDialogOpen(false)} disabled={imageUploading}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => imageFileRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? "Uploading..." : "Select File"}
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="url" className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addImage}>Insert Image</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Link Dialog */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkText">Link Text (optional)</Label>
              <Input
                id="linkText"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Click here"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addLink}>Insert Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Dialog */}
      <Dialog open={isAttachmentDialogOpen} onOpenChange={setIsAttachmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Attachment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select File to Attach</Label>
              <Input
                ref={attachmentFileRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAttachmentUpload(file);
                }}
                disabled={attachmentUploading}
              />
              <p className="text-xs text-muted-foreground">
                Supported: PDF, Word, Excel, PowerPoint, Images, ZIP, CSV, Text files
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAttachmentDialogOpen(false)} disabled={attachmentUploading}>
              Cancel
            </Button>
            <Button 
              onClick={() => attachmentFileRef.current?.click()}
              disabled={attachmentUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {attachmentUploading ? "Uploading..." : "Select File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Embed Dialog */}
      <Dialog open={isEmbedDialogOpen} onOpenChange={setIsEmbedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Video or HTML</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="embedCode">YouTube URL or HTML Embed Code</Label>
              <textarea
                id="embedCode"
                value={embedCode}
                onChange={(e) => setEmbedCode(e.target.value)}
                placeholder="Paste YouTube URL (https://youtube.com/watch?v=...) or HTML embed code"
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              />
              <p className="text-xs text-muted-foreground">
                You can paste a YouTube URL or any HTML embed code (iframe, etc.)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmbedDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addEmbed}>Insert Embed</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Carousel Dialog */}
      <Dialog open={isCarouselDialogOpen} onOpenChange={setIsCarouselDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Insert Image Carousel</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Images</TabsTrigger>
              <TabsTrigger value="url">Add by URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Select Multiple Images</Label>
                  <Input
                    ref={carouselFileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) handleCarouselImageUpload(files);
                    }}
                    disabled={carouselUploading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Select multiple images to add to the carousel
                  </p>
                </div>
                {carouselImages.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Selected Images ({carouselImages.length})</Label>
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                      {carouselImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            onClick={() => removeCarouselImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCarouselDialogOpen(false);
                  setCarouselImages([]);
                }} disabled={carouselUploading}>
                  Cancel
                </Button>
                <Button 
                  onClick={insertCarousel}
                  disabled={carouselImages.length === 0 || carouselUploading}
                >
                  {carouselUploading ? "Uploading..." : "Insert Carousel"}
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="url" className="space-y-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="carouselImageUrl">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="carouselImageUrl"
                      value={carouselImageInput}
                      onChange={(e) => setCarouselImageInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCarouselImage();
                        }
                      }}
                    />
                    <Button onClick={addCarouselImage} disabled={!carouselImageInput}>
                      Add
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add images one by one using their URLs
                  </p>
                </div>
                {carouselImages.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Selected Images ({carouselImages.length})</Label>
                    <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
                      {carouselImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Slide ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            onClick={() => removeCarouselImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCarouselDialogOpen(false);
                  setCarouselImages([]);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={insertCarousel}
                  disabled={carouselImages.length === 0}
                >
                  Insert Carousel
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextEditor;
