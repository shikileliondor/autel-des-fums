import { ArrowRight, Car, MapPinned } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type Props = {
    /** Lien Google Maps du lieu (ouvre l'appli Maps sur téléphone). */
    mapsUrl: string;
    latitude: number;
    longitude: number;
    children: ReactNode;
};

/**
 * Ouvre Yango avec la destination déjà remplie. Si l'appli n'est pas installée,
 * la page reste visible : on bascule alors sur le site de Yango.
 */
function openYango(latitude: number, longitude: number) {
    const fallback = window.setTimeout(() => {
        if (!document.hidden) {
            window.location.href = 'https://yango.com';
        }
    }, 1500);

    document.addEventListener(
        'visibilitychange',
        () => window.clearTimeout(fallback),
        { once: true },
    );

    window.location.href = `yango://route?end-lat=${latitude}&end-lon=${longitude}`;
}

const option =
    'flex w-full items-center gap-4 rounded-2xl border border-event-border bg-event-surface p-4 text-left transition hover:border-event-accent';

export default function DirectionsDialog({
    mapsUrl,
    latitude,
    longitude,
    children,
}: Props) {
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-sm rounded-3xl bg-white text-event-fg scheme-light">
                <DialogTitle className="text-xl font-extrabold">
                    Comment veux-tu y aller ?
                </DialogTitle>
                <DialogDescription className="text-event-muted">
                    Choisis l’application à ouvrir.
                </DialogDescription>

                <div className="mt-2 grid gap-3">
                    <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={option}
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-event-accent-ink shadow-sm">
                            <MapPinned className="size-6" />
                        </span>
                        <span className="flex-1">
                            <span className="block font-bold">Google Maps</span>
                            <span className="block text-sm text-event-muted">
                                Itinéraire à pied, en voiture ou en transport
                            </span>
                        </span>
                        <ArrowRight className="size-5 text-event-muted" />
                    </a>

                    <button
                        type="button"
                        onClick={() => openYango(latitude, longitude)}
                        className={option}
                    >
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-event-accent-ink shadow-sm">
                            <Car className="size-6" />
                        </span>
                        <span className="flex-1">
                            <span className="block font-bold">Yango</span>
                            <span className="block text-sm text-event-muted">
                                Commander une course jusqu’à l’église
                            </span>
                        </span>
                        <ArrowRight className="size-5 text-event-muted" />
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
