import { useState } from 'react';
import type { CSSProperties } from 'react';

const CONFETTI_COLORS = ['#f9731a', '#c2410c', '#fbbf24', '#fde68a', '#1c1410'];

/** Pluie de confettis aux couleurs du programme, jouée une seule fois. */
export default function Confetti() {
    const [pieces] = useState(() =>
        Array.from({ length: 70 }, (_, i) => ({
            left: Math.random() * 100,
            drift: `${(Math.random() - 0.5) * 30}vw`,
            delay: `${Math.random() * 0.8}s`,
            duration: `${2.6 + Math.random() * 1.8}s`,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            width: 6 + Math.random() * 6,
            round: i % 4 === 0,
        })),
    );

    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        >
            {pieces.map((piece, i) => (
                <span
                    key={i}
                    className="confetti absolute -top-4 block"
                    style={
                        {
                            left: `${piece.left}%`,
                            width: piece.width,
                            height: piece.round
                                ? piece.width
                                : piece.width * 1.6,
                            borderRadius: piece.round ? '9999px' : '2px',
                            backgroundColor: piece.color,
                            '--drift': piece.drift,
                            '--delay': piece.delay,
                            '--duration': piece.duration,
                        } as CSSProperties
                    }
                />
            ))}
        </div>
    );
}
