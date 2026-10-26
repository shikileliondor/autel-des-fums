import { useEffect, useState } from 'react';

function remaining(target: number) {
    const diff = Math.max(0, target - Date.now());

    return {
        jours: Math.floor(diff / 86_400_000),
        heures: Math.floor(diff / 3_600_000) % 24,
        min: Math.floor(diff / 60_000) % 60,
        sec: Math.floor(diff / 1000) % 60,
    };
}

export default function Countdown({ startsAt }: { startsAt: string }) {
    const target = new Date(startsAt).getTime();
    const [time, setTime] = useState(() => remaining(target));

    useEffect(() => {
        const id = setInterval(() => setTime(remaining(target)), 1000);

        return () => clearInterval(id);
    }, [target]);

    return (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {Object.entries(time).map(([label, value]) => (
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
