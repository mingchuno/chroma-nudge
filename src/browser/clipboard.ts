export async function copyHex(hex: string): Promise<string> {
  try {
    await navigator.clipboard.writeText(hex);
    return `${hex} copied.`;
  } catch {
    return `Copy is unavailable here. Select this value to copy: ${hex}`;
  }
}
