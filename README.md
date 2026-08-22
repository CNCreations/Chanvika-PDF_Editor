# Chanvika PDF Editor v9 — Click-to-Edit Fix

Critical fix for PDF text clicking:
- In Select/Edit mode, the drawing canvas is now click-through.
- PDF.js text spans are the active click targets.
- Clicking detected native PDF text opens it in the editor inspector.
- Whiteout/draw/highlight tools still use the overlay canvas.

Workflow:
Upload PDF → Select/Edit → click visible text → change text → Export PDF.

Scanned PDFs still require OCR for direct text selection.
