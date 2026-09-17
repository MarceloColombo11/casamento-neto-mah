"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  createGiftAction,
  updateGiftAction,
  type GiftActionState,
} from "@/app/actions/gifts";
import type { AdminGift } from "@/lib/content/gifts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminFieldClass,
  adminTextareaClass,
} from "@/components/admin/field-classes";
import { uploadSiteImage } from "@/components/admin/upload-site-image";

type GiftFormProps = {
  gift?: AdminGift;
  onDone?: () => void;
};

export function GiftForm({ gift, onDone }: GiftFormProps) {
  const router = useRouter();
  const action = gift ? updateGiftAction : createGiftAction;
  const [state, formAction, pending] = useActionState(
    action,
    null as GiftActionState,
  );
  const [mediaId, setMediaId] = useState(gift?.mediaId ?? "");
  const [preview, setPreview] = useState(gift?.imageUrl ?? "");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      onDone?.();
      router.refresh();
    }
  }, [state, onDone, router]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const id = await uploadSiteImage(file);
      setMediaId(id);
      setPreview(URL.createObjectURL(file));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Não foi possível enviar a foto.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      {gift ? <input type="hidden" name="id" value={gift.id} /> : null}
      <input type="hidden" name="mediaId" value={mediaId} />

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={gift?.title}
          className={adminFieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <textarea
          id="description"
          name="description"
          required
          defaultValue={gift?.description}
          className={adminTextareaClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pix">Pix copia e cola (opcional)</Label>
        <textarea
          id="pix"
          name="pix"
          defaultValue={gift?.pix}
          spellCheck={false}
          placeholder="Cole o código gerado pelo banco, o que começa com 000201…"
          className={`${adminTextareaClass} font-mono text-sm`}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="suggestedValue">Valor sugerido (opcional)</Label>
        <Input
          id="suggestedValue"
          name="suggestedValue"
          defaultValue={gift?.suggestedValue}
          className={adminFieldClass}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="photo">Foto (opcional, até 4 MB)</Label>
        <Input
          id="photo"
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={adminFieldClass}
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        {preview ? (
          <Image
            src={preview}
            alt=""
            width={80}
            height={80}
            unoptimized
            className="mt-2 size-20 rounded-full object-cover"
          />
        ) : (
          <p className="text-sm text-navy/60">Sem foto, o site usa um visual genérico.</p>
        )}
        {uploading ? (
          <p className="text-sm text-navy/70">Enviando foto…</p>
        ) : null}
        {uploadError ? (
          <p className="text-sm text-red-700" role="alert">
            {uploadError}
          </p>
        ) : null}
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || uploading}
        className="h-11 min-h-11 w-full bg-gold text-navy hover:bg-gold/90"
      >
        {pending ? "Salvando…" : "Salvar presente"}
      </Button>
    </form>
  );
}
