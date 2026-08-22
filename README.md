# Chanvika PDF Editor — Core Editing Prototype v12

This is a deliberately small prototype to validate the core requirement before adding the rest of the application.

Core flow:
1. Upload a native/text PDF.
2. Each detected PDF text run is represented once in an aligned editable layer.
3. Click a text run.
4. It becomes the only visible editable representation at that location.
5. Type/delete/replace.
6. Export PDF.

Important limitation:
- This prototype is for native text PDFs.
- Scanned/image PDFs require OCR.
- PDF fonts/layouts can vary; export currently embeds a standard font for changed text.
- This is a proof-of-concept for the editing architecture, not yet the final all-tools product.
