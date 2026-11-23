import { LoaderCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import VisualReel from '@/components/event/visual-reel';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { WallItem } from '@/lib/visual-wall';

/** Grille des visuels publiés, en bas de la page « J'y serai ! ». */
export default function VisualWall({
    items,
    total,
    hasMore,
    loadingMore,
    version,
    mineId,
    canModerate,
    onLoadMore,
    onRemove,
}: {
    items: WallItem[];
    total: number;
    hasMore: boolean;
    loadingMore: boolean;
    version: number;
    mineId: number | null;
    canModerate: boolean;
    onLoadMore: () => void;
    onRemove: (item: WallItem) => Promise<void>;
}) {
    const [opened, setOpened] = useState<WallItem | null>(null);
    const [removing, setRemoving] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const remove = async (item: WallItem) => {
        const own = item.id === mineId;

        if (
            !window.confirm(
                own
                    ? 'Retirer ton visuel du mur ?'
                    : 'Retirer ce visuel du mur pour tout le monde ?',
            )
        ) {
            return;
        }

        setRemoving(item.id);
        setError(null);

        try {
            await onRemove(item);
            setOpened(null);
        } catch {
            setError('Le visuel n’a pas pu être retiré. Réessaie.');
        } finally {
            setRemoving(null);
        }
    };

    const label = (item: WallItem) =>
        item.name ? `Visuel de ${item.name}` : 'Visuel d’un participant';

    return (
        <section
            id="mur"
            aria-labelledby="mur-titre"
            className="mt-16 scroll-mt-28 border-t border-event-border pt-12 sm:mt-20 sm:pt-16"
        >
            <div className="text-center">
                <p className="mb-3 text-xs font-bold tracking-[0.3em] text-event-accent-ink uppercase sm:text-sm">
                    — Le mur des participants
                </p>
                <h2
                    id="mur-titre"
                    className="text-3xl font-extrabold tracking-tight text-event-fg sm:text-4xl"
                >
                    Ils y seront{' '}
                    <span className="font-charm font-bold text-event-accent">
                        aussi !
                    </span>
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm text-event-muted sm:text-base">
                    {total > 0
                        ? `${total} visuel${total > 1 ? 's' : ''} sur le mur. Crée le tien plus haut, il s’ajoutera ici.`
                        : 'Personne n’a encore créé son visuel. Sois le premier, il s’affichera ici.'}
                </p>
            </div>

            {error && (
                <p
                    role="alert"
                    className="mx-auto mt-6 max-w-md rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700"
                >
                    {error}
                </p>
            )}

            <VisualReel version={version} />

            {items.length > 0 && (
                <ul className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-6">
                    {items.map((item) => {
                        const own = item.id === mineId;

                        return (
                            <li key={item.id} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setOpened(item)}
                                    className={cn(
                                        'block aspect-[9/16] w-full overflow-hidden rounded-xl bg-[#1c1410] shadow-md shadow-black/10 transition hover:scale-[1.02] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-event-accent',
                                        own &&
                                            'ring-3 ring-event-accent ring-offset-2 ring-offset-event-bg',
                                    )}
                                >
                                    <img
                                        src={item.thumb}
                                        alt={label(item)}
                                        width={360}
                                        height={640}
                                        loading="lazy"
                                        decoding="async"
                                        className="size-full object-cover"
                                    />
                                </button>

                                {own && (
                                    <span className="pointer-events-none absolute top-1.5 left-1.5 rounded-full bg-event-accent px-2 py-0.5 text-[11px] font-bold text-white shadow">
                                        Toi
                                    </span>
                                )}

                                {(own || canModerate) && (
                                    <button
                                        type="button"
                                        onClick={() => remove(item)}
                                        disabled={removing === item.id}
                                        aria-label={
                                            own
                                                ? 'Retirer mon visuel du mur'
                                                : `Retirer ce visuel (${label(item)})`
                                        }
                                        title="Retirer du mur"
                                        className="absolute top-1.5 right-1.5 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-red-600 disabled:opacity-60"
                                    >
                                        {removing === item.id ? (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="size-4" />
                                        )}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {hasMore && (
                <div className="mt-8 text-center">
                    <button
                        type="button"
                        onClick={onLoadMore}
                        disabled={loadingMore}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-event-border bg-white px-6 text-sm font-bold text-event-fg transition hover:border-event-accent hover:text-event-accent-ink disabled:opacity-60"
                    >
                        {loadingMore && (
                            <LoaderCircle className="size-4 animate-spin" />
                        )}
                        Voir plus de visuels
                    </button>
                </div>
            )}

            <Dialog
                open={opened !== null}
                onOpenChange={(open) => !open && setOpened(null)}
            >
                <DialogContent className="w-auto max-w-[min(24rem,calc(100%-2rem))] gap-3 border-0 bg-[#1c1410] p-2 text-white sm:max-w-sm [&>button]:top-3 [&>button]:right-3 [&>button]:rounded-full [&>button]:bg-black/60 [&>button]:p-1.5 [&>button]:opacity-100">
                    <DialogTitle className="sr-only">
                        {opened ? label(opened) : 'Visuel'}
                    </DialogTitle>
                    {opened && (
                        // Enveloppé : le style ci-dessus vise seulement le bouton de fermeture.
                        <div className="grid gap-3">
                            <img
                                src={opened.image}
                                alt={label(opened)}
                                width={720}
                                height={1280}
                                className="aspect-[9/16] max-h-[80vh] w-full rounded-lg object-cover"
                            />
                            {(opened.id === mineId || canModerate) && (
                                <button
                                    type="button"
                                    onClick={() => remove(opened)}
                                    disabled={removing === opened.id}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white/10 text-sm font-bold transition hover:bg-red-600 disabled:opacity-60"
                                >
                                    <Trash2 className="size-4" />
                                    Retirer du mur
                                </button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
