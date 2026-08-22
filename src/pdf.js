import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export { pdfjsLib, PDFDocument, rgb, degrees, StandardFonts };
