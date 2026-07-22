/**
 * Dispara um canhão de confetes alinhado à paleta do casamento.
 * Respeita prefers-reduced-motion. Usa dynamic import para não bloquear o bundle.
 */
export async function fireConfettiCannon(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const confetti = (await import("canvas-confetti")).default;

  const colors = ["#4a5335", "#849652", "#3d1700", "#faf9f6"];
  const opts = {
    particleCount: 120,
    spread: 110,
    origin: { x: 0.5, y: 0.6 } as const,
    startVelocity: 40,
    colors,
  };

  confetti(opts);
  setTimeout(() => confetti({ ...opts, particleCount: 80 }), 120);
  setTimeout(() => confetti({ ...opts, particleCount: 60 }), 260);
}
