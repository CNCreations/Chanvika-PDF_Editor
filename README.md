# Chanvika PDF Editor v4

Colorful browser-first PDF toolkit for GitHub Pages. No AI API and no required backend.

## Working features
- PDF upload and drag/drop
- Visible selected-file cards in Editor, Converter, Split, Security and Doctor
- PDF page preview, navigation and zoom-ready viewer
- Editor tools that actually place annotations on the page: Text, Highlight, Whiteout, Draw, Rectangle
- Export annotations into a new PDF
- Merge PDFs
- Split/extract pages
- PDF -> JPG
- JPG/PNG -> PDF
- Metadata inspection/removal
- PDF health check/rebuild
- PWA/service worker
- GitHub Pages workflow

## Honest limitation
This editor does not pretend to rewrite arbitrary existing PDF text while preserving its original embedded font/layout. For an existing text block, use Whiteout + Text to create a visual replacement. Full structural text editing/OCR/font matching is a larger engine project. Open-source browser editors demonstrate that this is possible with a substantially larger PDF editing engine.

## Deploy
Settings -> Pages -> Source: GitHub Actions.
