const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** Normaliza valores digitados livremente no admin ("600", "R$ 350", "R$ 1.200,00"). */
export function formatValor(valor?: string): string | null {
  const texto = valor?.trim();
  if (!texto) return null;

  const numero = texto
    .replace(/R\$\s*/i, "")
    .replace(/\./g, "")
    .replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(numero)) return texto;
  return brl.format(Number(numero));
}
