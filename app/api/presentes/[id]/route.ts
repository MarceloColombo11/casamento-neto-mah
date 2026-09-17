import { NextResponse } from "next/server";
import { getGiftPixById } from "@/lib/content/public";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const chavePix = await getGiftPixById(id);
    if (!chavePix) {
      return NextResponse.json({ error: "Presente não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ chavePix });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar presente" },
      { status: 500 }
    );
  }
}
