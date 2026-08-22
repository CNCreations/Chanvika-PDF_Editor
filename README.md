# PaperFlow

PaperFlow is a browser-first PDF workspace designed around local processing, a polished UI, and zero required backend infrastructure.

## Included

- Modern responsive landing page
- Local PDF loading and rendering with PDF.js
- Page thumbnails
- Zoom
- Page navigation
- Delete, rotate, duplicate, reorder pages
- Add text overlays
- Draw
- Highlight
- Add images
- Signature
- Watermark
- Undo/redo
- Export edited PDF with pdf-lib
- Merge multiple PDFs
- Split/extract selected pages
- PDF → JPG/PNG
- JPG/PNG → PDF
- Metadata editing
- Basic PDF health checks
- Dark/light UI preference
- GitHub Pages deployment workflow
- No AI API
- No application server required for the included browser-side tools

## Important conversion note

High-fidelity PDF ↔ Word/Excel/PowerPoint conversion is not honestly guaranteed by a zero-backend browser-only app. PaperFlow keeps those advanced conversion slots in the UI architecture so they can be added with a compatible local engine or an optional backend later. The current build does not fake a conversion result.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## GitHub Pages

1. Create a GitHub repository.
2. Upload this project.
3. Push to `main`.
4. In GitHub, open Settings → Pages.
5. Set the source to GitHub Actions.
6. The included `.github/workflows/deploy.yml` will build and deploy the site.

## Privacy

The included PDF editing/conversion tools operate in the browser. Files are not uploaded to a PaperFlow server because this project has no application backend.

## Ads

An `AdSlot` component is included as a safe integration point. Add a compliant ad provider only after reviewing its current policies and implementing its required script/configuration. Do not use deceptive download buttons or accidental-click placements.
