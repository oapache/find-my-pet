"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";

interface DeletePetButtonProps {
  petId: string;
  petName: string;
}

export function DeletePetButton({ petId, petName }: DeletePetButtonProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/pets/${petId}`, { method: "DELETE" });

        if (res.ok) {
          router.push("/dashboard");
        } else {
          const data = await res.json();
          setError(data.error ?? "Erro ao excluir pet.");
          setConfirm(false);
        }
      } catch {
        setError("Erro de conexão. Tente novamente.");
        setConfirm(false);
      }
    });
  };

  if (!confirm) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setConfirm(true)}
          className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          Excluir {petName}
        </button>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Esta ação é irreversível. Todos os dados, fotos e QR Codes serão
          removidos.
        </p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-red-700">
        Tem certeza? Esta ação não pode ser desfeita.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleDelete}
          className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? "Excluindo…" : "Sim, excluir"}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="border border-[var(--color-border)] text-sm px-4 py-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
