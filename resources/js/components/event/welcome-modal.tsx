import { Link, usePage } from '@inertiajs/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { ArrowRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EVENT_TIMEZONE } from '@/components/event/event-shell';
import { Dialog, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { create } from '@/routes/registration';

const SEEN_KEY = 'adp-modale-vue';

function datePart(startsAt: string, options: Intl.DateTimeFormatOptions) {
    return new Intl.DateTimeFormat('fr-FR', {
        ...options,
        timeZone: EVENT_TIMEZONE,
    }).format(new Date(startsAt));
}

/**
 * Fenêtre d'accueil affichée une fois par visite (sessionStorage), dans le
 * style de l'affiche : présentation à gauche, date en grand à droite.
 */
export default function WelcomeModal() {
    const { event } = usePage().props;
    const [open, setOpen] = useState(false);

    useEffect(() => {
        try {
            if (window.sessionStorage.getItem(SEEN_KEY)) {
                return;
            }
        } catch {
            // Stockage indisponible : on affiche quand même la fenêtre.
        }

        // Marquée « vue » seulement à l'ouverture effective : en StrictMode,
        // le premier passage de l'effet est annulé avant la fin du délai.
        const timer = setTimeout(() => {
            setOpen(true);

            try {
                window.sessionStorage.setItem(SEEN_KEY, '1');
            } catch {
                // Sans stockage, la fenêtre se rouvrira à chaque visite.
            }
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogPortal>
                <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
                <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-hidden overflow-y-auto rounded-[1.5rem] border-4 border-white bg-white shadow-2xl duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 md:grid-cols-[1fr_12rem]">
                    <div className="relative flex flex-col items-center px-5 pt-14 pb-7 text-center sm:px-10 sm:py-8">
                        <img
                            src="/image/logo-autel-des-parfums-dark.png"
                            alt={event.name}
                            className="h-8 w-auto sm:h-10"
                        />

                        <p className="mt-5 text-[10px] font-bold tracking-[0.3em] text-event-muted uppercase sm:text-xs">
                            {event.hostChurch}
                        </p>

                        <DialogPrimitive.Title className="mt-2 font-charm text-4xl leading-[1.1] font-bold text-event-fg sm:text-5xl">
                            L’Autel{' '}
                            <span className="text-event-accent">
                                des Parfums
                            </span>
                        </DialogPrimitive.Title>
                        <p className="mt-1.5 text-base text-event-accent-ink sm:text-xl">
                            {event.tagline}
                        </p>

                        <div className="relative mt-6 w-full max-w-md">
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-event-fg px-2 py-0.5 text-xs font-bold text-white italic">
                                thème
                            </span>
                            <div className="rounded-lg bg-event-fg px-4 pt-5 pb-3 shadow-lg">
                                <p className="text-lg leading-tight font-extrabold text-event-accent uppercase sm:text-2xl">
                                    {event.theme}
                                </p>
                            </div>
                        </div>

                        <DialogPrimitive.Description className="mt-4 max-w-md text-sm leading-relaxed text-event-muted sm:text-base">
                            Un temps d’adoration, de louange et d’intercession,
                            pour se tenir ensemble devant Dieu.
                        </DialogPrimitive.Description>

                        <Link
                            href={create()}
                            onClick={() => setOpen(false)}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-event-fg px-6 py-3 text-base font-bold text-white shadow-lg shadow-event-fg/20 transition hover:bg-event-accent"
                        >
                            Participer
                            <ArrowRight className="size-5" />
                        </Link>
                    </div>

                    <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-event-fg text-center md:flex">
                        <div className="absolute -top-20 -right-20 size-56 rounded-full border-[2.5rem] border-white/10" />
                        <div className="absolute -bottom-24 -left-14 size-56 rounded-full bg-event-accent" />
                        {event.startsAt ? (
                            <div className="relative">
                                <p className="text-[5.5rem] leading-none font-extrabold text-white">
                                    {datePart(event.startsAt, {
                                        day: 'numeric',
                                    })}
                                </p>
                                <p className="mt-1 text-lg font-extrabold text-event-accent uppercase">
                                    {datePart(event.startsAt, {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-white/70 capitalize">
                                    {datePart(event.startsAt, {
                                        weekday: 'long',
                                    })}
                                </p>
                            </div>
                        ) : (
                            <p className="relative text-2xl font-extrabold text-white">
                                Date bientôt annoncée
                            </p>
                        )}
                    </div>

                    {event.startsAt && (
                        <p className="bg-event-fg px-5 py-3 text-center text-base font-extrabold text-white first-letter:uppercase md:hidden">
                            {datePart(event.startsAt, {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                    )}

                    <DialogPrimitive.Close className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white text-event-fg shadow-lg transition hover:scale-105">
                        <X className="size-5" strokeWidth={3} />
                        <span className="sr-only">Fermer</span>
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPortal>
        </Dialog>
    );
}
