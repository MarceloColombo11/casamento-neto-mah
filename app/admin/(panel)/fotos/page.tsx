import { PhotoCollection } from "@/components/admin/PhotoCollection";
import { listPhotos } from "@/lib/content/photos";

export const dynamic = "force-dynamic";

export default async function FotosPage() {
  let hero: Awaited<ReturnType<typeof listPhotos>> = [];
  let historia: Awaited<ReturnType<typeof listPhotos>> = [];
  let error: string | null = null;
  try {
    [hero, historia] = await Promise.all([
      listPhotos("hero"),
      listPhotos("historia"),
    ]);
  } catch {
    error = "Não foi possível carregar as fotos. Tente de novo em instantes.";
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Fotos</h1>
        <p className="mt-2 text-navy/75">
          Capa na entrada do site (até 8) e Nossa História (até 12).
        </p>
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : (
        <>
          <PhotoCollection
            collection="hero"
            title="Capa"
            description="Fundo da entrada. Até 8 fotos."
            photos={hero}
          />
          <PhotoCollection
            collection="historia"
            title="Nossa História"
            description="Carrossel da seção. Até 12 fotos."
            photos={historia}
          />
        </>
      )}
    </div>
  );
}
