"use client";

import { useState, useEffect } from "react";

const WEDDING_DATE =
    process.env.NEXT_PUBLIC_WEDDING_DATE || "2027-03-13T16:00:00";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function getTimeLeft(): TimeLeft {
    const now = new Date().getTime();
    const wedding = new Date(WEDDING_DATE).getTime();
    const diff = wedding - now;

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
}

function pad(num: number, length = 2): string {
    return num.toString().padStart(length, "0");
}

export function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const update = () => setTimeLeft(getTimeLeft());
        const immediate = window.setTimeout(update, 0);
        const timer = window.setInterval(update, 1000);
        return () => {
            window.clearTimeout(immediate);
            window.clearInterval(timer);
        };
    }, []);

    const cards = [
        { label: "Dias", value: timeLeft.days },
        { label: "Horas", value: timeLeft.hours },
        { label: "Min", value: timeLeft.minutes },
        { label: "Seg", value: timeLeft.seconds },
    ];

    return (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            {cards.map(({ label, value }) => (
                <div
                    key={label}
                    className="flex w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-beige bg-white py-3 shadow-sm sm:w-24 sm:py-4"
                >
                    <span className="inline-block w-[3ch] text-center font-heading text-2xl font-semibold tabular-nums text-navy sm:text-3xl md:text-4xl">
                        {label === "Dias" ? pad(value, 3) : pad(value)}
                    </span>
                    <span className="mt-1 text-xs text-gold sm:text-sm">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
