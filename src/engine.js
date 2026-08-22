import { PDFDocument, rgb, degrees, StandardFonts } from "./pdf.js";
import { hexToRgb, uid } from "./utils.js";

export async function loadPdf(bytes) {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: false });
  return doc;
}

export async function mergePdfs(files) {
  const out = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const src = await PDFDocument.load(bytes);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach(p => out.addPage(p));
  }
  return out.save();
}

export async function exportEditedPdf(sourceBytes, pagesState, overlays, metadata = {}) {
  const doc = await PDFDocument.load(sourceBytes);
  const fontCache = new Map();

  const getFont = async (name = "Helvetica") => {
    if (fontCache.has(name)) return fontCache.get(name);
    let font = await doc.embedFont(
      name === "Times-Roman" ? StandardFonts.TimesRoman :
      name === "Courier" ? StandardFonts.Courier :
      StandardFonts.Helvetica
    );
    fontCache.set(name, font);
    return font;
  };

  // Page operations are applied from the original page set.
  // Reordering is represented by copying pages into a fresh document.
  let working = doc;
  const indices = pagesState.map(p => p.originalIndex);
  if (indices.some((v, i) => v !== i)) {
    const reordered = await PDFDocument.create();
    const copied = await reordered.copyPages(doc, indices);
    copied.forEach(p => reordered.addPage(p));
    working = reordered;
  }

  // Deletions can be represented by pagesState length/indices.
  if (pagesState.length !== working.getPageCount()) {
    const keep = pagesState.map((_, i) => i);
    const filtered = await PDFDocument.create();
    const copied = await filtered.copyPages(working, keep);
    copied.forEach(p => filtered.addPage(p));
    working = filtered;
  }

  for (const [pageIndexString, items] of Object.entries(overlays)) {
    const pageIndex = Number(pageIndexString);
    if (!items?.length || !working.getPage(pageIndex)) continue;
    const page = working.getPage(pageIndex);
    const { width, height } = page.getSize();

    for (const item of items) {
      const x = item.x * width;
      const y = height - item.y * height;
      if (item.type === "text") {
        const font = await getFont(item.font);
        const c = hexToRgb(item.color || "#111827");
        page.drawText(item.text || "", {
          x, y, size: Number(item.size) || 16,
          font, color: rgb(c.r,c.g,c.b),
          opacity: item.opacity ?? 1,
          rotate: degrees(item.rotation || 0)
        });
      } else if (item.type === "highlight") {
        const c = hexToRgb(item.color || "#ffe66d");
        page.drawRectangle({
          x, y: y - item.height * height,
          width: item.width * width, height: item.height * height,
          color: rgb(c.r,c.g,c.b), opacity: item.opacity ?? 0.35
        });
      } else if (item.type === "rect") {
        const c = hexToRgb(item.color || "#4263ff");
        page.drawRectangle({
          x, y: y - item.height * height,
          width: item.width * width, height: item.height * height,
          borderColor: rgb(c.r,c.g,c.b), borderWidth: item.stroke || 2,
          opacity: item.opacity ?? 1
        });
      } else if (item.type === "draw") {
        const c = hexToRgb(item.color || "#111827");
        const pts = item.points || [];
        for (let i=1;i<pts.length;i++) {
          const a = pts[i-1], b = pts[i];
          page.drawLine({
            start: {x: a.x*width, y: height-a.y*height},
            end: {x: b.x*width, y: height-b.y*height},
            thickness: item.stroke || 2,
            color: rgb(c.r,c.g,c.b)
          });
        }
      } else if (item.type === "watermark") {
        const font = await getFont("Helvetica");
        const c = hexToRgb(item.color || "#6b7280");
        page.drawText(item.text || "PaperFlow", {
          x: width*0.18, y: height*0.45, size: Number(item.size)||42,
          font, color: rgb(c.r,c.g,c.b), opacity: 0.18,
          rotate: degrees(-35)
        });
      }
    }
  }

  if (metadata.title !== undefined) working.setTitle(metadata.title);
  if (metadata.author !== undefined) working.setAuthor(metadata.author);
  if (metadata.subject !== undefined) working.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) working.setKeywords(metadata.keywords ? metadata.keywords.split(",").map(s=>s.trim()) : []);

  return working.save({ useObjectStreams: true });
}

export async function imagesToPdf(files) {
  const pdf = await PDFDocument.create();
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let image;
    if (file.type === "image/png" || /\.png$/i.test(file.name)) image = await pdf.embedPng(bytes);
    else image = await pdf.embedJpg(bytes);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x:0, y:0, width:image.width, height:image.height });
  }
  return pdf.save();
}

export async function extractPages(bytes, pageIndices) {
  const src = await PDFDocument.load(bytes);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, pageIndices);
  pages.forEach(p => out.addPage(p));
  return out.save();
}

export async function rotatePdf(bytes, angle = 90) {
  const doc = await PDFDocument.load(bytes);
  doc.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle + angle) % 360)));
  return doc.save();
}

export async function metadataFromPdf(bytes) {
  const doc = await PDFDocument.load(bytes);
  return {
    pages: doc.getPageCount(),
    title: doc.getTitle() || "",
    author: doc.getAuthor() || "",
    subject: doc.getSubject() || "",
    keywords: (doc.getKeywords() || []).join(", ")
  };
}

export function createOverlay(type, values={}) {
  return { id: uid(type), type, ...values };
}
