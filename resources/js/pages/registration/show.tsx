import { Head, Link, usePage } from '@inertiajs/react';
import { BadgeCheck, CalendarDays, MapPin } from 'lucide-react';
import { EVENT_TIMEZONE } from '@/components/event/event-shell';
import { home } from '@/routes';

type Props = {
    registration: {
        reference: string;
        name: string;
        role: string | null;
        churchGroup: string | null;
        checkedIn: boolean;
    };
};

/** Page ouverte en scannant le QR code du PDF : la fiche simple de l'inscrit. */
export default function RegistrationShow({ registration }: Props) {
    const { event } = usePage().props;

    const date = event.startsAt
        ? new Intl.DateTimeFormat('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: EVENT_TIMEZONE,
          }).format(new Date(event.startsAt))
        : null;

    const place = [event.venue, event.city].filter(Boolean).join(', ');

    return (
        <main className="flex min-h-svh items-center justify-center bg-white px-4 py-10">
            <Head title={registration.name}>
                <meta name="robots" content="noindex" />
            </Head>

            <div className="w-full max-w-sm text-center">
                <Link href={home()} className="inline-block">
                    <img
                        src="/image/logo-autel-des-parfums-dark.png"
                        alt={event.name}
                        className="mx-auto h-16 w-auto"
                    />
                </Link>

                <div className="mt-8 overflow-hidden rounded-3xl border border-event-border">
                    <div className="flex items-center justify-center gap-2 bg-emerald-600 px-4 py-3 text-sm font-bold text-white">
                        <BadgeCheck className="size-5" />
                        {registration.checkedIn
                            ? 'Présent·e au programme'
                            : 'Inscription confirmée'}
                    </div>

                    <div className="px-6 py-8">
                        <p className="text-2xl font-extrabold text-event-fg">
                            {registration.name}
                        </p>
                        {(registration.role || registration.churchGroup) && (
                            <p className="mt-1 text-sm text-event-muted">
                                {[registration.role, registration.churchGroup]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                        )}

                        <p className="mt-6 text-xs font-bold tracking-[0.2em] text-event-muted uppercase">
                            Code d’inscription
                        </p>
                        <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-event-fg">
                            {registration.reference}
                        </p>
                    </div>

                    <div className="space-y-2 border-t border-event-border bg-event-surface px-6 py-5 text-left text-sm text-event-fg">
                        {date && (
                            <p className="flex items-center gap-2">
                                <CalendarDays className="size-4 shrink-0 text-event-accent" />
                                <span className="first-letter:uppercase">
                                    {date}
                                </span>
                            </p>
                        )}
                        {place && (
                            <p className="flex items-center gap-2">
                                <MapPin className="size-4 shrink-0 text-event-accent" />
                                {place}
                            </p>
                        )}
                    </div>
                </div>

                <p className="mt-6 text-sm text-event-muted">
                    {event.hostChurch}
                </p>
            </div>
        </main>
    );
}
