import { GiftList } from "@/components/admin/GiftList";
import { listGifts } from "@/lib/content/gifts";

export const dynamic = "force-dynamic";

export default async function PresentesPage() {
  let gifts: Awaited<ReturnType<typeof listGifts>> = [];
  let error: string | null = null;
  try {
    gifts = await listGifts();
  } catch {
    error = "Não foi possível carregar os presentes. Tente de novo em instantes.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Presentes</h1>
        <p className="mt-2 text-navy/75">
          Título, descrição, Pix e foto. A ordem da lista é a mesma do site.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : (
        <GiftList gifts={gifts} />
      )}
    </div>
  );
}
