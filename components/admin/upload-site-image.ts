export async function uploadSiteImage(file: File): Promise<string> {
  const mimeType =
    file.type ||
    (file.name.toLowerCase().endsWith(".png")
      ? "image/png"
      : file.name.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : "image/jpeg");

  const sessionRes = await fetch("/api/admin/media/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name || "foto.jpg",
      mimeType,
      size: file.size,
      origin: window.location.origin,
    }),
  });
  const session = (await sessionRes.json()) as {
    uploadUrl?: string;
    pendingToken?: string;
    error?: string;
  };
  if (!sessionRes.ok || !session.uploadUrl || !session.pendingToken) {
    throw new Error(session.error || "Não foi possível iniciar o envio.");
  }

  const put = await fetch(session.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: file,
  });
  if (!put.ok) {
    throw new Error("Upload incompleto. Tente de novo.");
  }

  const completeRes = await fetch("/api/admin/media/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pendingToken: session.pendingToken }),
  });
  const done = (await completeRes.json()) as {
    mediaId?: string;
    error?: string;
  };
  if (!completeRes.ok || !done.mediaId) {
    throw new Error(done.error || "Não foi possível concluir o envio.");
  }
  return done.mediaId;
}
