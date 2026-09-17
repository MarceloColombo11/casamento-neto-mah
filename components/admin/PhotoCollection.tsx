"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  addPhotoAction,
  deletePhotoAction,
  reorderPhotosAction,
} from "@/app/actions/photos";
import type { AdminPhoto } from "@/lib/content/photos";
import type { PhotoCollection } from "@/lib/content/validation";
import { photoLimit, photoLimitMessage } from "@/lib/content/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadSiteImage } from "@/components/admin/upload-site-image";
import { adminFieldClass } from "@/components/admin/field-classes";

type PhotoCollectionProps = {
  collection: PhotoCollection;
  title: string;
  description: string;
  photos: AdminPhoto[];
};

export function PhotoCollection({
  collection,
  title,
  description,
  photos,
}: PhotoCollectionProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminPhoto | null>(null);
  const atLimit = photos.length >= photoLimit(collection);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const mediaId = await uploadSiteImage(file);
      const result = await addPhotoAction(collection, mediaId);
      if (result && !result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= photos.length) return;
    const ids = photos.map((item) => item.id);
    const [removed] = ids.splice(index, 1);
    ids.splice(next, 0, removed);
    setBusy(true);
    setError(null);
    const result = await reorderPhotosAction(collection, ids);
    setBusy(false);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    setError(null);
    const formData = new FormData();
    formData.set("id", toDelete.id);
    const result = await deletePhotoAction(formData);
    setBusy(false);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    setToDelete(null);
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-navy/70">{description}</p>
      </div>

      <div className="space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={adminFieldClass}
          disabled={busy || atLimit}
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        {atLimit ? (
          <p className="text-sm text-navy/80">{photoLimitMessage(collection)}</p>
        ) : (
          <p className="text-sm text-navy/60">
            JPEG, PNG ou WebP, até 8 MB. {photos.length} de {photoLimit(collection)}.
          </p>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {photos.length === 0 ? (
        <p className="text-navy/70">Ainda não há fotos nesta coleção.</p>
      ) : (
        <ul className="space-y-3">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="flex flex-col gap-3 border border-beige p-3 sm:flex-row sm:items-center"
            >
              <Image
                src={photo.imageUrl}
                alt=""
                width={112}
                height={80}
                unoptimized
                className="h-28 w-full object-cover sm:h-20 sm:w-28 sm:shrink-0"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="min-h-11 min-w-11"
                  disabled={busy || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Subir"
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="min-h-11 min-w-11"
                  disabled={busy || index === photos.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Descer"
                >
                  <ChevronDown />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 min-h-11"
                  onClick={() => setToDelete(photo)}
                >
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-navy">
              Remover esta foto?
            </DialogTitle>
            <DialogDescription>
              Ela some do site de vez. Não dá para desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-h-11"
              onClick={() => setToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 min-h-11"
              disabled={busy}
              onClick={confirmDelete}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
