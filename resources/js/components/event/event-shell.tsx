import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import EventNavbar from '@/components/event/event-navbar';
import WhatsAppButton from '@/components/event/whatsapp-button';
import { cn } from '@/lib/utils';
import { boutique, home, privacy } from '@/routes';

// Dates are shown in Abidjan time whatever the visitor's device timezone.
export const EVENT_TIMEZONE = 'Africa/Abidjan';

export function formatEventDate(startsAt: string | null): string | null {
    if (!startsAt) {
        return null;
    }

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: EVENT_TIMEZONE,
    }).format(new Date(startsAt));
}

export function EventLogo({ className }: { className?: string }) {
    return (
        <Link href={home()} className={cn('block shrink-0', className)}>
            <img
                src="/image/logo-autel-des-parfums-dark.png"
                alt="L’Autel des Parfums"
                className="h-9 w-auto sm:h-12"
            />
        </Link>
    );
}

export default function EventShell({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    const { event } = usePage().props;

    return (
        <div className="relative min-h-screen overflow-x-clip bg-event-bg font-sans text-event-fg antialiased scheme-light">
            <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 sm:px-10">
                <EventNavbar />

                <main className={cn('flex-1 py-10 sm:py-16', className)}>
                    {children}
                </main>

                {event.contactPhone && (
                    <WhatsAppButton phone={event.contactPhone} />
                )}

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-event-border py-8 text-xs text-event-muted">
                    <p>
                        {event.name} · {event.tagline}.
                    </p>
                    <div className="flex gap-5">
                        <Link href={boutique()} className="hover:text-event-fg">
                            Boutique
                        </Link>
                        <Link href={privacy()} className="hover:text-event-fg">
                            Confidentialité
                        </Link>
                    </div>
                </footer>
            </div>
        </div>
    );
}
