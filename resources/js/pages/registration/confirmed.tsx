import { Head, Link } from '@inertiajs/react';
import { Check, Download } from 'lucide-react';
import { useEffect, useRef } from 'react';
import EventShell from '@/components/event/event-shell';
import { home } from '@/routes';
import { pdf } from '@/routes/registration';

type Props = {
    registration: {
        reference: string;
        firstName: string;
    };
    /** Vrai uniquement juste après l'inscription (pas au rechargement). */
    autoDownload: boolean;
};

export default function RegistrationConfirmed({
    registration,
    autoDownload,
}: Props) {
    const downloaded = useRef(false);

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

    return (
        <EventShell className="flex items-center">
            <Head title="Inscription confirmée" />

            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                <div className="mb-8 flex size-20 items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-50">
                    <Check
                        className="size-9 text-emerald-600"
                        strokeWidth={2}
                    />
                </div>

                <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-event-fg sm:text-6xl">
                    Inscription confirmée.
                </h1>

                <p className="mt-6 text-base leading-relaxed text-event-muted sm:text-lg">
                    Merci {registration.firstName}, ton inscription est bien
                    enregistrée. Garde précieusement ton code d’inscription (une
                    capture d’écran suffit).
                </p>

                <div className="mt-8 rounded-2xl border border-dashed border-event-accent/50 bg-event-surface px-8 py-5">
                    <p className="text-xs font-bold tracking-[0.2em] text-event-muted uppercase">
                        Ton code
                    </p>
                    <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-event-fg">
                        {registration.reference}
                    </p>
                </div>

                <a
                    href={pdf.url()}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-event-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                    <Download className="size-4" />
                    Télécharger en PDF
                </a>
                {autoDownload && (
                    <p className="mt-2 text-xs text-event-muted">
                        Ton PDF se télécharge automatiquement. Sinon, utilise le
                        bouton ci-dessus.
                    </p>
                )}

                <p className="mt-8 font-semibold text-event-fg/80">
                    Que Dieu te bénisse abondamment et à très bientôt.
                </p>

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
