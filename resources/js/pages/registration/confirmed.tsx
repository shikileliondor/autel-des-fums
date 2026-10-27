import { Head, Link, usePage } from '@inertiajs/react';
import { Check, Copy, Download, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import ContactPeople from '@/components/event/contact-people';
import EventShell, { EVENT_TIMEZONE } from '@/components/event/event-shell';
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
        `Je suis ${isWoman ? 'la' : 'le'} ${ordinal} ${worshipper}.`,
        `« ${event.theme} »`,
        '',
        `Inscris-toi toi aussi 👉 ${window.location.origin}${create.url()}`,
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

                <div className="pop-in mt-8 w-full rounded-3xl bg-[#1c1410] px-6 py-8 text-white [animation-delay:0.25s] sm:px-10">
                    <p className="text-sm font-semibold tracking-[0.25em] text-white/60 uppercase">
                        Tu es {isWoman ? 'la' : 'le'}
                    </p>
                    <p className="mt-1 text-7xl font-extrabold tracking-tight text-event-accent tabular-nums sm:text-8xl">
                        {ordinal}
                    </p>
                    <p className="mt-1 text-lg font-bold sm:text-xl">
                        {worshipper}
                    </p>
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

/** 1ᵉʳ / 1ʳᵉ, puis 2ᵉ, 3ᵉ… */
function ordinalOf(rank: number, isWoman: boolean): string {
    if (rank === 1) {
        return isWoman ? '1ʳᵉ' : '1ᵉʳ';
    }

    return `${rank}ᵉ`;
}

function ShareActions({ message }: { message: string }) {
    const [copied, setCopied] = useState(false);
    const canShare = typeof navigator !== 'undefined' && !!navigator.share;

    const share = () => {
        // L'utilisateur peut fermer le menu de partage : ce n'est pas une erreur.
        navigator.share({ text: message }).catch(() => {});
    };

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
                Publie-le en statut WhatsApp et invite-les à venir adorer avec
                toi.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a
                    href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25d366] text-sm font-bold text-white transition hover:brightness-105"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="size-5"
                        fill="currentColor"
                        aria-hidden
                    >
                        <path d="M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.66L.6 23.6l6.03-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.26 0 11.35-5.09 11.35-11.34 0-3.03-1.18-5.88-3.33-8.02" />
                    </svg>
                    Partager sur WhatsApp
                </a>

                {canShare ? (
                    <button
                        type="button"
                        onClick={share}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-event-fg text-sm font-bold text-white transition hover:opacity-90"
                    >
                        <Share2 className="size-4" />
                        Partager ailleurs
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={copy}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-event-fg text-sm font-bold text-white transition hover:opacity-90"
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
        </section>
    );
}

const CONFETTI_COLORS = ['#f9731a', '#c2410c', '#fbbf24', '#fde68a', '#1c1410'];

/** Pluie de confettis aux couleurs du programme, jouée une seule fois. */
function Confetti() {
    const [pieces] = useState(() =>
        Array.from({ length: 70 }, (_, i) => ({
            left: Math.random() * 100,
            drift: `${(Math.random() - 0.5) * 30}vw`,
            delay: `${Math.random() * 0.8}s`,
            duration: `${2.6 + Math.random() * 1.8}s`,
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            width: 6 + Math.random() * 6,
            round: i % 4 === 0,
        })),
    );

    return (
        <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
        >
            {pieces.map((piece, i) => (
                <span
                    key={i}
                    className="confetti absolute -top-4 block"
                    style={
                        {
                            left: `${piece.left}%`,
                            width: piece.width,
                            height: piece.round
                                ? piece.width
                                : piece.width * 1.6,
                            borderRadius: piece.round ? '9999px' : '2px',
                            backgroundColor: piece.color,
                            '--drift': piece.drift,
                            '--delay': piece.delay,
                            '--duration': piece.duration,
                        } as CSSProperties
                    }
                />
            ))}
        </div>
    );
}
