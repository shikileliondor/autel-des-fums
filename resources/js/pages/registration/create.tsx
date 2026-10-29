import { Form, Head, Link, usePage } from '@inertiajs/react';
import { BellRing, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import Confetti from '@/components/event/confetti';
import { CountdownDisplay } from '@/components/event/countdown';
import EventShell from '@/components/event/event-shell';
import { useRegistrationOpening } from '@/hooks/use-registration-opening';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { privacy } from '@/routes';
import { create, store } from '@/routes/registration';

// Doit rester identique à Registration::ROLES côté serveur.
const ROLES = [
    'Chantre',
    'Commando',
    'Service d’ordre',
    'Intercession',
    'Communication',
    'Comité d’organisation',
    'Pasteur',
];

const inputClass =
    'h-12 w-full rounded-xl border border-event-border bg-event-surface px-4 text-[16px] text-event-fg placeholder:text-event-muted/60 outline-none transition focus:border-event-accent focus:ring-2 focus:ring-event-accent/30 aria-invalid:border-red-500';

function Field({
    label,
    name,
    error,
    optional,
    mandatory,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    error?: string;
    optional?: boolean;
    /** Affiche « (obligatoire) » à côté du libellé. */
    mandatory?: boolean;
}) {
    return (
        <div className="grid gap-2">
            <label
                htmlFor={name}
                className="text-sm font-semibold text-event-fg"
            >
                {label}
                {optional && (
                    <span className="ml-1 font-normal text-event-muted">
                        (facultatif)
                    </span>
                )}
                {mandatory && (
                    <span className="ml-1 font-normal text-event-accent-ink">
                        (obligatoire)
                    </span>
                )}
            </label>
            <input
                id={name}
                name={name}
                aria-invalid={!!error}
                required={!optional}
                className={inputClass}
                {...props}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}

export default function RegistrationCreate({
    canRegisterEarly,
}: {
    /** Admins : peuvent tester le formulaire avant l'ouverture. */
    canRegisterEarly: boolean;
}) {
    const [isMember, setIsMember] = useState(false);
    const [role, setRole] = useState('');
    const opening = useRegistrationOpening();
    // Fermé à l'arrivée sur la page : on fête l'ouverture quand elle arrive.
    const [openedLive] = useState(!opening.isOpen);

    if (!opening.isOpen && !canRegisterEarly) {
        return (
            <WaitingRoom remaining={opening.remaining} label={opening.label} />
        );
    }

    return (
        <EventShell>
            <Head title="Inscription" />
            {openedLive && opening.isOpen && <Confetti />}

            <div className="mx-auto max-w-xl">
                {openedLive && opening.isOpen && (
                    <div className="pop-in mb-8 flex items-center gap-3 rounded-2xl bg-event-accent p-4 text-left text-white shadow-lg shadow-event-accent/30">
                        <PartyPopper className="size-8 shrink-0" />
                        <div>
                            <p className="text-lg font-extrabold">
                                C’est ouvert ! 🔥
                            </p>
                            <p className="text-sm opacity-90">
                                Inscris-toi vite pour être parmi les 100
                                premiers.
                            </p>
                        </div>
                    </div>
                )}
                {!opening.isOpen && canRegisterEarly && (
                    <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-3 text-center text-sm text-amber-900">
                        Mode test admin : les inscriptions ouvrent{' '}
                        {opening.label} pour le public.
                    </p>
                )}
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight text-event-fg sm:text-5xl">
                        Inscription.
                    </h1>
                    <p className="mt-3 text-event-muted">
                        Remplis ce formulaire pour t’inscrire à l’Autel des
                        Parfums.
                    </p>
                </div>

                <Form
                    {...store.form()}
                    disableWhileProcessing
                    className="mt-10 grid gap-5 rounded-3xl border border-event-border bg-event-surface/40 p-4 sm:p-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field
                                    label="Nom"
                                    name="last_name"
                                    autoComplete="family-name"
                                    placeholder="Kouassi"
                                    error={errors.last_name}
                                    autoFocus
                                />
                                <Field
                                    label="Prénom(s)"
                                    name="first_name"
                                    autoComplete="given-name"
                                    placeholder="Ange Emmanuel"
                                    error={errors.first_name}
                                />
                            </div>

                            <fieldset className="grid gap-2">
                                <legend className="mb-2 text-sm font-semibold text-event-fg">
                                    Sexe
                                </legend>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        ['homme', 'Homme'],
                                        ['femme', 'Femme'],
                                    ].map(([value, label]) => (
                                        <label
                                            key={value}
                                            className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-event-border bg-event-surface font-semibold text-event-muted transition has-checked:border-event-accent has-checked:bg-event-accent/15 has-checked:text-event-fg"
                                        >
                                            <input
                                                type="radio"
                                                name="gender"
                                                value={value}
                                                required
                                                className="sr-only"
                                            />
                                            {label}
                                        </label>
                                    ))}
                                </div>
                                {errors.gender && (
                                    <p className="text-sm text-red-600">
                                        {errors.gender}
                                    </p>
                                )}
                            </fieldset>

                            <Field
                                label="Téléphone (WhatsApp)"
                                name="phone"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                defaultValue="+225 "
                                placeholder="+225 07 00 00 00 00"
                                // +225 (facultatif) puis exactement 10 chiffres, espaces/points/tirets permis.
                                pattern={String.raw`\s*(\+?225)?[\s.\-]*(\d[\s.\-]*){10}`}
                                maxLength={20}
                                title="10 chiffres après +225 (ex. +225 07 01 02 03 04)."
                                error={errors.phone}
                                mandatory
                            />
                            <Field
                                label="E-mail"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="nom@exemple.com"
                                error={errors.email}
                                optional
                            />
                            <div className="grid gap-3">
                                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-event-border bg-event-surface px-4 py-3.5 font-semibold text-event-muted transition has-checked:border-event-accent has-checked:bg-event-accent/15 has-checked:text-event-fg">
                                    <input
                                        type="checkbox"
                                        name="is_member"
                                        value="1"
                                        checked={isMember}
                                        onChange={(e) =>
                                            setIsMember(e.target.checked)
                                        }
                                        className="size-5 shrink-0 accent-event-accent"
                                    />
                                    Je suis membre de Foursquare Niangon
                                    Révélation
                                </label>

                                {!isMember && (
                                    <Field
                                        label="Précisez votre église"
                                        name="church"
                                        placeholder="Ex. Foursquare Ananeraie, Foursquare Toits Rouges…"
                                        error={errors.church}
                                        optional
                                    />
                                )}
                            </div>

                            <div className="grid gap-3">
                                <div className="grid gap-2">
                                    <label
                                        htmlFor="role_choice"
                                        className="text-sm font-semibold text-event-fg"
                                    >
                                        Fonction / rôle
                                        <span className="ml-1 font-normal text-event-muted">
                                            (facultatif)
                                        </span>
                                    </label>
                                    <select
                                        id="role_choice"
                                        name="role_choice"
                                        value={role}
                                        onChange={(e) =>
                                            setRole(e.target.value)
                                        }
                                        aria-invalid={!!errors.role_choice}
                                        className={cn(
                                            inputClass,
                                            !role && 'text-event-muted/60',
                                        )}
                                    >
                                        <option value="">
                                            Choisis ta fonction
                                        </option>
                                        {ROLES.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                        <option value="autre">Autre</option>
                                    </select>
                                    {errors.role_choice && (
                                        <p className="text-sm text-red-600">
                                            {errors.role_choice}
                                        </p>
                                    )}
                                </div>

                                {role === 'autre' && (
                                    <Field
                                        label="Précisez votre fonction"
                                        name="role_other"
                                        placeholder="Ex. accueil, technique, protocole…"
                                        error={errors.role_other}
                                    />
                                )}
                            </div>

                            {errors.form && (
                                <p className="rounded-xl bg-red-50 p-3 text-center text-sm font-semibold text-red-700">
                                    {errors.form}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={processing}
                                className="mt-2 inline-flex h-13 items-center justify-center gap-2 rounded-full bg-event-accent px-6 text-base font-bold whitespace-nowrap text-white shadow-lg shadow-event-accent/30 transition hover:brightness-110 disabled:opacity-60"
                            >
                                {processing && <Spinner />}
                                Valider mon inscription
                            </button>

                            <p className="text-center text-xs leading-relaxed text-event-muted">
                                Tes informations servent uniquement à
                                l’organisation de l’événement.{' '}
                                <Link
                                    href={privacy()}
                                    className="font-semibold text-event-fg underline underline-offset-2"
                                >
                                    En savoir plus
                                </Link>
                            </p>
                        </>
                    )}
                </Form>
            </div>
        </EventShell>
    );
}

/** Avant l'ouverture : compte à rebours, puis le formulaire s'affiche tout seul. */
function WaitingRoom({
    remaining,
    label,
}: {
    remaining: number;
    label: string | null;
}) {
    const { event } = usePage().props;
    const message = [
        `🔥 Les inscriptions pour ${event.name} ouvrent ${label} !`,
        'Sois prêt·e, les 100 premiers auront un badge spécial.',
        '',
        `👉 ${window.location.origin}${create.url()}`,
    ].join('\n');

    return (
        <EventShell className="flex items-center">
            <Head title="Ouverture des inscriptions" />

            <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-event-accent/10 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-event-accent-ink uppercase">
                    <BellRing className="size-4" />
                    Bientôt
                </span>
                <h1 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight text-event-fg sm:text-5xl">
                    Les inscriptions ouvrent{' '}
                    <span className="text-event-accent">{label}</span>.
                </h1>
                <p className="mt-4 text-event-muted">
                    Reste sur cette page : le formulaire s’ouvrira tout seul à
                    l’heure pile. Les 100 premiers inscrits auront un badge
                    spécial.
                </p>

                <div className="mt-8 w-full">
                    <CountdownDisplay ms={remaining} hideEmptyDays />
                </div>

                <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 text-sm font-bold text-white transition hover:brightness-105"
                >
                    Prévenir mes proches sur WhatsApp
                </a>
                <p className="mt-4 text-xs text-event-muted">
                    Astuce : prépare ton nom et ton numéro, l’inscription prend
                    une minute.
                </p>
            </div>
        </EventShell>
    );
}
