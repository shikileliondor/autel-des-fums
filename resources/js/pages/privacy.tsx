import { Head, usePage } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import EventShell from '@/components/event/event-shell';

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <p className="leading-relaxed text-event-muted">
            <strong className="font-bold text-event-fg">{title}.</strong>{' '}
            {children}
        </p>
    );
}

export default function Privacy() {
    const { event } = usePage().props;

    const contact = (
        <>
            par e-mail à{' '}
            <a
                href={`mailto:${event.contactEmail}`}
                className="font-semibold text-event-fg underline underline-offset-2"
            >
                {event.contactEmail}
            </a>
            {event.contactPhone && (
                <> ou sur WhatsApp au {event.contactPhone}</>
            )}
        </>
    );

    return (
        <EventShell>
            <Head title="Confidentialité" />

            <div className="mx-auto max-w-2xl">
                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-event-accent/30 bg-event-accent/15">
                        <ShieldCheck
                            className="size-7 text-event-accent"
                            strokeWidth={1.6}
                        />
                    </div>
                    <p className="mb-3 text-xs font-bold tracking-[0.25em] text-event-accent uppercase">
                        Confidentialité
                    </p>
                    <h1 className="text-4xl font-extrabold tracking-tight text-event-fg sm:text-5xl">
                        Vos données, en confiance.
                    </h1>
                </div>

                <div className="mt-12 grid gap-6">
                    <Section title="Responsable">
                        L’équipe d’organisation de {event.name}, programme
                        d’adoration accueilli par l’{event.hostChurch}. Contact
                        : {contact}.
                    </Section>

                    <Section title="Ce que nous recueillons et pourquoi">
                        Votre nom, votre prénom, votre sexe, votre numéro de
                        téléphone (WhatsApp) et votre ville ou commune servent à
                        enregistrer votre inscription, vous attribuer un code
                        d’inscription et organiser l’accueil. Votre e-mail, si
                        vous le donnez, sert à vous envoyer la confirmation de
                        votre inscription.
                    </Section>

                    <Section title="Église">
                        Cette question est facultative : y répondre ou non ne
                        change rien à votre place. Votre réponse sert uniquement
                        à des statistiques internes.
                    </Section>

                    <Section title="Qui y a accès">
                        Seuls les membres de l’équipe d’organisation habilités,
                        avec un compte personnel protégé par mot de passe. Vos
                        données ne sont ni vendues ni cédées, et ne servent à
                        aucune publicité.
                    </Section>

                    <Section title="Où et combien de temps">
                        Vos données sont stockées sur les serveurs de notre
                        hébergeur et circulent de façon chiffrée (HTTPS). Les
                        e-mails de confirmation partent de notre adresse{' '}
                        {event.contactEmail}. Votre inscription est conservée
                        jusqu’à 12 mois après l’événement, puis supprimée.
                    </Section>

                    <Section title="Vos droits">
                        Conformément à la loi ivoirienne n° 2013-450 relative à
                        la protection des données à caractère personnel, vous
                        pouvez accéder à vos données, les faire corriger ou
                        demander leur effacement : écrivez-nous {contact}, en
                        précisant le numéro utilisé pour votre inscription. Vous
                        pouvez aussi saisir l’ARTCI.
                    </Section>

                    <Section title="Cookies">
                        Le site utilise uniquement les cookies techniques
                        nécessaires à son fonctionnement et à la sécurité du
                        formulaire. Il ne dépose aucun cookie publicitaire ni
                        traceur.
                    </Section>
                </div>
            </div>
        </EventShell>
    );
}
