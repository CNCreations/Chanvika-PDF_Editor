# Chanvika PDF Editor v14 — Delete/Replace Export Fix

Focused prototype for validating that edits become visible in the exported PDF.

- PDF canvas is the only visible page.
- Transparent hit targets select detected PDF text.
- Sidebar changes the selected run.
- Delete sets replacement text to empty.
- Export changes only modified text regions.

This remains a visual PDF editing strategy rather than a universal low-level PDF content-stream parser. Exact embedded fonts and arbitrary PDF operators require a deeper PDF parser.
