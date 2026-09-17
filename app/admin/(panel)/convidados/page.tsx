import { requireAdminSession } from "@/lib/admin-auth";
import { loadGuestBoard } from "@/lib/content/guests";
import { GuestPanel } from "@/components/admin/GuestPanel";

export default async function ConvidadosPage() {
  await requireAdminSession();
  const board = await loadGuestBoard();
  const confirmed = board.guests.filter((g) => g.status === "confirmed").length;
  const declined = board.guests.filter((g) => g.status === "declined").length;
  const pending = board.guests.length - confirmed - declined;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Convidados</h1>
        <p className="mt-2 text-navy/75">
          {confirmed} confirmaram · {declined} não vão · {pending} ainda não
          responderam
          {board.unmatched.length
            ? ` · ${board.unmatched.length} confirmação(ões) avulsa(s)`
            : ""}
        </p>
      </div>
      <GuestPanel board={board} />
    </div>
  );
}
