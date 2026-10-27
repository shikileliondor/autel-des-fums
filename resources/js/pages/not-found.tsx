import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import EventShell from '@/components/event/event-shell';
import { home } from '@/routes';

export default function NotFound() {
    return (
        <EventShell className="flex items-center">
            <Head title="Page introuvable" />

            <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <p className="font-charm text-8xl leading-none font-bold text-event-accent sm:text-9xl">
                    404
                </p>
                <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-event-fg sm:text-3xl">
                    Cette page n’existe pas.
                </h1>
                <p className="mt-3 text-event-muted">
                    Le lien est peut-être incorrect ou la page a été déplacée.
                </p>
                <Link
                    href={home()}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-event-fg px-6 py-3 font-bold text-white transition hover:bg-event-accent"
                >
                    <ArrowLeft className="size-5" />
                    Retour à l’accueil
                </Link>
            </div>
        </EventShell>
    );
}
