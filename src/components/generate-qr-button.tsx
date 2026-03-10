"use client";

import { useState, useTransition } from "react";

interface GenerateQRButtonProps {
  petId: string;
}

export function GenerateQRButton({ petId }: GenerateQRButtonProps) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/pets/${petId}/qr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (res.ok) {
          setDone(true);
        } else {
          const data = await res.json();
          setError(data.error ?? "Erro ao gerar QR Code.");
        }
      } catch {
        setError("Erro de conexão. Tente novamente.");
      }
    });
  };

  if (done) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <span className="text-2xl">✅</span>
        <div>
          <p className="text-sm font-medium">QR Code gerado!</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Recarregue a página para ver
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="flex items-center gap-3 w-full p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-60 transition-colors text-left"
      >
        <span className="text-2xl">{isPending ? "⏳" : "📱"}</span>
        <div>
          <p className="text-sm font-medium">
            {isPending ? "Gerando…" : "Gerar QR Code"}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Cria o QR que direciona ao perfil do pet
          </p>
        </div>
      </button>
      {error && <p className="text-xs text-red-500 px-1">{error}</p>}
    </div>
  );
}
