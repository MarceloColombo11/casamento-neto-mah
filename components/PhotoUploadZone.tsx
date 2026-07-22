"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

type PhotoUploadZoneProps = {
  onFilesSelect: (files: File[]) => void;
  disabled?: boolean;
};

export function PhotoUploadZone({
  onFilesSelect,
  disabled = false,
}: PhotoUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length > 0) onFilesSelect(files);
  };

  return (
    <div
      className="flex min-h-[160px] flex-col items-center justify-center"
      role="region"
      aria-label="Área de upload de fotos e vídeos da galeria"
    >
      <div className="flex flex-col items-center gap-4 p-6">
        <Upload className="size-10 text-olive/60" aria-hidden />
        <span className="text-center text-sm font-medium text-olive">
          Arraste fotos ou vídeos, ou clique para selecionar
        </span>
        <span className="text-center text-xs text-olive/70">
          Vários arquivos de uma vez · até 200 MB cada
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          aria-label="Selecionar fotos ou vídeos da galeria"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
        >
          <Upload className="mr-2 size-4" />
          Escolher da galeria
        </Button>
      </div>
    </div>
  );
}
