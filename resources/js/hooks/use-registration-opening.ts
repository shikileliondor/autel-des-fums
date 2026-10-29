import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { EVENT_TIMEZONE } from '@/components/event/event-shell';

// Décalage entre l'horloge du téléphone et celle du serveur, mesuré au premier
// chargement (toujours frais) : les pages rouvertes depuis l'historique gardent
// un serverTime ancien qui fausserait le calcul.
let clockOffset: number | null = null;

function serverNow(): number {
    return Date.now() + (clockOffset ?? 0);
}

/**
 * Temps restant avant l'ouverture des inscriptions, d'après l'horloge du serveur
 * (un téléphone en avance de quelques minutes verrait sinon un formulaire refusé).
 */
export function useRegistrationOpening() {
    const { registrationsOpenAt, serverTime } = usePage().props.event;
    clockOffset ??= serverTime - Date.now();

    const target = registrationsOpenAt
        ? new Date(registrationsOpenAt).getTime()
        : 0;
    const [remaining, setRemaining] = useState(() =>
        Math.max(0, target - serverNow()),
    );
    const isOpen = remaining === 0;

    useEffect(() => {
        if (isOpen) {
            return;
        }

        const id = setInterval(
            () => setRemaining(Math.max(0, target - serverNow())),
            1000,
        );

        return () => clearInterval(id);
    }, [target, isOpen]);

    return {
        isOpen,
        remaining,
        label: registrationsOpenAt ? openingLabel(registrationsOpenAt) : null,
    };
}

/** « ce soir à 19h59 », ou « le vendredi 30 octobre à 19h59 » un autre jour. */
function openingLabel(iso: string): string {
    const opensAt = new Date(iso);
    const time = new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: EVENT_TIMEZONE,
    })
        .format(opensAt)
        .replace(':', 'h');
    const day = (date: Date) =>
        new Intl.DateTimeFormat('fr-FR', {
            dateStyle: 'short',
            timeZone: EVENT_TIMEZONE,
        }).format(date);

    if (day(opensAt) === day(new Date(serverNow()))) {
        return `${Number(time.slice(0, 2)) >= 18 ? 'ce soir' : 'aujourd’hui'} à ${time}`;
    }

    const date = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: EVENT_TIMEZONE,
    }).format(opensAt);

    return `le ${date} à ${time}`;
}
