"use client";

import { useMemo, useLayoutEffect, useState } from "react";

const PALETTE = [
    "rgba(74, 83, 53, 0.45)", // olive
    "rgba(132, 150, 82, 0.5)", // sage
    "rgba(61, 23, 0, 0.4)", // brown
] as const;

interface LeafConfig {
    left: number;
    delay: number;
    duration: number;
    size: number;
    color: string;
    swayAmplitude: number;
    rotate25: number;
    rotate50: number;
    rotate75: number;
    rotateEnd: number;
}

function randomBetween(min: number, max: number) {
    return min + Math.random() * (max - min);
}

function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateLeaves(
    count: number,
    sizeMin: number,
    sizeMax: number
): LeafConfig[] {
    return Array.from({ length: count }, () => {
        const clockwise = Math.random() > 0.5;
        const r = clockwise ? 1 : -1;
        const duration = randomBetween(4000, 9000);
        return {
            left: randomBetween(0, 100),
            // Delay negativo: a animação já “começou” no passado, distribuindo
            // as folhas na tela no primeiro frame (evita ficarem no topo até o delay).
            delay: -randomBetween(0, duration * 0.88),
            duration,
            size: randomBetween(sizeMin, sizeMax),
            color: pick(PALETTE),
            swayAmplitude: randomBetween(15, 45),
            rotate25: r * 90,
            rotate50: r * 180,
            rotate75: r * 270,
            rotateEnd: r * 360,
        };
    });
}

export function FallingLeaves() {
    const [mounted, setMounted] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [isMobile, setIsMobile] = useState(true);

    useLayoutEffect(() => {
        setMounted(true);

        const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const mobileQuery = window.matchMedia("(max-width: 767px)");

        const handleReduced = () => setReducedMotion(reducedQuery.matches);
        const handleMobile = () => setIsMobile(mobileQuery.matches);

        setReducedMotion(reducedQuery.matches);
        setIsMobile(mobileQuery.matches);

        reducedQuery.addEventListener("change", handleReduced);
        mobileQuery.addEventListener("change", handleMobile);

        return () => {
            reducedQuery.removeEventListener("change", handleReduced);
            mobileQuery.removeEventListener("change", handleMobile);
        };
    }, []);

    const leaves = useMemo(() => {
        if (!mounted) return [];
        const count = isMobile ? 7 : 14;
        const sizeMin = isMobile ? 12 : 16;
        const sizeMax = isMobile ? 24 : 32;
        return generateLeaves(count, sizeMin, sizeMax);
    }, [mounted, isMobile]);

    if (reducedMotion) return null;

    return (
        <div
            className="absolute inset-0 overflow-hidden pointer-events-none z-[1]"
            aria-hidden
        >
            {leaves.map((leaf, i) => (
                <div
                    key={i}
                    className="absolute top-0 animate-leaf-fall"
                    style={{
                        left: `${leaf.left}%`,
                        width: leaf.size,
                        height: leaf.size * 1.4,
                        backgroundColor: leaf.color,
                        borderRadius: "50% 0 50% 50%",
                        animationDelay: `${leaf.delay}ms`,
                        animationDuration: `${leaf.duration}ms`,
                        opacity: 0.85,
                        contain: "layout style paint",
                        ["--sway-amplitude" as string]: `${leaf.swayAmplitude}px`,
                        ["--sway-amplitude-neg" as string]: `${-leaf.swayAmplitude}px`,
                        ["--rotate-25" as string]: `${leaf.rotate25}deg`,
                        ["--rotate-50" as string]: `${leaf.rotate50}deg`,
                        ["--rotate-75" as string]: `${leaf.rotate75}deg`,
                        ["--rotate-end" as string]: `${leaf.rotateEnd}deg`,
                    }}
                />
            ))}
        </div>
    );
}
