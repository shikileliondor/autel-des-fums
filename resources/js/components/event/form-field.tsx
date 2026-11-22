import type { InputHTMLAttributes } from 'react';

export const inputClass =
    'h-12 w-full rounded-xl border border-event-border bg-event-surface px-4 text-[16px] text-event-fg placeholder:text-event-muted/60 outline-none transition focus:border-event-accent focus:ring-2 focus:ring-event-accent/30 aria-invalid:border-red-500';

/** Champ des formulaires publics : libellé, saisie et message d'erreur. */
export function Field({
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
