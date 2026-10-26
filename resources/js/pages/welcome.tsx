import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CalendarDays, MapPin, ShoppingBag } from 'lucide-react';
import Countdown from '@/components/event/countdown';
import EventShell, { EVENT_TIMEZONE } from '@/components/event/event-shell';
import PhotoMosaic from '@/components/event/photo-mosaic';
import WelcomeModal from '@/components/event/welcome-modal';
import { formatPrice, products } from '@/lib/boutique';
import { boutique } from '@/routes';
import { create } from '@/routes/registration';

// Église Foursquare Niangon Révélation, Abidjan.
const MAP_URL = 'https://maps.app.goo.gl/4AziMiFafT5arnM77';
const MAP_EMBED_URL =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d894.8501701837606!2d-4.107708210679409!3d5.338199524430247!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfc1c190231bf1bd%3A0xce333398bde1a53!2zw4lnbGlzZSDDqXZhbmfDqWxpcXVlIEZvdXJzcXVhcmUgbmlhbmdvbiByw6l2w6lsYXRpb24!5e1!3m2!1sfr!2sci!4v1793033265098!5m2!1sfr!2sci';

const photos = [
    {
        src: '/image/souvenirs/souvenir-5.jpg',
        alt: 'Un fidèle en adoration, les deux mains levées vers le ciel',
        label: 'Célébration',
    },
    {
        src: '/image/souvenirs/souvenir-1.jpg',
        alt: 'Un fidèle en adoration, la main levée',
        label: 'Adoration',
    },
    {
        src: '/image/souvenirs/souvenir-2.jpg',
        alt: 'Louange, les deux mains levées vers le ciel',
        label: 'Louange',
    },
    {
        src: '/image/souvenirs/souvenir-3.jpg',
        alt: 'L’assemblée debout dans la prière',
        label: 'Prière',
    },
    {
        src: '/image/souvenirs/souvenir-4.jpg',
        alt: 'Des fidèles vêtus de blanc pendant le culte',
        label: 'Assemblée',
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
    // « Dimanche », pas « dimanche » : Intl renvoie le jour en minuscule.
    const displayDate = date.charAt(0).toUpperCase() + date.slice(1);

    const minPrice = Math.min(...products.map((product) => product.price));

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
            <WelcomeModal />

            <section className="grid gap-6 text-center lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12 lg:text-left">
                <div>
                    <p className="mb-4 text-xs font-bold tracking-[0.3em] text-event-accent-ink uppercase sm:text-sm">
                        — {event.tagline}
                    </p>
                    <h1 className="font-charm text-[3rem] leading-[1.1] font-bold text-event-fg sm:text-7xl">
                        L’Autel
                        <span className="block text-event-accent">
                            des Parfums
                        </span>
                    </h1>
                </div>
                <p className="mx-auto max-w-md text-base leading-relaxed text-event-muted sm:text-lg lg:mx-0 lg:max-w-sm lg:text-right">
                    <span>{displayDate}</span>
                    {time && <> à {time}</>} —{' '}
                    {[event.venue, event.city].filter(Boolean).join(', ')}.{' '}
                    {event.hostChurch}.
                </p>
            </section>

            <div className="my-8 border-t border-event-border sm:my-10" />

            <PhotoMosaic photos={photos} />

            <section className="mt-12 flex flex-col items-center text-center">
                <p className="max-w-xl text-base leading-relaxed text-event-muted sm:text-lg">
                    « Que ma prière soit devant ta face comme l’encens, et
                    l’élévation de mes mains comme l’offrande du soir ! »
                    <span className="mt-1 block text-sm font-semibold text-event-fg/70">
                        Psaume 141:2
                    </span>
                </p>

                <Link
                    href={create()}
                    className="group mt-8 inline-flex items-center gap-2 rounded-full bg-event-accent px-8 py-4 text-base font-bold text-white shadow-lg shadow-event-accent/30 transition hover:brightness-110"
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
                        <p className="mt-1 text-lg font-bold text-event-fg">
                            {displayDate}
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
                        <a
                            href={MAP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-event-accent-ink hover:text-event-fg"
                        >
                            Voir l’itinéraire
                            <ArrowRight className="size-3.5" />
                        </a>
                    </div>
                </div>

                <div className="overflow-hidden rounded-3xl border border-event-border sm:col-span-2">
                    <iframe
                        src={MAP_EMBED_URL}
                        title="Plan d’accès : Église Foursquare Niangon Révélation"
                        className="block h-72 w-full sm:h-96"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                </div>
            </section>

            <section className="mt-16">
                <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
                    <div>
                        <p className="text-xs font-bold tracking-[0.25em] text-event-accent-ink uppercase">
                            Boutique
                        </p>
                        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-event-fg sm:text-4xl">
                            Le t-shirt de l’Autel
                        </h2>
                        <p className="mt-2 max-w-md text-event-muted">
                            {products.length} couleurs, à partir de{' '}
                            {formatPrice(minPrice)}. Floquage personnalisé
                            possible.
                        </p>
                    </div>
                    <Link
                        href={boutique()}
                        className="hidden shrink-0 items-center gap-2 rounded-full border border-event-border px-6 py-3 font-bold text-event-fg transition hover:border-event-accent hover:text-event-accent-ink sm:inline-flex"
                    >
                        Voir la boutique
                        <ArrowRight className="size-5" />
                    </Link>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                    {products.slice(0, 4).map((product) => (
                        <Link
                            key={product.id}
                            href={boutique()}
                            className="group overflow-hidden rounded-2xl border border-event-border bg-event-surface"
                        >
                            <img
                                src={product.image}
                                alt={product.name}
                                loading="lazy"
                                className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                            <div className="p-3">
                                <p className="truncate text-sm font-semibold text-event-fg">
                                    {product.name}
                                </p>
                                <p className="text-sm text-event-accent-ink">
                                    {formatPrice(product.price)}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                <Link
                    href={boutique()}
                    className="mt-6 flex items-center justify-center gap-2 rounded-full bg-event-accent px-6 py-3.5 font-bold text-white shadow-lg shadow-event-accent/30 transition hover:brightness-110 sm:hidden"
                >
                    <ShoppingBag className="size-5" />
                    Voir la boutique
                </Link>
            </section>

            <section className="mt-16 rounded-3xl border border-event-border bg-white px-5 py-8 text-center sm:p-12">
                <h2 className="text-3xl font-extrabold tracking-tight text-event-fg sm:text-4xl">
                    Inscris-toi.
                </h2>
                <p className="mx-auto mt-3 max-w-md text-event-muted">
                    L’inscription est rapide et ne prend qu’une minute.
                </p>
                <Link
                    href={create()}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-event-accent px-8 py-4 font-bold text-white shadow-lg shadow-event-accent/30 transition hover:brightness-110"
                >
                    Je m’inscris
                    <ArrowRight className="size-5" />
                </Link>
            </section>
        </EventShell>
    );
}
