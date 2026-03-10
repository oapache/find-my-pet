"use client";

import { useRef, useState, useCallback } from "react";

interface Photo {
  id: string;
  urlThumb: string;
  urlMedium: string;
  isPrimary: boolean;
}

interface PhotoUploadProps {
  petId: string;
  initialPhotos?: Photo[];
  maxPhotos?: number;
  onChange?: (photos: Photo[]) => void;
}

export function PhotoUpload({
  petId,
  initialPhotos = [],
  maxPhotos = 3,
  onChange,
}: PhotoUploadProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updatePhotos = useCallback(
    (next: Photo[]) => {
      setPhotos(next);
      onChange?.(next);
    },
    [onChange]
  );

  const uploadFile = async (file: File) => {
    if (photos.length >= maxPhotos) {
      setError(`Máximo de ${maxPhotos} fotos atingido.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande. Máximo: 10MB.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`/api/pets/${petId}/photos`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao enviar foto.");
        return;
      }

      updatePhotos([...photos, data.photo]);
    } catch {
      setError("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (photoId: string) => {
    try {
      const res = await fetch(`/api/pets/${petId}/photos/${photoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        updatePhotos(photos.filter((p) => p.id !== photoId));
      }
    } catch {
      setError("Erro ao excluir foto.");
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    try {
      const res = await fetch(`/api/pets/${petId}/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      if (res.ok) {
        updatePhotos(
          photos.map((p) => ({ ...p, isPrimary: p.id === photoId }))
        );
      }
    } catch {
      setError("Erro ao definir foto principal.");
    }
  };

  const canUpload = photos.length < maxPhotos && !uploading;

  return (
    <div className="space-y-3">
      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-[var(--color-border)] group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.urlThumb}
                alt="Foto do pet"
                className="w-full h-full object-cover"
              />
              {photo.isPrimary && (
                <span className="absolute top-1 left-1 bg-[var(--color-primary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {!photo.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(photo.id)}
                    className="text-[10px] text-white bg-[var(--color-primary)] px-2 py-1 rounded hover:bg-[var(--color-primary-dark)]"
                  >
                    Principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(photo.id)}
                  className="text-[10px] text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {canUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
              : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                Enviando...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="text-3xl">🖼️</div>
              <p className="text-sm font-medium">
                Arraste uma foto ou clique para selecionar
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                JPEG, PNG ou WebP • máx. 10MB •{" "}
                {photos.length}/{maxPhotos} fotos
              </p>
            </div>
          )}
        </div>
      )}

      {photos.length >= maxPhotos && (
        <p className="text-xs text-[var(--color-text-secondary)]">
          Limite de {maxPhotos} fotos atingido.
        </p>
      )}

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
