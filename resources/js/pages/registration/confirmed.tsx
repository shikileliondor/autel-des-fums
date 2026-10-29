import { Head, Link, usePage } from '@inertiajs/react';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Confetti from '@/components/event/confetti';
import ContactPeople from '@/components/event/contact-people';
import EventShell, { EVENT_TIMEZONE } from '@/components/event/event-shell';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { create, pdf } from '@/routes/registration';

type Props = {
    registration: {
        reference: string;
        firstName: string;
        gender: 'homme' | 'femme';
        /** Position dans l'ordre des inscriptions (1 = premier inscrit). */
        rank: number;
    };
    /** Vrai uniquement juste après l'inscription (pas au rechargement). */
    autoDownload: boolean;
};

export default function RegistrationConfirmed({
    registration,
    autoDownload,
}: Props) {
    const { event } = usePage().props;
    const downloaded = useRef(false);
    const isWoman = registration.gender === 'femme';
    const ordinal = ordinalOf(registration.rank, isWoman);
    const worshipper = isWoman ? 'adoratrice inscrite' : 'adorateur inscrit';
    const isEarly = registration.rank <= EARLY_BIRDS;

    useEffect(() => {
        if (!autoDownload || downloaded.current) {
            return;
        }

        // Laisse la page s'afficher avant de lancer le téléchargement.
        const timer = setTimeout(() => {
            downloaded.current = true;

            const link = document.createElement('a');
            link.href = pdf.url();
            link.download = '';
            document.body.appendChild(link);
            link.click();
            link.remove();
        }, 800);

        return () => clearTimeout(timer);
    }, [autoDownload]);

    const date = event.startsAt
        ? new Intl.DateTimeFormat('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              timeZone: EVENT_TIMEZONE,
          }).format(new Date(event.startsAt))
        : null;

    const shareMessage = [
        `🔥 Je serai à ${event.name}${date ? ` le ${date}` : ''} !`,
        `Je suis ${isWoman ? 'la' : 'le'} ${ordinal} ${worshipper}${isEarly ? ', parmi les 100 premiers 🏅' : ''}.`,
        `« ${event.theme} »`,
        '',
        `Inscris-toi toi aussi 👉 ${window.location.origin}${create.url({ query: { via: 'partage' } })}`,
    ].join('\n');

    return (
        <EventShell className="flex items-center">
            <Head title="Inscription confirmée" />
            {autoDownload && <Confetti />}

            <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
                <div className="pop-in mb-6 flex size-20 items-center justify-center rounded-full bg-event-accent shadow-lg shadow-event-accent/30">
                    <Check className="size-10 text-white" strokeWidth={3} />
                </div>

                <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-event-fg sm:text-5xl">
                    Bienvenue à l’Autel,{' '}
                    <span className="font-charm font-bold text-event-accent">
                        {registration.firstName}
                    </span>{' '}
                    !
                </h1>
                <p className="mt-4 text-base leading-relaxed text-event-muted sm:text-lg">
                    Ton inscription est confirmée. On a hâte d’adorer avec toi.
                </p>

                <div className="pop-in mt-8 w-full rounded-3xl bg-event-fg px-6 py-8 text-white [animation-delay:0.25s] sm:px-10">
                    <p className="text-sm font-semibold tracking-[0.25em] text-white/60 uppercase">
                        Tu es {isWoman ? 'la' : 'le'}
                    </p>
                    <p className="mt-1 text-7xl font-extrabold tracking-tight text-event-accent tabular-nums sm:text-8xl">
                        {ordinal}
                    </p>
                    <p className="mt-1 text-lg font-bold sm:text-xl">
                        {worshipper}
                    </p>
                    {isEarly && (
                        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-event-accent px-4 py-1.5 text-sm font-bold text-white">
                            🏅 Parmi les {EARLY_BIRDS} premiers
                        </p>
                    )}
                    <p className="mt-4 text-sm text-white/70">
                        {event.name}
                        {date && ` · ${date}`}
                    </p>
                </div>

                <ShareActions message={shareMessage} />

                <div className="mt-10 w-full rounded-2xl border border-dashed border-event-accent/50 bg-event-surface px-6 py-5">
                    <p className="text-xs font-bold tracking-[0.2em] text-event-muted uppercase">
                        Ton code d’inscription
                    </p>
                    <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-event-fg">
                        {registration.reference}
                    </p>
                    <p className="mt-2 text-xs text-event-muted">
                        Le QR code de ton PDF sera scanné à l’entrée.
                    </p>
                    <a
                        href={pdf.url()}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-event-border bg-white px-5 py-3 text-sm font-semibold text-event-fg transition hover:border-event-accent hover:text-event-accent-ink"
                    >
                        <Download className="size-4" />
                        Télécharger mon PDF
                    </a>
                    {autoDownload && (
                        <p className="mt-2 text-xs text-event-muted">
                            Ton PDF se télécharge automatiquement. Sinon,
                            utilise le bouton ci-dessus.
                        </p>
                    )}
                </div>

                <p className="mt-8 font-semibold text-event-fg/80">
                    Que Dieu te bénisse abondamment et à très bientôt.
                </p>

                <ContactPeople className="mt-10 w-full" />

                <Link
                    href={home()}
                    className="mt-10 text-sm font-semibold text-event-accent-ink hover:text-event-fg"
                >
                    Retour à l’accueil
                </Link>
            </div>
        </EventShell>
    );
}

// Badge « Parmi les 100 premiers » sur la confirmation et le message partagé.
const EARLY_BIRDS = 100;

/** 1ᵉʳ / 1ʳᵉ, puis 2ᵉ, 3ᵉ… */
function ordinalOf(rank: number, isWoman: boolean): string {
    if (rank === 1) {
        return isWoman ? '1ʳᵉ' : '1ᵉʳ';
    }

    return `${rank}ᵉ`;
}

// L'affiche officielle, jointe en photo quand le téléphone sait partager des fichiers.
const POSTER_URL = '/image/souvenirs/souvenir-5.jpeg';

const buttonClass =
    'inline-flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-bold transition';

function ShareActions({ message }: { message: string }) {
    const [copied, setCopied] = useState(false);
    const [poster, setPoster] = useState<File | null>(null);
    const canShare = typeof navigator !== 'undefined' && !!navigator.share;

    // Préchargée : le partage doit partir dès le clic, sinon Safari le refuse.
    useEffect(() => {
        if (!navigator.canShare) {
            return;
        }

        let cancelled = false;

        fetch(POSTER_URL)
            .then((response) => response.blob())
            .then((blob) => {
                const file = new File([blob], 'autel-des-parfums.jpg', {
                    type: 'image/jpeg',
                });

                if (!cancelled && navigator.canShare({ files: [file] })) {
                    setPoster(file);
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, []);

    // L'utilisateur peut fermer le menu de partage : ce n'est pas une erreur.
    const share = (data: ShareData) => navigator.share(data).catch(() => {});

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Presse-papiers bloqué : les autres boutons restent disponibles.
        }
    };

    return (
        <section className="mt-8 w-full">
            <h2 className="text-lg font-extrabold text-event-fg">
                Dis-le à tes proches 🔥
            </h2>
            <p className="mt-1 text-sm text-event-muted">
                Publie l’affiche en statut WhatsApp et invite-les à venir adorer
                avec toi.
            </p>

            {poster && (
                <button
                    type="button"
                    onClick={() => share({ files: [poster], text: message })}
                    className={cn(
                        buttonClass,
                        'mt-4 h-auto w-full gap-4 bg-event-accent p-3 text-left text-white hover:opacity-90',
                    )}
                >
                    <img
                        src={POSTER_URL}
                        alt=""
                        className="h-20 w-15 shrink-0 rounded-lg object-cover"
                    />
                    <span className="flex-1">
                        <span className="block text-base">
                            Partager avec l’affiche
                        </span>
                        <span className="block text-xs font-medium opacity-90">
                            Statut WhatsApp, discussions, Facebook…
                        </span>
                    </span>
                    <Share2 className="mr-2 size-5 shrink-0" />
                </button>
            )}

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <a
                    // api.whatsapp.com garde les emojis intacts (wa.me les casse sur ordinateur).
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        buttonClass,
                        'bg-[#25d366] text-white hover:brightness-105',
                    )}
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="currentColor"
                        aria-hidden
                    >
                        <path d="M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.66L.6 23.6l6.03-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.26 0 11.35-5.09 11.35-11.34 0-3.03-1.18-5.88-3.33-8.02" />
                    </svg>
                    {poster ? 'Message WhatsApp' : 'Partager sur WhatsApp'}
                </a>

                {canShare && !poster ? (
                    <button
                        type="button"
                        onClick={() => share({ text: message })}
                        className={cn(
                            buttonClass,
                            'bg-event-fg text-white hover:opacity-90',
                        )}
                    >
                        <Share2 className="size-4" />
                        Partager ailleurs
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={copy}
                        className={cn(
                            buttonClass,
                            'bg-event-fg text-white hover:opacity-90',
                        )}
                    >
                        {copied ? (
                            <Check className="size-4" />
                        ) : (
                            <Copy className="size-4" />
                        )}
                        {copied ? 'Message copié !' : 'Copier le message'}
                    </button>
                )}
            </div>

            {!poster && (
                <a
                    href={POSTER_URL}
                    download="autel-des-parfums.jpg"
                    className="mt-3 inline-block text-sm font-semibold text-event-accent-ink hover:text-event-fg"
                >
                    Télécharger l’affiche pour ton statut
                </a>
            )}
        </section>
    );
}
