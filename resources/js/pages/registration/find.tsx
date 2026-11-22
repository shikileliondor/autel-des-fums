import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, Search } from 'lucide-react';
import EventShell from '@/components/event/event-shell';
import { Field } from '@/components/event/form-field';
import { Spinner } from '@/components/ui/spinner';
import { create, lookup } from '@/routes/registration';

/** Retrouver son inscription (et son PDF) avec le numéro utilisé pour s'inscrire. */
export default function RegistrationFind() {
    return (
        <EventShell className="flex items-center">
            <Head title="Retrouver mon inscription" />

            <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
                <div className="pop-in mb-6 flex size-16 items-center justify-center rounded-full bg-event-accent shadow-lg shadow-event-accent/30">
                    <Search className="size-8 text-white" strokeWidth={2.5} />
                </div>

                <h1 className="text-3xl leading-tight font-extrabold tracking-tight text-event-fg sm:text-5xl">
                    Retrouve ton{' '}
                    <span className="font-charm font-bold text-event-accent">
                        inscription
                    </span>
                </h1>
                <p className="mt-4 text-base leading-relaxed text-event-muted">
                    Entre le numéro de téléphone utilisé pour t’inscrire. Tu
                    retrouveras ta confirmation et ton PDF avec ton QR code
                    d’entrée.
                </p>

                <Form
                    {...lookup.form()}
                    disableWhileProcessing
                    className="mt-8 grid w-full gap-5 rounded-3xl border border-event-border bg-event-surface/40 p-4 text-left sm:p-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                label="Téléphone utilisé à l’inscription"
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
                                autoFocus
                            />

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-event-accent px-6 text-base font-bold whitespace-nowrap text-white shadow-lg shadow-event-accent/30 transition hover:brightness-110 disabled:opacity-60"
                            >
                                {processing && <Spinner />}
                                Retrouver mon inscription
                            </button>
                        </>
                    )}
                </Form>

                <Link
                    href={create()}
                    className="group mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-event-accent-ink hover:text-event-fg"
                >
                    Pas encore inscrit ? Je m’inscris
                    <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
            </div>
        </EventShell>
    );
}
