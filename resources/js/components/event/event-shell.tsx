import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { home, privacy } from '@/routes';

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
    const date = formatEventDate(event.startsAt);

    return (
        <div className="relative min-h-screen overflow-hidden bg-event-bg font-sans text-event-fg antialiased scheme-light">
            <div
                aria-hidden
                className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-event-accent/10 blur-[140px]"
            />

            <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 sm:px-10">
                <header className="flex items-center justify-between gap-3 border-b border-event-border py-6 sm:py-8">
                    <EventLogo />
                    <p className="flex items-center gap-2 text-right text-[10px] font-bold tracking-[0.14em] whitespace-nowrap text-event-muted uppercase sm:text-xs sm:tracking-[0.18em]">
                        <span className="size-2 shrink-0 rounded-full bg-event-accent" />
                        {event.city} · {date ?? 'Date à venir'}
                    </p>
                </header>

                <main className={cn('flex-1 py-10 sm:py-16', className)}>
                    {children}
                </main>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-event-border py-8 text-xs text-event-muted">
                    <p>
                        {event.name} · {event.tagline}.
                    </p>
                    <Link href={privacy()} className="hover:text-event-fg">
                        Confidentialité
                    </Link>
                </footer>
            </div>
        </div>
    );
}
