import { validateSiteImageFile } from "@/lib/content/validation";

export async function uploadSiteImage(file: File): Promise<string> {
  const validation = validateSiteImageFile({
    mimeType: file.type || "image/jpeg",
    size: file.size,
  });
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const form = new FormData();
  form.set("file", file, file.name || "foto.jpg");

  const response = await fetch("/api/admin/media/upload", {
    method: "POST",
    body: form,
  });
  const done = (await response.json()) as {
    mediaId?: string;
    error?: string;
  };
  if (!response.ok || !done.mediaId) {
    throw new Error(done.error || "Não foi possível enviar a foto.");
  }
  return done.mediaId;
}
