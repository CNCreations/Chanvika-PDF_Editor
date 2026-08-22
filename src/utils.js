export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadBytes(bytes, filename, type = "application/pdf") {
  downloadBlob(new Blob([bytes], { type }), filename);
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
}

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map(x => x+x).join("") : h;
  return {
    r: parseInt(n.slice(0,2),16) / 255,
    g: parseInt(n.slice(2,4),16) / 255,
    b: parseInt(n.slice(4,6),16) / 255
  };
}

export function safeName(name) {
  return (name || "document").replace(/\.[^.]+$/, "").replace(/[^\w\-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "document";
}
