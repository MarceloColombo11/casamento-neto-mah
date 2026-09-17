import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Painel</h1>
        <p className="mt-2 text-navy/75">
          Escolham uma área para atualizar o site. Tudo que salvar aparece para
          os convidados na hora.
        </p>
      </div>
      <ul className="space-y-3">
        <li>
          <Link
            href="/admin/convidados"
            className="flex min-h-14 items-center justify-between border border-beige px-4 py-3 font-heading text-xl hover:border-gold"
          >
            Convidados
            <span className="text-sm font-sans text-navy/60">Lista e RSVP</span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/presentes"
            className="flex min-h-14 items-center justify-between border border-beige px-4 py-3 font-heading text-xl hover:border-gold"
          >
            Presentes
            <span className="text-sm font-sans text-navy/60">Lista e Pix</span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/fotos"
            className="flex min-h-14 items-center justify-between border border-beige px-4 py-3 font-heading text-xl hover:border-gold"
          >
            Fotos
            <span className="text-sm font-sans text-navy/60">Capa e história</span>
          </Link>
        </li>
        <li>
          <Link
            href="/admin/textos"
            className="flex min-h-14 items-center justify-between border border-beige px-4 py-3 font-heading text-xl hover:border-gold"
          >
            Textos
            <span className="text-sm font-sans text-navy/60">Mensagens do site</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
