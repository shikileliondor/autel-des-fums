import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    HandHeart,
    MapPin,
    Music,
    Sparkles,
} from 'lucide-react';
import Countdown from '@/components/event/countdown';
import SocialCards from '@/components/ui/card-fan-carousel';
import EventShell, { EVENT_TIMEZONE } from '@/components/event/event-shell';
import { create } from '@/routes/registration';

const moments = [
    {
        icon: Music,
        title: 'Louange & adoration',
        text: 'Un temps prolongé pour élever nos voix et nos cœurs vers Dieu.',
    },
    {
        icon: HandHeart,
        title: 'Intercession',
        text: 'Des prières qui montent devant le trône comme un parfum de bonne odeur.',
    },
    {
        icon: Sparkles,
        title: 'Présence de Dieu',
        text: 'Un rendez-vous pour se tenir devant Lui, simplement et ensemble.',
    },
];

const photos = [
    {
        src: '/image/souvenirs/souvenir-1.jpg',
        alt: 'Un fidèle en adoration, la main levée',
    },
    {
        src: '/image/souvenirs/souvenir-2.jpg',
        alt: 'Louange, les deux mains levées vers le ciel',
    },
    {
        src: '/image/souvenirs/souvenir-3.jpg',
        alt: 'L’assemblée debout dans la prière',
    },
    {
        src: '/image/souvenirs/souvenir-4.jpg',
        alt: 'Des fidèles vêtus de blanc pendant le culte',
    },
];

export default function Welcome() {
    const { event } = usePage().props;

    const date = event.startsAt
        ? new Intl.DateTimeFormat('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: EVENT_TIMEZONE,
          }).format(new Date(event.startsAt))
        : 'Date bientôt annoncée';

    const time =
        event.startsAt && event.hasTime
            ? new Intl.DateTimeFormat('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: EVENT_TIMEZONE,
              }).format(new Date(event.startsAt))
            : null;

    return (
        <EventShell>
            <Head title={event.tagline} />

            <section className="flex flex-col items-center text-center">
                <p className="mb-4 text-xs font-bold tracking-[0.25em] text-event-accent-ink uppercase sm:text-sm">
                    {event.tagline}
                </p>

                <h1 className="max-w-3xl text-[2.6rem] leading-[1.02] font-extrabold tracking-tight text-event-fg sm:text-7xl">
                    L’Autel des Parfums.
                </h1>

                <p className="mt-6 max-w-xl text-base leading-relaxed text-event-muted sm:text-lg">
                    « Que ma prière soit devant ta face comme l’encens, et
                    l’élévation de mes mains comme l’offrande du soir ! »
                    <span className="mt-1 block text-sm font-semibold text-event-fg/70">
                        Psaume 141:2
                    </span>
                </p>

                <Link
                    href={create()}
                    className="group mt-10 inline-flex items-center gap-2 rounded-full bg-event-accent px-8 py-4 text-base font-bold text-white shadow-lg shadow-event-accent/30 transition hover:brightness-110"
                >
                    Je m’inscris
                    <ArrowRight className="size-5 transition group-hover:translate-x-0.5" />
                </Link>

                {event.startsAt && (
                    <div className="mt-12 w-full max-w-lg">
                        <Countdown startsAt={event.startsAt} />
                    </div>
                )}
            </section>

            <section className="mt-16 grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-4 rounded-3xl border border-event-border bg-event-surface/60 p-5 lg:p-6">
                    <CalendarDays className="mt-0.5 size-6 shrink-0 text-event-accent-ink" />
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-event-muted uppercase">
                            Quand
                        </p>
                        <p className="mt-1 text-lg font-bold text-event-fg first-letter:uppercase">
                            {date}
                        </p>
                        {time && (
                            <p className="text-sm text-event-muted">
                                À partir de {time}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-start gap-4 rounded-3xl border border-event-border bg-event-surface/60 p-5 lg:p-6">
                    <MapPin className="mt-0.5 size-6 shrink-0 text-event-accent-ink" />
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-event-muted uppercase">
                            Où
                        </p>
                        <p className="mt-1 text-lg font-bold text-event-fg">
                            {event.venue ?? 'Lieu bientôt annoncé'}
                        </p>
                        <p className="text-sm text-event-muted">{event.city}</p>
                    </div>
                </div>
            </section>

            <section className="mt-16">
                <h2 className="text-center text-3xl font-extrabold tracking-tight text-event-fg sm:text-4xl">
                    Au programme
                </h2>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {moments.map(({ icon: Icon, title, text }) => (
                        <div
                            key={title}
                            className="rounded-3xl border border-event-border bg-event-surface/60 p-5 lg:p-6"
                        >
                            <Icon className="size-6 text-event-accent-ink" />
                            <h3 className="mt-4 text-lg font-bold text-event-fg">
                                {title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-event-muted">
                                {text}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-16">
                <h2 className="text-center text-3xl font-extrabold tracking-tight text-event-fg sm:text-4xl">
                    En images
                </h2>
                <p className="mx-auto mt-3 max-w-md text-center text-event-muted">
                    Quelques moments de la précédente édition.
                </p>
                <div className="mt-4">
                    <SocialCards
                        cards={photos.map((photo) => ({
                            imgUrl: photo.src,
                            alt: photo.alt,
                        }))}
                    />
                </div>
            </section>

            <section className="mt-16 rounded-3xl border border-event-accent/30 bg-gradient-to-br from-event-accent/20 to-event-accent/5 px-5 py-8 text-center sm:p-12">
                <h2 className="text-3xl font-extrabold tracking-tight text-event-fg sm:text-4xl">
                    Inscris-toi.
                </h2>
                <p className="mx-auto mt-3 max-w-md text-event-muted">
                    L’inscription est rapide et ne prend qu’une minute.
                </p>
                <Link
                    href={create()}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-event-fg px-8 py-4 font-bold text-white transition hover:bg-event-fg/90"
                >
                    Je m’inscris
                    <ArrowRight className="size-5" />
                </Link>
            </section>
        </EventShell>
    );
}
