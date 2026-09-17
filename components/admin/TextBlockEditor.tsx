"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveTextBlockAction,
  type TextActionState,
} from "@/app/actions/texts";
import type {
  HistoriaBlock,
  ParagraphBlock,
  ScalarBlock,
} from "@/lib/content/texts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminFieldClass,
  adminTextareaClass,
} from "@/components/admin/field-classes";

type EditorProps =
  | { block: ScalarBlock; title: string; hint: string }
  | { block: ParagraphBlock; title: string; hint: string }
  | { block: HistoriaBlock; title: string; hint: string };

function initialParagraphsFrom(block: EditorProps["block"]): string[] {
  if ("paragraphs" in block) {
    return block.paragraphs.length > 0 ? block.paragraphs : [""];
  }
  return [""];
}

export function TextBlockEditor(props: EditorProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    saveTextBlockAction,
    null as TextActionState,
  );
  const saved = state?.ok === true;
  const [paragraphs, setParagraphs] = useState(() =>
    initialParagraphsFrom(props.block),
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4 border border-beige p-4">
      <input type="hidden" name="key" value={props.block.key} />
      <div>
        <h2 className="font-heading text-2xl font-semibold">{props.title}</h2>
        <p className="mt-1 text-sm text-navy/70">{props.hint}</p>
      </div>

      {props.block.key === "hero_message" ||
      props.block.key === "presentes_intro" ? (
        <div className="space-y-2">
          <Label htmlFor={`${props.block.key}-value`}>Texto</Label>
          <textarea
            id={`${props.block.key}-value`}
            name="value"
            required
            defaultValue={props.block.value}
            className={adminTextareaClass}
          />
        </div>
      ) : null}

      {props.block.key === "nossa_historia" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              name="titulo"
              required
              defaultValue={props.block.titulo}
              className={adminFieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitulo">Subtítulo</Label>
            <Input
              id="subtitulo"
              name="subtitulo"
              required
              defaultValue={props.block.subtitulo}
              className={adminFieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assinatura">Assinatura</Label>
            <Input
              id="assinatura"
              name="assinatura"
              required
              defaultValue={props.block.assinatura}
              className={adminFieldClass}
            />
          </div>
        </>
      ) : null}

      {props.block.key === "grande_dia" ||
      props.block.key === "traje" ||
      props.block.key === "nossa_historia" ? (
        <div className="space-y-3">
          {paragraphs.map((paragraph, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`${props.block.key}-p-${index}`}>
                Parágrafo {index + 1}
              </Label>
              <textarea
                id={`${props.block.key}-p-${index}`}
                name="paragraphs"
                value={paragraph}
                onChange={(event) => {
                  const next = [...paragraphs];
                  next[index] = event.target.value;
                  setParagraphs(next);
                }}
                className={adminTextareaClass}
              />
              <Button
                type="button"
                variant="outline"
                className="h-11 min-h-11"
                disabled={paragraphs.length <= 1}
                onClick={() =>
                  setParagraphs(paragraphs.filter((_, i) => i !== index))
                }
              >
                Remover parágrafo
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-11 min-h-11"
            onClick={() => setParagraphs([...paragraphs, ""])}
          >
            Adicionar parágrafo
          </Button>
        </div>
      ) : null}

      {state && !state.ok ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-navy/80">Texto atualizado no site.</p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 min-h-11 w-full bg-gold text-navy hover:bg-gold/90 sm:w-auto"
      >
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
