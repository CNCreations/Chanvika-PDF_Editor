# Chanvika PDF Editor v10 — True Document-Layer Editor

This version changes the editing architecture: detected PDF text is represented as actual HTML text objects above the rendered PDF page. Clicking a text object selects it and turns it into a real textarea, allowing direct typing, deletion and replacement.

Workflow:
Upload → Edit → click any detected text → type directly → Export PDF.

Added text is also a real document object. Whiteout and other tools can be layered in later.

Limitations: PDFs vary widely. Scanned/image PDFs need OCR. Exact original embedded font preservation is not guaranteed.
