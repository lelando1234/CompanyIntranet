# PDF Viewer Feature Guide

## Overview

The PDF viewer feature allows you to upload PDF documents as article attachments and display them with an interactive, article-style reading experience. Users can navigate through pages, zoom in/out, and view PDFs in fullscreen mode.

## Features

### For Readers (Dashboard)
- **Page Navigation**: Browse PDF pages with Previous/Next buttons
- **Zoom Controls**: Adjust zoom level from 50% to 250%
- **Fullscreen Mode**: Expand to full screen for better reading
- **Download**: Download the PDF file for offline viewing
- **Responsive Design**: Works on desktop and mobile devices

### For Admins (Article Creation)
- **Easy Upload**: Use the attachment button in the Rich Text Editor
- **Automatic Detection**: PDFs are automatically detected and displayed with a PDF icon
- **File Management**: Add or remove PDF attachments before publishing

## How to Use

### Uploading a PDF to an Article

1. Go to **Admin Panel** → **News Articles**
2. Click **Add Article** or edit an existing article
3. In the article editor, click the **Attachment** button (paperclip icon) in the toolbar
4. Choose **Upload File** tab
5. Select your PDF file (max 25MB)
6. Click **Upload**
7. The PDF will be added to the attachments list
8. Save/publish your article

### Viewing PDFs in Articles

1. Navigate to **Dashboard** → **Company News**
2. Find an article with a PDF attachment
3. Click **Read more** to expand the article
4. In the Attachments section, PDFs will have a red PDF icon
5. Click on the PDF to open the viewer
6. Use the controls:
   - **Previous/Next**: Navigate between pages
   - **Zoom In/Out**: Adjust zoom level
   - **Fullscreen**: Toggle fullscreen mode
   - **Download**: Download the PDF file
   - **X**: Close the viewer

## Technical Details

### Supported Features
- **File Format**: PDF documents (.pdf)
- **Max File Size**: 25MB
- **Page Navigation**: Keyboard and button controls
- **Text Selection**: Copy text from PDFs (if not protected)
- **Zoom Levels**: 50%, 75%, 100%, 125%, 150%, 175%, 200%, 225%, 250%

### Backend Support
- PDFs are stored in `backend/uploads/attachments/`
- Database tracks: filename, original name, mime type, size, and URL
- Automatic cleanup when articles are deleted

### Frontend Components
- **PDFViewer Component**: `src/components/PDFViewer.tsx`
- **NewsFeed Integration**: `src/components/NewsFeed.tsx`
- **RichTextEditor**: `src/components/RichTextEditor.tsx`

## Best Practices

### For Content Creators
1. **Optimize PDFs**: Compress PDFs before uploading to reduce load times
2. **File Naming**: Use descriptive filenames (e.g., "Q4-Financial-Report-2024.pdf")
3. **Page Count**: Keep PDFs under 50 pages for best performance
4. **File Size**: Aim for under 10MB when possible

### For Users
1. **Browser Compatibility**: Use modern browsers (Chrome, Firefox, Safari, Edge)
2. **Internet Connection**: Stable connection recommended for large PDFs
3. **Navigation**: Use keyboard arrows for faster page navigation
4. **Mobile**: Portrait mode works best for reading PDFs

## Troubleshooting

### PDF Won't Load
- Check if the file is a valid PDF
- Ensure file size is under 25MB
- Verify internet connection
- Try refreshing the page

### Slow Loading
- Large PDFs (>10MB) may take longer to load
- Check your internet speed
- Consider compressing the PDF

### Display Issues
- Clear browser cache
- Update to the latest browser version
- Disable browser extensions that might interfere

## Future Enhancements

Potential improvements for future versions:
- [ ] Page thumbnails sidebar
- [ ] Search within PDF
- [ ] Bookmarks/annotations
- [ ] Print functionality
- [ ] Rotate pages
- [ ] Multi-page view
- [ ] Touch gestures for mobile

## Dependencies

- **react-pdf**: PDF rendering library
- **pdfjs-dist**: PDF.js worker for parsing
- **ShadCN UI**: Dialog and button components

## Support

For issues or questions:
1. Check this guide
2. Review the TROUBLESHOOTING.md file
3. Check browser console for errors
4. Contact your system administrator
