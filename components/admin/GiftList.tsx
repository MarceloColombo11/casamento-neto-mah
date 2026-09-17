"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronDown, ChevronUp, Gift } from "lucide-react";
import {
  deleteGiftAction,
  reorderGiftsAction,
} from "@/app/actions/gifts";
import type { AdminGift } from "@/lib/content/gifts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GiftForm } from "@/components/admin/GiftForm";

type GiftListProps = {
  gifts: AdminGift[];
};

export function GiftList({ gifts }: GiftListProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminGift | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<AdminGift | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= gifts.length) return;
    const ids = gifts.map((item) => item.id);
    const [removed] = ids.splice(index, 1);
    ids.splice(next, 0, removed);
    setBusy(true);
    setError(null);
    const result = await reorderGiftsAction(ids);
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
    const result = await deleteGiftAction(formData);
    setBusy(false);
    if (result && !result.ok) {
      setError(result.error);
      return;
    }
    setToDelete(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        className="h-11 min-h-11 w-full bg-gold text-navy hover:bg-gold/90 sm:w-auto"
        onClick={() => setCreating(true)}
      >
        Adicionar presente
      </Button>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {gifts.length === 0 ? (
        <p className="text-navy/70">Ainda não há presentes.</p>
      ) : (
        <ul className="space-y-3">
          {gifts.map((gift, index) => (
            <li
              key={gift.id}
              className="flex flex-col gap-3 border border-beige bg-white p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {gift.imageUrl ? (
                  <Image
                    src={gift.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="size-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-sage/20 text-navy">
                    <Gift className="size-6" aria-hidden />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-heading text-lg font-semibold break-words">
                    {gift.title}
                  </p>
                  <p className="text-sm text-navy/60">
                    {gift.pix ? "Com Pix" : "Sem Pix"}
                  </p>
                </div>
              </div>
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
                  disabled={busy || index === gifts.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Descer"
                >
                  <ChevronDown />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 min-h-11"
                  onClick={() => setEditing(gift)}
                >
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 min-h-11"
                  onClick={() => setToDelete(gift)}
                >
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-navy">
              Novo presente
            </DialogTitle>
            <DialogDescription>
              Título e descrição são obrigatórios. A foto é opcional.
            </DialogDescription>
          </DialogHeader>
          <GiftForm onDone={() => setCreating(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-navy">
              Editar presente
            </DialogTitle>
            <DialogDescription>
              As alterações aparecem no site assim que salvar.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <GiftForm gift={editing} onDone={() => setEditing(null)} />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-navy">
              Remover este presente?
            </DialogTitle>
            <DialogDescription>
              Ele some do site de vez. Não dá para desfazer.
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
    </div>
  );
}
