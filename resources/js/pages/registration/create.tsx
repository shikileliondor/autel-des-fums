import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import EventShell from '@/components/event/event-shell';
import { Spinner } from '@/components/ui/spinner';
import { privacy } from '@/routes';
import { store } from '@/routes/registration';

const inputClass =
    'h-12 w-full rounded-xl border border-event-border bg-event-surface px-4 text-base text-event-fg placeholder:text-event-muted/60 outline-none transition focus:border-event-accent focus:ring-2 focus:ring-event-accent/30 aria-invalid:border-red-500';

function Field({
    label,
    name,
    error,
    optional,
    ...props
}: InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    error?: string;
    optional?: boolean;
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

export default function RegistrationCreate() {
    const [isFoursquare, setIsFoursquare] = useState(false);

    return (
        <EventShell>
            <Head title="Inscription" />

            <div className="mx-auto max-w-xl">
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
                                error={errors.phone}
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
                            <Field
                                label="Ville / commune"
                                name="city"
                                autoComplete="address-level2"
                                placeholder="Cocody"
                                error={errors.city}
                            />
                            <div className="grid gap-3">
                                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-event-border bg-event-surface px-4 py-3.5 font-semibold text-event-muted transition has-checked:border-event-accent has-checked:bg-event-accent/15 has-checked:text-event-fg">
                                    <input
                                        type="checkbox"
                                        name="is_foursquare"
                                        value="1"
                                        checked={isFoursquare}
                                        onChange={(e) =>
                                            setIsFoursquare(e.target.checked)
                                        }
                                        className="size-5 shrink-0 accent-event-accent"
                                    />
                                    Je suis de l’Église Foursquare Niangon
                                    Révélation
                                </label>

                                {!isFoursquare && (
                                    <Field
                                        label="Église"
                                        name="church"
                                        placeholder="Nom de ton église"
                                        error={errors.church}
                                        optional
                                    />
                                )}
                            </div>

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
