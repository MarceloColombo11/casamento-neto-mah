import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

interface PresenteCompleto {
  id: string;
  nome: string;
  descricao: string;
  valor?: string;
  chavePix: string;
  imagem?: string | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", "presentes.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const presentes: PresenteCompleto[] = JSON.parse(raw);

    const presente = presentes.find((p) => p.id === id);
    if (!presente?.chavePix) {
      return NextResponse.json({ error: "Presente não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ chavePix: presente.chavePix });
  } catch {
    return NextResponse.json(
      { error: "Erro ao carregar presente" },
      { status: 500 }
    );
  }
}
