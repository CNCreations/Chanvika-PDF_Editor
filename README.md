# Chanvika PDF Editor v6 — Word-style editor

Upload a PDF and edit it in a document-like workspace.

### Real functionality
- PDF.js page rendering
- Text objects with font, size, color, bold/italic
- Select and move added text
- Whiteout to cover existing content
- Add replacement text
- Highlight
- Rectangle
- Freehand draw
- Undo/redo
- Page navigation and zoom
- Export edited PDF with pdf-lib
- GitHub Pages deployment
- No AI API and no backend required

### Important limitation
A PDF is not a Word document. Arbitrary existing PDF text is not guaranteed to be directly editable with its original embedded font/style in every file. This version provides the practical PDF editing workflow: cover existing content and place replacement text, while newly added text is genuinely editable before export.

### Deploy
GitHub → Settings → Pages → Source: GitHub Actions.
