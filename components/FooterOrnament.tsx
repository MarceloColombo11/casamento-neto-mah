/** Ornamento discreto inspirado em pétalas / orquídeas para o rodapé. */
export function FooterOrnament({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 280 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden
        >
            <defs>
                <linearGradient
                    id="footer-gold"
                    x1="0"
                    y1="32"
                    x2="280"
                    y2="32"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#C6A75E" stopOpacity="0.15" />
                    <stop offset="0.5" stopColor="#C6A75E" stopOpacity="0.85" />
                    <stop offset="1" stopColor="#C6A75E" stopOpacity="0.15" />
                </linearGradient>
            </defs>
            <path
                d="M20 32 H108"
                stroke="url(#footer-gold)"
                strokeWidth="1"
            />
            <path
                d="M172 32 H260"
                stroke="url(#footer-gold)"
                strokeWidth="1"
            />
            {/* Pétala central */}
            <ellipse
                cx="140"
                cy="32"
                rx="10"
                ry="18"
                fill="#C6A75E"
                fillOpacity="0.35"
            />
            <ellipse
                cx="140"
                cy="32"
                rx="10"
                ry="18"
                transform="rotate(55 140 32)"
                fill="#1F2A44"
                fillOpacity="0.18"
            />
            <ellipse
                cx="140"
                cy="32"
                rx="10"
                ry="18"
                transform="rotate(-55 140 32)"
                fill="#94ACCB"
                fillOpacity="0.35"
            />
            <circle cx="140" cy="32" r="3.5" fill="#C6A75E" fillOpacity="0.9" />
            {/* Pétalas laterais pequenas */}
            <ellipse
                cx="118"
                cy="32"
                rx="5"
                ry="9"
                transform="rotate(-25 118 32)"
                fill="#C6A75E"
                fillOpacity="0.25"
            />
            <ellipse
                cx="162"
                cy="32"
                rx="5"
                ry="9"
                transform="rotate(25 162 32)"
                fill="#C6A75E"
                fillOpacity="0.25"
            />
        </svg>
    );
}
