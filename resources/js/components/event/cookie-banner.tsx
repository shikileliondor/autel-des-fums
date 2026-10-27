import { Link } from '@inertiajs/react';
import { Cookie } from 'lucide-react';
import { useEffect, useState } from 'react';
import { privacy } from '@/routes';

const STORAGE_KEY = 'adp-cookies-ok';

/**
 * Bandeau d'information : le site n'utilise que des cookies techniques
 * (session, sécurité) et garde le panier sur l'appareil, sans suivi ni publicité.
 * Affiché jusqu'à ce que le visiteur clique sur « J'ai compris ».
 */
export default function CookieBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            setVisible(!window.localStorage.getItem(STORAGE_KEY));
        } catch {
            // Stockage indisponible (navigation privée) : on n'insiste pas.
        }
    }, []);

    if (!visible) {
        return null;
    }

    const accept = () => {
        try {
            window.localStorage.setItem(STORAGE_KEY, '1');
        } catch {
            // Sans stockage, le bandeau reviendra à la prochaine visite.
        }

        setVisible(false);
    };

    return (
        <div
            role="region"
            aria-label="Cookies"
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl rounded-2xl border border-event-border bg-white p-4 text-sm text-event-fg shadow-2xl sm:p-5"
        >
            <div className="flex items-start gap-3">
                <Cookie className="mt-0.5 size-5 shrink-0 text-event-accent-ink" />
                <p className="leading-relaxed text-event-muted">
                    Ce site utilise uniquement des{' '}
                    <strong className="text-event-fg">
                        cookies techniques
                    </strong>{' '}
                    nécessaires à son fonctionnement (session, sécurité) et
                    garde ton panier sur ton appareil. Aucun cookie publicitaire
                    ni de suivi.{' '}
                    <Link
                        href={privacy()}
                        className="font-semibold text-event-fg underline"
                    >
                        En savoir plus
                    </Link>
                </p>
            </div>
            <div className="mt-3 flex justify-end">
                <button
                    type="button"
                    onClick={accept}
                    className="rounded-xl bg-event-fg px-5 py-2.5 text-sm font-bold text-white transition hover:bg-event-accent"
                >
                    J’ai compris
                </button>
            </div>
        </div>
    );
}
