import { TextBlockEditor } from "@/components/admin/TextBlockEditor";
import { getTextBlocks } from "@/lib/content/texts";

export const dynamic = "force-dynamic";

export default async function TextosPage() {
  let blocks: Awaited<ReturnType<typeof getTextBlocks>> | null = null;
  let error: string | null = null;
  try {
    blocks = await getTextBlocks();
  } catch {
    error = "Não foi possível carregar os textos. Tente de novo em instantes.";
  }

  if (!blocks) {
    return (
      <div>
        <h1 className="font-heading text-3xl font-semibold">Textos</h1>
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Textos</h1>
        <p className="mt-2 text-navy/75">
          Cada bloco corresponde a um trecho que os convidados leem no site.
        </p>
      </div>
      <TextBlockEditor
        block={blocks.hero_message}
        title="Mensagem da entrada"
        hint="Aparece sob a data, acima da contagem regressiva."
      />
      <TextBlockEditor
        block={blocks.grande_dia}
        title="O Grande Dia"
        hint="Parágrafos da introdução. Precisa ficar pelo menos um."
      />
      <TextBlockEditor
        block={blocks.traje}
        title="Traje"
        hint="Parágrafos da seção Traje."
      />
      <TextBlockEditor
        block={blocks.nossa_historia}
        title="Nossa História"
        hint="Título, subtítulo, parágrafos e assinatura."
      />
      <TextBlockEditor
        block={blocks.presentes_intro}
        title="Introdução dos presentes"
        hint="Texto curto acima da lista."
      />
    </div>
  );
}
