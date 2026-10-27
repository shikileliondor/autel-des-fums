import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

declare global {
    interface Window {
        __splashDone?: boolean;
    }
}

/**
 * Fait apparaître en douceur les éléments [data-reveal] du conteneur quand ils
 * entrent à l'écran (classe .is-revealed, styles dans app.css). Au premier
 * chargement, attend la fin de l'écran de chargement pour que l'entrée soit visible.
 */
export function useReveal<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const root = ref.current;

        if (!root) {
            return;
        }

        const targets = root.querySelectorAll<HTMLElement>('[data-reveal]');

        if (!('IntersectionObserver' in window)) {
            targets.forEach((el) => el.classList.add('is-revealed'));

            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                        observer.unobserve(entry.target);
                    }
                }
            },
            { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
        );

        const start = () => targets.forEach((el) => observer.observe(el));
        const waitForSplash =
            document.getElementById('splash') !== null && !window.__splashDone;

        if (waitForSplash) {
            window.addEventListener('splash-hidden', start, { once: true });
        } else {
            start();
        }

        return () => {
            window.removeEventListener('splash-hidden', start);
            observer.disconnect();
        };
    }, []);

    return ref;
}

/** Décale l'apparition d'un élément [data-reveal] (effet en cascade). */
export function revealDelay(ms: number): CSSProperties {
    return { '--reveal-delay': `${ms}ms` } as CSSProperties;
}
