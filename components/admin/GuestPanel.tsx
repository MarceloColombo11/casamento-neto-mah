"use client";

import { useMemo, useRef, useState } from "react";
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
} from "@/lib/content/guests";
import {
  guestStatusTag,
  unmatchedAttendanceTag,
} from "@/lib/content/guest-status";
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
import { adminFieldClass } from "@/components/admin/field-classes";

const tableFieldClass =
  "h-11 min-h-11 w-full min-w-0 rounded-md border border-beige bg-white px-2 text-sm text-navy outline-none placeholder:text-navy/40 focus-visible:border-gold focus-visible:ring-3 focus-visible:ring-gold/40";

type GuestPanelProps = {
  board: GuestBoard;
};

function StatusTag({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function GuestPanel({ board }: GuestPanelProps) {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editing, setEditing] = useState<AdminGuest | null>(null);
  const [toDelete, setToDelete] = useState<AdminGuest | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [toDiscard, setToDiscard] = useState<AdminUnmatched | null>(null);
  const [fullName, setFullName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [editName, setEditName] = useState("");
  const [editGroupId, setEditGroupId] = useState("");
  const [groupLabel, setGroupLabel] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return board.guests.filter((guest) => {
      if (needle && !guest.fullName.toLowerCase().includes(needle)) return false;
      if (groupFilter && guest.groupId !== groupFilter) return false;
      return true;
    });
  }, [board.guests, query, groupFilter]);

  async function run(
    action: () => Promise<{ ok: true } | { ok: false; error: string } | null>,
  ) {
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
      setFullName("");
      nameRef.current?.focus();
    }
  }

  async function submitEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData();
    formData.set("id", editing.id);
    formData.set("fullName", editName);
    formData.set("groupId", editGroupId);
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
    if (ok) {
      if (groupFilter === groupToDelete) setGroupFilter("");
      if (groupId === groupToDelete) setGroupId("");
      setGroupToDelete(null);
    }
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

  return (
    <div className="space-y-8">
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar na lista"
            className={adminFieldClass}
          />
          <select
            value={groupFilter}
            onChange={(event) => {
              const value = event.target.value;
              setGroupFilter(value);
              if (value) setGroupId(value);
            }}
            className={adminFieldClass}
            aria-label="Filtrar por grupo"
          >
            <option value="">Todos os grupos</option>
            {board.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
          <Button
            type="button"
            disabled={busy}
            variant="outline"
            className="h-11 min-h-11 shrink-0 border-gold/60 text-navy"
            onClick={() => {
              setGroupLabel("");
              setCreatingGroup(true);
            }}
          >
            Novo grupo
          </Button>
          {groupFilter ? (
            <Button
              type="button"
              disabled={busy}
              variant="ghost"
              className="h-11 min-h-11 shrink-0 text-navy/70"
              onClick={() => setGroupToDelete(groupFilter)}
            >
              Remover grupo
            </Button>
          ) : null}
        </div>

        <form onSubmit={submitCreate} className="overflow-x-auto border border-beige">
          <table className="w-full min-w-xl text-left">
            <thead>
              <tr className="bg-[#f7f4ef] text-xs font-medium text-navy/60">
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Grupo</th>
                <th className="px-3 py-2 font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-beige bg-white">
                <td className="px-2 py-2">
                  <Input
                    ref={nameRef}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      void submitCreate(event);
                    }}
                    placeholder="Nome e sobrenome"
                    className={tableFieldClass}
                    autoComplete="off"
                    aria-label="Nome do novo convidado"
                    disabled={busy}
                  />
                </td>
                <td className="px-3 py-2">
                  <StatusTag {...guestStatusTag("pending")} />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={groupId}
                    onChange={(event) => setGroupId(event.target.value)}
                    className={tableFieldClass}
                    aria-label="Grupo do novo convidado"
                    disabled={busy}
                  >
                    <option value="">Sem grupo</option>
                    {board.groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <Button
                    type="submit"
                    disabled={busy}
                    className="h-11 min-h-11 bg-gold text-navy hover:bg-gold/90"
                  >
                    Incluir
                  </Button>
                </td>
              </tr>
              {filtered.length === 0 ? (
                <tr className="border-t border-beige">
                  <td colSpan={4} className="px-3 py-4 text-sm text-navy/60">
                    {board.guests.length === 0
                      ? "A lista ainda está vazia."
                      : "Ninguém neste filtro."}
                  </td>
                </tr>
              ) : (
                filtered.map((guest) => {
                  const tag = guestStatusTag(guest.status);
                  return (
                    <tr key={guest.id} className="border-t border-beige">
                      <td className="px-3 py-2 font-medium text-navy">
                        {guest.fullName}
                      </td>
                      <td className="px-3 py-2">
                        <StatusTag label={tag.label} className={tag.className} />
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={guest.groupId ?? ""}
                          disabled={busy}
                          onChange={(event) => changeGroup(guest.id, event.target.value)}
                          className={tableFieldClass}
                          aria-label={`Grupo de ${guest.fullName}`}
                        >
                          <option value="">Sem grupo</option>
                          {board.groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 min-h-11"
                            disabled={busy}
                            onClick={() => {
                              setEditName(guest.fullName);
                              setEditGroupId(guest.groupId ?? "");
                              setEditing(guest);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-11 min-h-11"
                            disabled={busy}
                            onClick={() => setToDelete(guest)}
                          >
                            Remover
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-2xl">Confirmações avulsas</h2>
        {board.unmatched.length === 0 ? (
          <p className="text-sm text-navy/60">
            Nenhuma confirmação fora da lista.
          </p>
        ) : (
          <div className="overflow-x-auto border border-beige">
            <table className="w-full min-w-xl text-left">
              <thead>
                <tr className="bg-[#f7f4ef] text-xs font-medium text-navy/60">
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Vincular</th>
                  <th className="px-3 py-2 font-medium">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {board.unmatched.map((item) => (
                  <UnmatchedRow
                    key={item.id}
                    item={item}
                    guests={board.guests}
                    busy={busy}
                    onLink={(guestId) => link(item.id, guestId)}
                    onCreate={() => createFrom(item.id)}
                    onDiscard={() => setToDiscard(item)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => open !== true && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar convidado</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4">
            <NameAndGroupFields
              fullName={editName}
              groupId={editGroupId}
              groups={board.groups}
              onName={setEditName}
              onGroup={setEditGroupId}
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

function UnmatchedRow({
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
  const tag = unmatchedAttendanceTag(item.attending);
  return (
    <tr className="border-t border-beige">
      <td className="px-3 py-2 font-medium text-navy">{item.typedName}</td>
      <td className="px-3 py-2">
        <StatusTag label={tag.label} className={tag.className} />
      </td>
      <td className="px-2 py-2">
        <div className="flex gap-2">
          <select
            value={guestId}
            disabled={busy}
            onChange={(event) => setGuestId(event.target.value)}
            className={tableFieldClass}
            aria-label="Vincular a um convidado"
          >
            <option value="">Vincular a…</option>
            {guests.map((guest) => (
              <option key={guest.id} value={guest.id}>
                {guest.fullName}
              </option>
            ))}
          </select>
          <Button
            type="button"
            className="h-11 min-h-11 shrink-0 bg-gold text-navy"
            disabled={busy || !guestId}
            onClick={() => onLink(guestId)}
          >
            Vincular
          </Button>
        </div>
      </td>
      <td className="px-2 py-2">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-11"
            disabled={busy}
            onClick={onCreate}
          >
            Criar
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
      </td>
    </tr>
  );
}
