"use client";

import { useRef, useEffect, useCallback } from "react";

const COLORS = [
    "rgba(74, 83, 53, 0.38)",
    "rgba(132, 150, 82, 0.42)",
    "rgba(61, 23, 0, 0.34)",
    "rgba(95, 108, 62, 0.4)",
    "rgba(120, 95, 55, 0.32)",
] as const;

type Leaf = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    restX: number;
    restY: number;
    size: number;
    rot: number;
    vRot: number;
    color: string;
};

function random(min: number, max: number) {
    return min + Math.random() * (max - min);
}

function pickColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)]!;
}

function initLeaves(w: number, h: number, count: number): Leaf[] {
    const baseY = h * 0.52;
    const spreadX = w * 0.44;
    const mx = w * 0.5;
    return Array.from({ length: count }, () => {
        const restX = mx + random(-spreadX, spreadX);
        const restY = baseY + random(0, h * 0.42);
        return {
            x: restX + random(-22, 22),
            y: restY + random(-12, 12),
            vx: 0,
            vy: 0,
            restX,
            restY,
            size: random(9, 21),
            rot: random(0, Math.PI * 2),
            vRot: random(-0.06, 0.06),
            color: pickColor(),
        };
    });
}

function drawLeaf(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rotation: number,
    color: string,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    const rw = size;
    const rh = size * 1.38;
    ctx.beginPath();
    ctx.moveTo(0, -rh * 0.48);
    ctx.bezierCurveTo(
        rw * 0.58,
        -rh * 0.18,
        rw * 0.52,
        rh * 0.38,
        0,
        rh * 0.52,
    );
    ctx.bezierCurveTo(
        -rw * 0.52,
        rh * 0.38,
        -rw * 0.58,
        -rh * 0.18,
        0,
        -rh * 0.48,
    );
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

type Layout = { cssW: number; cssH: number; dpr: number };

export function InteractiveLeafPile() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const leavesRef = useRef<Leaf[]>([]);
    const layoutRef = useRef<Layout>({ cssW: 1, cssH: 1, dpr: 1 });
    const pointerRef = useRef({ x: 0, y: 0, active: false });
    const rafRef = useRef(0);
    const reducedRef = useRef(false);
    const isVisibleRef = useRef(false);
    const lastTRef = useRef(0);

    const resize = useCallback(() => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap) return;
        const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
        const { width, height } = wrap.getBoundingClientRect();
        const w = Math.max(1, Math.floor(width));
        const h = Math.max(1, Math.floor(height));
        layoutRef.current = { cssW: w, cssH: h, dpr };
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const mobile = w < 640;
        const count = mobile ? 32 : 54;
        leavesRef.current = initLeaves(w, h, count);
    }, []);

    const step = useCallback((t: number) => {
        const canvas = canvasRef.current;
        if (!canvas || reducedRef.current) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dt = Math.min(0.05, (t - lastTRef.current) / 1000) || 0.016;
        lastTRef.current = t;

        const { cssW, cssH } = layoutRef.current;
        const ptr = pointerRef.current;
        const repelR = Math.min(150, cssW * 0.2);
        const repelS = 560;

        for (const leaf of leavesRef.current) {
            if (ptr.active) {
                const dx = leaf.x - ptr.x;
                const dy = leaf.y - ptr.y;
                const dist = Math.hypot(dx, dy) || 0.001;
                if (dist < repelR) {
                    const n = 1 - dist / repelR;
                    const f = n * n * repelS * dt;
                    leaf.vx += (dx / dist) * f;
                    leaf.vy += (dy / dist) * f;
                }
            }

            leaf.vx += (leaf.restX - leaf.x) * 2.8 * dt;
            leaf.vy += (leaf.restY - leaf.y) * 2.8 * dt;
            leaf.vRot += -leaf.vRot * 4 * dt;

            leaf.vx *= Math.pow(0.82, dt * 60);
            leaf.vy *= Math.pow(0.82, dt * 60);
            leaf.vRot *= Math.pow(0.85, dt * 60);

            leaf.x += leaf.vx * dt * 60 * 0.016;
            leaf.y += leaf.vy * dt * 60 * 0.016;
            leaf.rot += leaf.vRot + leaf.vx * 0.018 * dt * 60;

            const pad = leaf.size;
            leaf.x = Math.max(pad, Math.min(cssW - pad, leaf.x));
            leaf.y = Math.max(pad, Math.min(cssH - pad, leaf.y));
        }

        ctx.clearRect(0, 0, cssW, cssH);
        const sorted = [...leavesRef.current].sort((a, b) => a.y - b.y);
        for (const leaf of sorted) {
            drawLeaf(ctx, leaf.x, leaf.y, leaf.size, leaf.rot, leaf.color);
        }

        if (isVisibleRef.current && !reducedRef.current) {
            rafRef.current = requestAnimationFrame(step);
        } else {
            rafRef.current = 0;
        }
    }, []);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        reducedRef.current = mq.matches;
        const onMq = () => {
            reducedRef.current = mq.matches;
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
            if (mq.matches) {
                drawStatic();
            } else if (isVisibleRef.current) {
                lastTRef.current = performance.now();
                rafRef.current = requestAnimationFrame(step);
            }
        };
        mq.addEventListener("change", onMq);

        resize();
        const wrap = wrapRef.current;
        const ro = new ResizeObserver(() => resize());
        if (wrap) ro.observe(wrap);

        const canvas = canvasRef.current;
        if (!canvas) {
            return () => {
                mq.removeEventListener("change", onMq);
                ro.disconnect();
            };
        }

        const updatePointer = (e: PointerEvent, active: boolean) => {
            const rect = canvas.getBoundingClientRect();
            pointerRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                active,
            };
        };

        const onMove = (e: PointerEvent) => {
            updatePointer(e, true);
        };

        const onLeave = () => {
            pointerRef.current.active = false;
        };

        const onDown = (e: PointerEvent) => {
            try {
                canvas.setPointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
            updatePointer(e, true);
        };

        const onUp = (e: PointerEvent) => {
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch {
                /* ignore */
            }
            if (e.pointerType === "touch" || e.pointerType === "pen") {
                pointerRef.current.active = false;
            }
        };

        const onCancel = () => {
            pointerRef.current.active = false;
        };

        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerdown", onDown);
        canvas.addEventListener("pointerup", onUp);
        canvas.addEventListener("pointercancel", onCancel);
        canvas.addEventListener("pointerleave", onLeave);

        const drawStatic = () => {
            const ctx = canvas.getContext("2d");
            const { cssW, cssH } = layoutRef.current;
            if (!ctx) return;
            ctx.clearRect(0, 0, cssW, cssH);
            const sorted = [...leavesRef.current].sort((a, b) => a.y - b.y);
            for (const leaf of sorted) {
                drawLeaf(ctx, leaf.x, leaf.y, leaf.size, leaf.rot, leaf.color);
            }
        };

        const startLoop = () => {
            if (reducedRef.current || rafRef.current !== 0) return;
            lastTRef.current = performance.now();
            rafRef.current = requestAnimationFrame(step);
        };

        const stopLoop = () => {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
        };

        const visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                isVisibleRef.current = entry.isIntersecting;
                if (entry.isIntersecting && !reducedRef.current) {
                    startLoop();
                } else {
                    stopLoop();
                }
            },
            { threshold: 0 },
        );

        if (wrap) visibilityObserver.observe(wrap);

        if (!reducedRef.current && wrap) {
            const rect = wrap.getBoundingClientRect();
            isVisibleRef.current =
                rect.bottom > 0 && rect.top < window.innerHeight;
            if (isVisibleRef.current) {
                startLoop();
            } else {
                drawStatic();
            }
        } else {
            drawStatic();
        }

        return () => {
            mq.removeEventListener("change", onMq);
            ro.disconnect();
            visibilityObserver.disconnect();
            stopLoop();
            canvas.removeEventListener("pointermove", onMove);
            canvas.removeEventListener("pointerdown", onDown);
            canvas.removeEventListener("pointerup", onUp);
            canvas.removeEventListener("pointercancel", onCancel);
            canvas.removeEventListener("pointerleave", onLeave);
        };
    }, [resize, step]);

    return (
        <div
            ref={wrapRef}
            className="pointer-events-auto absolute inset-0 z-1 touch-none select-none"
            aria-hidden
        >
            <canvas
                ref={canvasRef}
                className="block h-full w-full cursor-grab active:cursor-grabbing"
            />
        </div>
    );
}
