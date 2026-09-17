"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createGuestAction,
  createGuestFromUnmatchedAction,
  createGuestGroupAction,
  deleteGuestAction,
  deleteGuestGroupAction,
  discardUnmatchedAction,
  linkUnmatchedAction,
  setGuestGroupAction,
  updateGuestAction,
} from "@/app/actions/guests";
import type {
  AdminGuest,
  AdminUnmatched,
  GuestBoard,
  GuestStatus,
} from "@/lib/content/guests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminFieldClass,
} from "@/components/admin/field-classes";

type GuestPanelProps = {
  board: GuestBoard;
};

function statusLabel(status: GuestStatus): string {
  if (status === "confirmed") return "Confirmou";
  if (status === "declined") return "Não vai";
  return "Ainda não respondeu";
}

export function GuestPanel({ board }: GuestPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editing, setEditing] = useState<AdminGuest | null>(null);
  const [toDelete, setToDelete] = useState<AdminGuest | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [toDiscard, setToDiscard] = useState<AdminUnmatched | null>(null);
  const [fullName, setFullName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [groupLabel, setGroupLabel] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return board.guests;
    return board.guests.filter((guest) =>
      guest.fullName.toLowerCase().includes(needle),
    );
  }, [board.guests, query]);

  async function run(action: () => Promise<{ ok: true } | { ok: false; error: string } | null>) {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result && !result.ok) {
      setError(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  async function submitCreate(event: React.FormEvent) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("fullName", fullName);
    formData.set("groupId", groupId);
    const ok = await run(() => createGuestAction(null, formData));
    if (ok) {
      setCreating(false);
      setFullName("");
      setGroupId("");
    }
  }

  async function submitEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData();
    formData.set("id", editing.id);
    formData.set("fullName", fullName);
    formData.set("groupId", groupId);
    const ok = await run(() => updateGuestAction(null, formData));
    if (ok) setEditing(null);
  }

  async function submitGroup(event: React.FormEvent) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("label", groupLabel);
    const ok = await run(() => createGuestGroupAction(null, formData));
    if (ok) {
      setCreatingGroup(false);
      setGroupLabel("");
    }
  }

  async function confirmDeleteGuest() {
    if (!toDelete) return;
    const formData = new FormData();
    formData.set("id", toDelete.id);
    const ok = await run(() => deleteGuestAction(formData));
    if (ok) setToDelete(null);
  }

  async function confirmDeleteGroup() {
    if (!groupToDelete) return;
    const formData = new FormData();
    formData.set("id", groupToDelete);
    const ok = await run(() => deleteGuestGroupAction(formData));
    if (ok) setGroupToDelete(null);
  }

  async function confirmDiscard() {
    if (!toDiscard) return;
    const formData = new FormData();
    formData.set("id", toDiscard.id);
    const ok = await run(() => discardUnmatchedAction(formData));
    if (ok) setToDiscard(null);
  }

  async function changeGroup(guestId: string, nextGroupId: string) {
    const formData = new FormData();
    formData.set("guestId", guestId);
    formData.set("groupId", nextGroupId);
    await run(() => setGuestGroupAction(formData));
  }

  async function link(unmatchedId: string, guestId: string) {
    if (!guestId) return;
    const formData = new FormData();
    formData.set("id", unmatchedId);
    formData.set("guestId", guestId);
    await run(() => linkUnmatchedAction(formData));
  }

  async function createFrom(unmatchedId: string) {
    const formData = new FormData();
    formData.set("id", unmatchedId);
    await run(() => createGuestFromUnmatchedAction(formData));
  }

  const ungrouped = filtered.filter((guest) => !guest.groupId);

  return (
    <div className="space-y-8">
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            disabled={busy}
            className="h-11 min-h-11 bg-gold text-navy hover:bg-gold/90"
            onClick={() => {
              setFullName("");
              setGroupId("");
              setCreating(true);
            }}
          >
            Adicionar convidado
          </Button>
          <Button
            type="button"
            disabled={busy}
            variant="outline"
            className="h-11 min-h-11 border-gold/60 text-navy"
            onClick={() => {
              setGroupLabel("");
              setCreatingGroup(true);
            }}
          >
            Novo grupo
          </Button>
        </div>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar na lista"
          className={adminFieldClass}
        />

        {board.groups.map((group) => {
          const people = filtered.filter((guest) => guest.groupId === group.id);
          return (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-xl">{group.label}</h2>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 min-h-11 text-navy/70"
                  disabled={busy}
                  onClick={() => setGroupToDelete(group.id)}
                >
                  Remover grupo
                </Button>
              </div>
              {people.length === 0 ? (
                <p className="text-sm text-navy/60">Ninguém neste grupo.</p>
              ) : (
                people.map((guest) => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    groups={board.groups}
                    busy={busy}
                    onEdit={() => {
                      setFullName(guest.fullName);
                      setGroupId(guest.groupId ?? "");
                      setEditing(guest);
                    }}
                    onDelete={() => setToDelete(guest)}
                    onGroup={(value) => changeGroup(guest.id, value)}
                  />
                ))
              )}
            </div>
          );
        })}

        <div className="space-y-2">
          <h2 className="font-heading text-xl">Sem grupo</h2>
          {ungrouped.length === 0 ? (
            <p className="text-sm text-navy/60">
              {board.guests.length === 0
                ? "A lista ainda está vazia."
                : "Ninguém fora de grupo."}
            </p>
          ) : (
            ungrouped.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                groups={board.groups}
                busy={busy}
                onEdit={() => {
                  setFullName(guest.fullName);
                  setGroupId(guest.groupId ?? "");
                  setEditing(guest);
                }}
                onDelete={() => setToDelete(guest)}
                onGroup={(value) => changeGroup(guest.id, value)}
              />
            ))
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Confirmações avulsas</h2>
        {board.unmatched.length === 0 ? (
          <p className="text-sm text-navy/60">
            Nenhuma confirmação fora da lista.
          </p>
        ) : (
          board.unmatched.map((item) => (
            <UnmatchedCard
              key={item.id}
              item={item}
              guests={board.guests}
              busy={busy}
              onLink={(guestId) => link(item.id, guestId)}
              onCreate={() => createFrom(item.id)}
              onDiscard={() => setToDiscard(item)}
            />
          ))
        )}
      </section>

      <Dialog open={creating} onOpenChange={(open) => setCreating(open === true)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar convidado</DialogTitle>
            <DialogDescription>Uma pessoa por vez, nome e sobrenome.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <NameAndGroupFields
              fullName={fullName}
              groupId={groupId}
              groups={board.groups}
              onName={setFullName}
              onGroup={setGroupId}
            />
            <DialogFooter>
              <Button type="submit" disabled={busy} className="h-11 bg-gold text-navy">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => open !== true && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar convidado</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <NameAndGroupFields
              fullName={fullName}
              groupId={groupId}
              groups={board.groups}
              onName={setFullName}
              onGroup={setGroupId}
            />
            <DialogFooter>
              <Button type="submit" disabled={busy} className="h-11 bg-gold text-navy">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={creatingGroup} onOpenChange={(open) => setCreatingGroup(open === true)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo grupo</DialogTitle>
            <DialogDescription>Casal ou família, só para organizar a lista.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="group-label">Nome do grupo</Label>
              <Input
                id="group-label"
                value={groupLabel}
                onChange={(event) => setGroupLabel(event.target.value)}
                className={adminFieldClass}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy} className="h-11 bg-gold text-navy">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => open !== true && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover convidado?</DialogTitle>
            <DialogDescription>
              Some da lista e das sugestões. Não dá para desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={busy}
              className="bg-gold text-navy"
              onClick={confirmDeleteGuest}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(groupToDelete)}
        onOpenChange={(open) => open !== true && setGroupToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover grupo?</DialogTitle>
            <DialogDescription>
              As pessoas continuam na lista, só ficam sem grupo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setGroupToDelete(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={busy}
              className="bg-gold text-navy"
              onClick={confirmDeleteGroup}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toDiscard)} onOpenChange={(open) => open !== true && setToDiscard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar confirmação?</DialogTitle>
            <DialogDescription>
              Some só desta fila. Não cria convidado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setToDiscard(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={busy}
              className="bg-gold text-navy"
              onClick={confirmDiscard}
            >
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NameAndGroupFields({
  fullName,
  groupId,
  groups,
  onName,
  onGroup,
}: {
  fullName: string;
  groupId: string;
  groups: GuestBoard["groups"];
  onName: (value: string) => void;
  onGroup: (value: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="guest-full-name">Nome completo</Label>
        <Input
          id="guest-full-name"
          value={fullName}
          onChange={(event) => onName(event.target.value)}
          className={adminFieldClass}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="guest-group">Grupo (opcional)</Label>
        <select
          id="guest-group"
          value={groupId}
          onChange={(event) => onGroup(event.target.value)}
          className={adminFieldClass}
        >
          <option value="">Sem grupo</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

function GuestRow({
  guest,
  groups,
  busy,
  onEdit,
  onDelete,
  onGroup,
}: {
  guest: AdminGuest;
  groups: GuestBoard["groups"];
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onGroup: (groupId: string) => void;
}) {
  return (
    <div className="space-y-2 border border-beige px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-navy">{guest.fullName}</p>
          <p className="text-sm text-navy/70">{statusLabel(guest.status)}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="h-11 min-h-11" disabled={busy} onClick={onEdit}>
            Editar
          </Button>
          <Button type="button" variant="ghost" className="h-11 min-h-11" disabled={busy} onClick={onDelete}>
            Remover
          </Button>
        </div>
      </div>
      <select
        value={guest.groupId ?? ""}
        disabled={busy}
        onChange={(event) => onGroup(event.target.value)}
        className={adminFieldClass}
        aria-label={`Grupo de ${guest.fullName}`}
      >
        <option value="">Sem grupo</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function UnmatchedCard({
  item,
  guests,
  busy,
  onLink,
  onCreate,
  onDiscard,
}: {
  item: AdminUnmatched;
  guests: AdminGuest[];
  busy: boolean;
  onLink: (guestId: string) => void;
  onCreate: () => void;
  onDiscard: () => void;
}) {
  const [guestId, setGuestId] = useState("");
  return (
    <div className="space-y-3 border border-beige px-3 py-3">
      <p className="font-medium text-navy">{item.typedName}</p>
      <p className="text-sm text-navy/70">{item.attending ? "Vou" : "Não vai"}</p>
      <select
        value={guestId}
        disabled={busy}
        onChange={(event) => setGuestId(event.target.value)}
        className={adminFieldClass}
        aria-label="Vincular a um convidado"
      >
        <option value="">Vincular a…</option>
        {guests.map((guest) => (
          <option key={guest.id} value={guest.id}>
            {guest.fullName}
          </option>
        ))}
      </select>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="h-11 min-h-11 bg-gold text-navy"
          disabled={busy || !guestId}
          onClick={() => onLink(guestId)}
        >
          Vincular
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 min-h-11"
          disabled={busy}
          onClick={onCreate}
        >
          Criar convidado
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11 min-h-11"
          disabled={busy}
          onClick={onDiscard}
        >
          Descartar
        </Button>
      </div>
    </div>
  );
}
