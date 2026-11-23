import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { fetchReel } from '@/lib/visual-wall';
import type { WallItem } from '@/lib/visual-wall';

/** Temps d'affichage de chaque visuel : défilement rapide, comme une vidéo. */
const STEP_MS = 650;
/** Visuels chargés à l'avance, pour ne jamais montrer d'image vide. */
const PRELOAD = 4;

// Partagé entre les affichages : une vignette déjà chargée ne l'est pas deux fois.
const loaded = new Map<string, HTMLImageElement>();

function preload(item: WallItem): HTMLImageElement {
    let image = loaded.get(item.thumb);

    if (!image) {
        image = new Image();
        image.decoding = 'async';
        image.src = item.thumb;
        loaded.set(item.thumb, image);
    }

    return image;
}

function prefersReducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
}

/**
 * Diaporama de tous les visuels du mur, en tête de celui-ci. Il se charge quand on
 * approche du mur, joue tant qu'il est à l'écran et se met en pause d'un toucher.
 */
export default function VisualReel({ version }: { version: number }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [items, setItems] = useState<WallItem[]>([]);
    const [index, setIndex] = useState(0);
    const [near, setNear] = useState(false);
    const [visible, setVisible] = useState(false);
    // Animations réduites demandées : pas de lecture automatique.
    const [paused, setPaused] = useState(prefersReducedMotion);

    useEffect(() => {
        const root = rootRef.current;

        if (!root) {
            return;
        }

        const nearObserver = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setNear(true);
                }
            },
            { rootMargin: '400px' },
        );
        const visibleObserver = new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.4 },
        );
        nearObserver.observe(root);
        visibleObserver.observe(root);

        return () => {
            nearObserver.disconnect();
            visibleObserver.disconnect();
        };
    }, []);

    // Rechargé après chaque publication ou retrait : le nouveau visuel passe en premier.
    useEffect(() => {
        if (!near) {
            return;
        }

        let cancelled = false;

        fetchReel().then(
            (list) => {
                if (!cancelled) {
                    setItems(list);
                    setIndex(0);
                }
            },
            () => {},
        );

        return () => {
            cancelled = true;
        };
    }, [near, version]);

    useEffect(() => {
        for (let step = 1; step <= PRELOAD && step < items.length; step++) {
            preload(items[(index + step) % items.length]);
        }
    }, [items, index]);

    const playing = !paused && visible && items.length > 1;

    useEffect(() => {
        if (!playing) {
            return;
        }

        const timer = window.setInterval(() => {
            setIndex((current) => {
                const next = (current + 1) % items.length;

                // Connexion lente : on attend que le suivant soit chargé.
                return preload(items[next]).complete ? next : current;
            });
        }, STEP_MS);

        return () => window.clearInterval(timer);
    }, [playing, items]);

    useEffect(() => {
        if (!prefersReducedMotion()) {
            imageRef.current?.animate?.(
                [
                    { opacity: 0.4, transform: 'scale(1.06)' },
                    { opacity: 1, transform: 'scale(1)' },
                ],
                { duration: 280, easing: 'ease-out' },
            );
        }
    }, [index]);

    const current = items[index];

    return (
        <div ref={rootRef} className="mt-8">
            {items.length > 1 && current && (
                <div className="mx-auto w-full max-w-[16rem] sm:max-w-[18rem]">
                    <div className="rounded-[1.6rem] bg-[#1c1410] p-1.5 shadow-2xl shadow-black/30">
                        <button
                            type="button"
                            onClick={() => setPaused((value) => !value)}
                            aria-label={
                                paused
                                    ? 'Lancer le diaporama des visuels'
                                    : 'Mettre le diaporama en pause'
                            }
                            className="relative block aspect-[9/16] w-full overflow-hidden rounded-[1.25rem] bg-[#0c0907] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-event-accent"
                        >
                            <img
                                ref={imageRef}
                                src={current.thumb}
                                alt=""
                                width={360}
                                height={640}
                                className="size-full object-cover"
                            />

                            <span className="absolute inset-x-3 top-3 h-1 overflow-hidden rounded-full bg-white/25">
                                <span
                                    className="block h-full rounded-full bg-white transition-[width] duration-300"
                                    style={{
                                        width: `${((index + 1) / items.length) * 100}%`,
                                    }}
                                />
                            </span>

                            <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/75 to-transparent px-3 pt-12 pb-3 text-xs font-bold text-white">
                                <span className="flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                    {paused ? (
                                        <Play className="size-4 fill-current" />
                                    ) : (
                                        <Pause className="size-4 fill-current" />
                                    )}
                                </span>
                                <span className="tabular-nums">
                                    {index + 1} / {items.length}
                                </span>
                            </span>
                        </button>
                    </div>
                    <p className="mt-3 text-center text-xs text-event-muted">
                        Tous les visuels du mur défilent ici. Touche pour mettre
                        en pause.
                    </p>
                </div>
            )}
        </div>
    );
}
