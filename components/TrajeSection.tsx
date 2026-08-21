import Image from "next/image";

export function TrajeSection() {
    return (
        <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-semibold text-navy md:text-4xl">
                Traje
            </h2>

            <div className="mt-6 space-y-5 text-pretty text-base leading-relaxed text-navy/80 sm:text-lg">
                <p>
                    Para celebrar esse momento, sugerimos o traje esporte fino.
                    Fiquem à vontade para escolher o estilo e a cor que mais
                    combinarem com vocês, dentro dessa proposta (algumas
                    referências abaixo).
                </p>
                <p>
                    Pedimos apenas que evitem terno cinza claro, reservado aos
                    padrinhos, e o azul, escolhido para as madrinhas.
                </p>
                <p>
                    <span className="font-medium text-navy">
                        Detalhe importante:
                    </span>{" "}
                    como a cerimônia será realizada na grama, recomendamos que
                    as mulheres escolham o salto priorizando modelos que
                    proporcionem mais conforto e estabilidade.
                </p>
            </div>

            <div className="mx-auto mt-10 w-full max-w-2xl overflow-hidden rounded-xl border border-beige bg-white">
                <Image
                    src="/images/traje/esporte-fino.jpg"
                    alt="Referências de traje esporte fino para convidados"
                    width={1200}
                    height={900}
                    sizes="(max-width: 768px) 100vw, 672px"
                    className="h-auto w-full object-contain"
                />
            </div>
        </div>
    );
}
