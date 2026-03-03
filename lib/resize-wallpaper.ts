"use client";

const MAX_SIZE = 1920;
const JPEG_QUALITY = 0.88;

/**
 * Сжимает изображение для обоев чата: макс. сторона MAX_SIZE, JPEG.
 * Вызывать только в браузере. При ошибке возвращает исходный файл.
 */
export async function resizeImageForWallpaper(file: File): Promise<File> {
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    let w = bitmap.width;
    let h = bitmap.height;
    if (w <= MAX_SIZE && h <= MAX_SIZE && file.type === "image/jpeg" && file.size < 800_000) {
      bitmap.close();
      return file;
    }
    if (w > MAX_SIZE || h > MAX_SIZE) {
      if (w > h) {
        h = Math.round((h * MAX_SIZE) / w);
        w = MAX_SIZE;
      } else {
        w = Math.round((w * MAX_SIZE) / h);
        h = MAX_SIZE;
      }
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!blob) return file;
    return new File([blob], "chat-wallpaper.jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
