export function downloadFile(content: string | Blob, filename: string, mime: string) {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
