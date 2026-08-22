# Chanvika PDF Editor v13 — Core

This build intentionally does NOT render an HTML text layer. The PDF canvas is the only visible document text. Transparent click targets identify PDF.js text runs; editing occurs in a side editor. On export, only changed text regions are covered and redrawn.

This validates the UI/selection architecture without duplicate visible text. It is still not a universal arbitrary-PDF content-stream rewriter: PDF internals vary, and exact embedded-font preservation requires a deeper parser.
