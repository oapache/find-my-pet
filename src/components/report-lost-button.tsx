"use client";

import { useState, useTransition } from "react";

interface ReportLostButtonProps {
  petId: string;
  isLost: boolean;
  petName: string;
}

export function ReportLostButton({
  petId,
  isLost: initialIsLost,
  petName,
}: ReportLostButtonProps) {
  const [isLost, setIsLost] = useState(initialIsLost);
  const [location, setLocation] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleMarkLost = async () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/pets/${petId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isLost: true,
            lastSeenLocation: location.trim() || undefined,
          }),
        });

        if (res.ok) {
          setIsLost(true);
          setShowModal(false);
          setLocation("");
        } else {
          const data = await res.json();
          setError(data.error ?? "Erro ao atualizar.");
        }
      } catch {
        setError("Erro de conexão. Tente novamente.");
      }
    });
  };

  const handleMarkFound = async () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/pets/${petId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isLost: false }),
        });

        if (res.ok) {
          setIsLost(false);
        } else {
          const data = await res.json();
          setError(data.error ?? "Erro ao atualizar.");
        }
      } catch {
        setError("Erro de conexão. Tente novamente.");
      }
    });
  };

  return (
    <>
      <div className="space-y-3">
        {isLost ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">
                ⚠️ {petName} está marcado como perdido
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                O perfil público exibe um banner de alerta para quem encontrar.
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={handleMarkFound}
              className="shrink-0 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {isPending ? "Atualizando…" : "✅ Marcar como encontrado"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Perdeu seu pet?</p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                Marque como perdido para ativar o banner de alerta no perfil.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="shrink-0 bg-red-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              🚨 Marcar como perdido
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-[var(--color-bg)] rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              🚨 Marcar {petName} como perdido
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              O perfil público exibirá um banner de alerta. Informe onde foi
              visto por último (opcional):
            </p>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Parque Ibirapuera, São Paulo — SP"
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={handleMarkLost}
                className="flex-1 bg-red-500 text-white text-sm py-2.5 rounded-lg font-medium hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {isPending ? "Salvando…" : "Confirmar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setLocation("");
                  setError(null);
                }}
                className="flex-1 border border-[var(--color-border)] text-sm py-2.5 rounded-lg font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
