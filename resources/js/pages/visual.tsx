import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Camera,
    Check,
    Download,
    ImagePlus,
    LoaderCircle,
    Lock,
    Move,
    RotateCcw,
    Share2,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
    ChangeEvent,
    KeyboardEvent,
    PointerEvent,
    ReactNode,
} from 'react';
import EventShell, { EVENT_TIMEZONE } from '@/components/event/event-shell';
import { cn } from '@/lib/utils';
import {
    CENTERED,
    clampPlacement,
    drawVisual,
    FRAME,
    loadVisualAssets,
    MAX_ZOOM,
    preparePhoto,
    renderFrame,
    renderScene,
    VISUAL_HEIGHT,
    VISUAL_WIDTH,
} from '@/lib/visual';
import type { Placement, VisualAssets } from '@/lib/visual';
import { create } from '@/routes/registration';

const FILE_NAME = 'j-y-serai-autel-des-parfums.jpg';
const MAX_NAME_LENGTH = 20;
// Bouton « Ajouter ma photo » posé au milieu de l'arche de l'aperçu.
const ADD_BUTTON_TOP = ((FRAME.y + FRAME.height * 0.45) / VISUAL_HEIGHT) * 100;

const buttonClass =
    'inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50';
const primaryClass =
    'bg-event-accent text-white shadow-lg shadow-event-accent/30 hover:brightness-110 disabled:shadow-none disabled:hover:brightness-100';

export default function Visual() {
    const { props, url } = usePage();
    const { event } = props;
    const query = new URLSearchParams(url.split('?')[1] ?? '');
    // Arrivé depuis la confirmation d'inscription : prénom déjà connu, inutile de proposer l'inscription.
    const fromRegistration = query.has('prenom');

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<File | null>(null);
    const pointers = useRef(new Map<number, { x: number; y: number }>());

    const [assets, setAssets] = useState<VisualAssets | null>(null);
    const [failed, setFailed] = useState(false);
    const [photo, setPhoto] = useState<HTMLCanvasElement | null>(null);
    const [placement, setPlacement] = useState<Placement>(CENTERED);
    const [name, setName] = useState(
        () => query.get('prenom')?.slice(0, MAX_NAME_LENGTH) ?? '',
    );
    const [loadingPhoto, setLoadingPhoto] = useState(false);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [canShareFiles] = useState(canShareImages);

    useEffect(() => {
        let cancelled = false;

        loadVisualAssets().then(
            (loaded) => !cancelled && setAssets(loaded),
            () => !cancelled && setFailed(true),
        );

        return () => {
            cancelled = true;
        };
    }, []);

    const scene = useMemo(
        () =>
            assets ? renderScene(assets, event, window.location.host) : null,
        [assets, event],
    );
    const frame = useMemo(
        () => (assets ? renderFrame(name) : null),
        [assets, name],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        if (!canvas || !ctx || !scene || !frame) {
            return;
        }

        drawVisual(ctx, scene, frame, photo, placement);
        fileRef.current = null;

        if (!photo) {
            return;
        }

        // Image préparée à l'avance : sur iPhone, le partage doit partir dès le clic.
        let cancelled = false;
        const timer = setTimeout(() => {
            toFile(canvas).then(
                (file) => {
                    if (!cancelled) {
                        fileRef.current = file;
                    }
                },
                () => {},
            );
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [scene, frame, photo, placement]);

    // Molette (ordinateur) : listener natif, React ne permet pas d'empêcher le défilement.
    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas || !photo) {
            return;
        }

        const onWheel = (wheel: WheelEvent) => {
            wheel.preventDefault();
            const factor = Math.exp(-wheel.deltaY * 0.0015);
            setPlacement((current) =>
                zoomTo(photo, current, current.zoom * factor),
            );
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });

        return () => canvas.removeEventListener('wheel', onWheel);
    }, [photo]);

    const pickPhoto = () => inputRef.current?.click();

    const choosePhoto = async (change: ChangeEvent<HTMLInputElement>) => {
        const file = change.target.files?.[0];
        // Permet de rechoisir la même photo ensuite.
        change.target.value = '';

        if (!file) {
            return;
        }

        setLoadingPhoto(true);
        setPhotoError(null);

        try {
            setPhoto(await preparePhoto(file));
            setPlacement(CENTERED);
            setSaved(false);
        } catch {
            setPhotoError(
                'Cette photo n’a pas pu être ouverte. Essaie avec une autre image (JPG ou PNG).',
            );
        } finally {
            setLoadingPhoto(false);
        }
    };

    const move = (dx: number, dy: number) => {
        if (photo) {
            setPlacement((current) =>
                clampPlacement(photo, {
                    ...current,
                    x: current.x + dx,
                    y: current.y + dy,
                }),
            );
        }
    };

    const zoom = (target: (current: Placement) => number) => {
        if (photo) {
            setPlacement((current) => zoomTo(photo, current, target(current)));
        }
    };

    const onPointerDown = (pointer: PointerEvent<HTMLCanvasElement>) => {
        if (!photo) {
            pickPhoto();

            return;
        }

        pointer.currentTarget.setPointerCapture(pointer.pointerId);
        pointers.current.set(pointer.pointerId, {
            x: pointer.clientX,
            y: pointer.clientY,
        });
    };

    const onPointerMove = (pointer: PointerEvent<HTMLCanvasElement>) => {
        const points = pointers.current;
        const previous = points.get(pointer.pointerId);

        if (!previous) {
            return;
        }

        // Pixels de l'écran → pixels du visuel (1080 de large).
        const scale =
            VISUAL_WIDTH / pointer.currentTarget.getBoundingClientRect().width;
        const position = { x: pointer.clientX, y: pointer.clientY };
        const other = [...points].find(([id]) => id !== pointer.pointerId)?.[1];

        if (other) {
            // Deux doigts : l'écart entre eux règle le zoom, leur milieu déplace la photo.
            const before = Math.hypot(
                previous.x - other.x,
                previous.y - other.y,
            );
            const after = Math.hypot(
                position.x - other.x,
                position.y - other.y,
            );

            if (before > 0) {
                zoom((current) => current.zoom * (after / before));
            }

            move(
                ((position.x - previous.x) * scale) / 2,
                ((position.y - previous.y) * scale) / 2,
            );
        } else {
            move(
                (position.x - previous.x) * scale,
                (position.y - previous.y) * scale,
            );
        }

        points.set(pointer.pointerId, position);
    };

    const onPointerEnd = (pointer: PointerEvent<HTMLCanvasElement>) => {
        pointers.current.delete(pointer.pointerId);
    };

    const onKeyDown = (key: KeyboardEvent<HTMLCanvasElement>) => {
        const step = 24;
        const actions: Record<string, () => void> = {
            ArrowLeft: () => move(-step, 0),
            ArrowRight: () => move(step, 0),
            ArrowUp: () => move(0, -step),
            ArrowDown: () => move(0, step),
            '+': () => zoom((current) => current.zoom * 1.1),
            '=': () => zoom((current) => current.zoom * 1.1),
            '-': () => zoom((current) => current.zoom / 1.1),
        };

        if (photo && actions[key.key]) {
            key.preventDefault();
            actions[key.key]();
        }
    };

    const exportFile = async () => {
        const canvas = canvasRef.current;

        if (!canvas || !photo) {
            return null;
        }

        return fileRef.current ?? (await toFile(canvas));
    };

    const saveImage = async () => {
        const file = await exportFile();

        if (file) {
            download(file);
            setSaved(true);
        }
    };

    const share = async () => {
        const file = await exportFile();

        if (!file) {
            return;
        }

        const date = event.startsAt
            ? new Intl.DateTimeFormat('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  timeZone: EVENT_TIMEZONE,
              }).format(new Date(event.startsAt))
            : null;

        try {
            await navigator.share({
                files: [file],
                text: [
                    `🔥 Moi aussi, j’y serai ! ${event.name}${date ? `, ${date}` : ''}.`,
                    `Inscris-toi toi aussi 👉 ${window.location.origin}${create.url({ query: { via: 'visuel' } })}`,
                ].join('\n'),
            });
            setSaved(true);
        } catch (error) {
            // Menu de partage fermé : rien à faire. Partage refusé : on enregistre l'image.
            if (
                !(error instanceof DOMException && error.name === 'AbortError')
            ) {
                download(file);
                setSaved(true);
            }
        }
    };

    return (
        <EventShell>
            <Head title="Mon visuel « J’y serai ! »" />

            <div className="grid gap-10 lg:grid-cols-[minmax(0,25rem)_1fr] lg:gap-x-16 lg:gap-y-8">
                <header className="text-center lg:col-start-2 lg:text-left">
                    <p className="mb-3 text-xs font-bold tracking-[0.3em] text-event-accent-ink uppercase sm:text-sm">
                        — Fais passer le mot
                    </p>
                    <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-event-fg sm:text-5xl">
                        Moi aussi,{' '}
                        <span className="font-charm font-bold text-event-accent">
                            j’y serai !
                        </span>
                    </h1>
                    <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-event-muted sm:text-lg lg:mx-0">
                        Crée ton visuel officiel en quelques secondes et
                        publie-le en statut pour inviter tes proches.
                    </p>
                </header>

                <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
                    <div className="lg:sticky lg:top-28">
                        <div className="relative mx-auto w-full max-w-[21rem] sm:max-w-[24rem] lg:max-w-none">
                            <div
                                aria-hidden
                                className="absolute inset-x-8 top-16 bottom-10 rounded-full bg-event-accent/45 blur-3xl"
                            />
                            <div className="relative rounded-[1.9rem] bg-[#1c1410] p-1.5 shadow-2xl shadow-black/30">
                                <div className="relative overflow-hidden rounded-[1.5rem] bg-[#0c0907]">
                                    <canvas
                                        ref={canvasRef}
                                        width={VISUAL_WIDTH}
                                        height={VISUAL_HEIGHT}
                                        role="img"
                                        aria-label="Aperçu de ton visuel. Avec le clavier : flèches pour déplacer la photo, + et − pour zoomer."
                                        tabIndex={photo ? 0 : -1}
                                        onPointerDown={onPointerDown}
                                        onPointerMove={onPointerMove}
                                        onPointerUp={onPointerEnd}
                                        onPointerCancel={onPointerEnd}
                                        onKeyDown={onKeyDown}
                                        className={cn(
                                            'block aspect-[9/16] h-auto w-full select-none',
                                            photo
                                                ? 'cursor-grab touch-none focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-event-accent active:cursor-grabbing'
                                                : 'cursor-pointer',
                                        )}
                                    />

                                    {(!assets || loadingPhoto) && !failed && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <LoaderCircle className="size-8 animate-spin text-white/80" />
                                        </div>
                                    )}

                                    {failed && (
                                        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold text-white/80">
                                            Le cadre n’a pas pu être chargé.
                                            Recharge la page pour réessayer.
                                        </p>
                                    )}

                                    {assets && !photo && !loadingPhoto && (
                                        <button
                                            type="button"
                                            onClick={pickPhoto}
                                            style={{
                                                top: `${ADD_BUTTON_TOP}%`,
                                            }}
                                            className="absolute left-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold whitespace-nowrap text-event-fg shadow-xl shadow-black/40 transition hover:scale-105"
                                        >
                                            <Camera className="size-5 text-event-accent-ink" />
                                            Ajouter ma photo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-event-muted">
                            <Move className="size-3.5 shrink-0" />
                            {photo
                                ? 'Fais glisser la photo pour la placer, pince pour zoomer.'
                                : 'Aperçu en direct de ton visuel.'}
                        </p>
                    </div>
                </div>

                <div className="lg:col-start-2">
                    <ol className="space-y-3">
                        <Step
                            number={1}
                            title="Choisis ta photo"
                            done={!!photo}
                        >
                            <p className="text-sm text-event-muted">
                                Un portrait de face, bien éclairé, rend le
                                mieux.
                            </p>
                            <button
                                type="button"
                                onClick={pickPhoto}
                                disabled={!assets || loadingPhoto}
                                className={cn(
                                    buttonClass,
                                    'mt-3 w-full',
                                    photo
                                        ? 'border border-event-border bg-white text-event-fg hover:border-event-accent hover:text-event-accent-ink'
                                        : primaryClass,
                                )}
                            >
                                <ImagePlus className="size-5" />
                                {photo
                                    ? 'Changer de photo'
                                    : 'Importer ma photo'}
                            </button>
                            <input
                                ref={inputRef}
                                type="file"
                                accept="image/*"
                                tabIndex={-1}
                                aria-hidden
                                className="sr-only"
                                onChange={choosePhoto}
                            />
                            {photoError && (
                                <p
                                    role="alert"
                                    className="mt-2 text-sm font-medium text-red-600"
                                >
                                    {photoError}
                                </p>
                            )}
                        </Step>

                        <Step
                            number={2}
                            title="Ajoute ton prénom"
                            hint="Facultatif"
                            done={!!name.trim()}
                        >
                            <input
                                type="text"
                                value={name}
                                onChange={(change) =>
                                    setName(
                                        change.target.value.slice(
                                            0,
                                            MAX_NAME_LENGTH,
                                        ),
                                    )
                                }
                                maxLength={MAX_NAME_LENGTH}
                                autoComplete="given-name"
                                placeholder="Ton prénom"
                                aria-label="Ton prénom"
                                className="h-12 w-full rounded-xl border border-event-border bg-white px-4 text-base text-event-fg transition outline-none placeholder:text-event-muted/60 focus:border-event-accent focus:ring-4 focus:ring-event-accent/15"
                            />
                            <p className="mt-2 text-xs text-event-muted">
                                Il s’affiche sous ta photo.
                            </p>
                        </Step>

                        <Step
                            number={3}
                            title="Ajuste le cadrage"
                            disabled={!photo}
                        >
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    aria-label="Dézoomer"
                                    onClick={() =>
                                        zoom((current) => current.zoom / 1.15)
                                    }
                                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-event-border text-event-fg transition hover:border-event-accent hover:text-event-accent-ink"
                                >
                                    <ZoomOut className="size-5" />
                                </button>
                                <input
                                    type="range"
                                    min={1}
                                    max={MAX_ZOOM}
                                    step={0.01}
                                    value={placement.zoom}
                                    onChange={(change) =>
                                        zoom(() => Number(change.target.value))
                                    }
                                    aria-label="Zoom"
                                    className="h-2 min-w-0 flex-1 cursor-pointer accent-event-accent disabled:cursor-not-allowed"
                                />
                                <button
                                    type="button"
                                    aria-label="Zoomer"
                                    onClick={() =>
                                        zoom((current) => current.zoom * 1.15)
                                    }
                                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-event-border text-event-fg transition hover:border-event-accent hover:text-event-accent-ink"
                                >
                                    <ZoomIn className="size-5" />
                                </button>
                                <span className="w-12 shrink-0 text-right text-sm font-semibold text-event-fg tabular-nums">
                                    {Math.round(placement.zoom * 100)} %
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPlacement(CENTERED)}
                                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-event-accent-ink hover:text-event-fg"
                            >
                                <RotateCcw className="size-4" />
                                Recentrer
                            </button>
                        </Step>
                    </ol>

                    <div className="mt-6 grid gap-2 sm:grid-cols-2">
                        {canShareFiles && (
                            <button
                                type="button"
                                onClick={share}
                                disabled={!photo}
                                className={cn(buttonClass, primaryClass)}
                            >
                                <Share2 className="size-5" />
                                Partager mon visuel
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={saveImage}
                            disabled={!photo}
                            className={cn(
                                buttonClass,
                                canShareFiles
                                    ? 'bg-event-fg text-white hover:opacity-90'
                                    : cn(primaryClass, 'sm:col-span-2'),
                            )}
                        >
                            <Download className="size-5" />
                            Télécharger
                        </button>
                    </div>

                    {!photo && (
                        <p className="mt-2 text-center text-xs text-event-muted sm:text-left">
                            Ajoute d’abord ta photo pour enregistrer ton visuel.
                        </p>
                    )}

                    {saved && (
                        <p
                            role="status"
                            className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                        >
                            <Check className="mt-0.5 size-4 shrink-0" />
                            Ton visuel est prêt ! Publie-le en statut WhatsApp
                            depuis ta galerie.
                        </p>
                    )}

                    <div className="mt-6 flex gap-3 rounded-2xl border border-dashed border-event-accent/50 bg-event-surface px-5 py-4">
                        <Lock className="mt-0.5 size-5 shrink-0 text-event-accent-ink" />
                        <div>
                            <p className="text-sm font-bold text-event-fg">
                                Ta photo reste privée
                            </p>
                            <p className="mt-0.5 text-sm text-event-muted">
                                Le visuel est créé directement sur ton appareil
                                : ta photo n’est ni envoyée ni enregistrée sur
                                nos serveurs.
                            </p>
                        </div>
                    </div>

                    {!fromRegistration && (
                        <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl bg-[#1c1410] px-6 py-6 text-center text-white sm:flex-row sm:text-left">
                            <div className="flex-1">
                                <p className="text-lg font-extrabold">
                                    Pas encore inscrit ?
                                </p>
                                <p className="mt-1 text-sm text-white/70">
                                    L’inscription est rapide et ne prend qu’une
                                    minute.
                                </p>
                            </div>
                            <Link
                                href={create()}
                                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-event-accent px-6 py-3 font-bold text-white shadow-lg shadow-event-accent/30 transition hover:brightness-110"
                            >
                                Je m’inscris
                                <ArrowRight className="size-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </EventShell>
    );
}

function Step({
    number,
    title,
    hint,
    done = false,
    disabled = false,
    children,
}: {
    number: number;
    title: string;
    hint?: string;
    done?: boolean;
    disabled?: boolean;
    children: ReactNode;
}) {
    return (
        <li
            className={cn(
                'rounded-3xl border border-event-border bg-white p-5 transition sm:p-6',
                disabled && 'opacity-50',
            )}
        >
            <div className="mb-3 flex items-center gap-3">
                <span
                    className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white transition',
                        done ? 'bg-event-accent' : 'bg-event-fg',
                    )}
                >
                    {done ? (
                        <Check className="size-4" strokeWidth={3} />
                    ) : (
                        number
                    )}
                </span>
                <h2 className="font-bold text-event-fg">{title}</h2>
                {hint && (
                    <span className="ml-auto text-xs font-medium text-event-muted">
                        {hint}
                    </span>
                )}
            </div>
            <fieldset disabled={disabled} className="contents">
                {children}
            </fieldset>
        </li>
    );
}

/** Zoome autour du centre de l'arche : le cadrage choisi reste en place. */
function zoomTo(
    photo: HTMLCanvasElement,
    current: Placement,
    target: number,
): Placement {
    const zoom = Math.min(Math.max(target, 1), MAX_ZOOM);
    const ratio = zoom / current.zoom;

    return clampPlacement(photo, {
        zoom,
        x: current.x * ratio,
        y: current.y * ratio,
    });
}

function canShareImages(): boolean {
    if (typeof navigator === 'undefined' || !navigator.canShare) {
        return false;
    }

    try {
        return navigator.canShare({
            files: [new File([''], 'test.jpg', { type: 'image/jpeg' })],
        });
    } catch {
        return false;
    }
}

function toFile(canvas: HTMLCanvasElement): Promise<File> {
    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (blob) =>
                blob
                    ? resolve(
                          new File([blob], FILE_NAME, { type: 'image/jpeg' }),
                      )
                    : reject(new Error('Export du visuel impossible.')),
            'image/jpeg',
            0.92,
        ),
    );
}

function download(file: File) {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
