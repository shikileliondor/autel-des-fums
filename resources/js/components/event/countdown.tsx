import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function parts(diff: number) {
    return {
        jours: Math.floor(diff / 86_400_000),
        heures: Math.floor(diff / 3_600_000) % 24,
        min: Math.floor(diff / 60_000) % 60,
        sec: Math.floor(diff / 1000) % 60,
    };
}

export default function Countdown({ startsAt }: { startsAt: string }) {
    const target = new Date(startsAt).getTime();
    const [ms, setMs] = useState(() => Math.max(0, target - Date.now()));

    useEffect(() => {
        const id = setInterval(
            () => setMs(Math.max(0, target - Date.now())),
            1000,
        );

        return () => clearInterval(id);
    }, [target]);

    return <CountdownDisplay ms={ms} />;
}

/** Les cases jours / heures / min / sec ; sans les jours quand il en reste moins d'un. */
export function CountdownDisplay({
    ms,
    hideEmptyDays = false,
}: {
    ms: number;
    hideEmptyDays?: boolean;
}) {
    const entries = Object.entries(parts(ms)).filter(
        ([label, value]) =>
            !(hideEmptyDays && label === 'jours' && value === 0),
    );

    return (
        <div
            className={cn(
                'grid gap-2 sm:gap-3',
                entries.length === 4 ? 'grid-cols-4' : 'grid-cols-3',
            )}
        >
            {entries.map(([label, value]) => (
                <div
                    key={label}
                    className="rounded-2xl border border-event-border bg-event-surface/70 px-2 py-3 text-center sm:px-4 sm:py-4"
                >
                    <p className="text-2xl font-extrabold text-event-fg tabular-nums sm:text-4xl">
                        {String(value).padStart(2, '0')}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold tracking-[0.18em] text-event-muted uppercase sm:text-xs">
                        {label}
                    </p>
                </div>
            ))}
        </div>
    );
}
