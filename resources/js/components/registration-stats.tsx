import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { RegistrationStats as Stats } from '@/types';

type Props = {
    stats: Stats;
    /** Lien vers la liste filtrée sur une catégorie ; sans lien, les cartes ne sont pas cliquables. */
    groupHref?: (key: string) => string;
    activeGroup?: string;
};

const groupColors: Record<string, string> = {
    revelation: 'bg-orange-500',
    foursquare: 'bg-amber-400',
    invite: 'bg-stone-400',
};

function percent(count: number, total: number): number {
    return total > 0 ? Math.round((count / total) * 100) : 0;
}

export default function RegistrationStats({
    stats,
    groupHref,
    activeGroup,
}: Props) {
    const cards = [
        { label: 'Inscrits', value: stats.total },
        { label: 'Aujourd’hui', value: stats.today },
        { label: 'Hommes', value: stats.men },
        { label: 'Femmes', value: stats.women },
    ];

    return (
        <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                    >
                        <p className="text-sm text-muted-foreground">
                            {card.label}
                        </p>
                        <p className="mt-1 text-3xl font-semibold tabular-nums">
                            {card.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                <p className="text-sm font-medium">Par église</p>

                {/* Répartition sur une seule barre. */}
                <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted">
                    {stats.groups.map((group) => (
                        <div
                            key={group.key}
                            className={groupColors[group.key]}
                            style={{
                                width: `${percent(group.count, stats.total)}%`,
                            }}
                        />
                    ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {stats.groups.map((group) => {
                        const content = (
                            <>
                                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span
                                        className={cn(
                                            'size-2.5 rounded-full',
                                            groupColors[group.key],
                                        )}
                                    />
                                    {group.label}
                                </span>
                                <span className="mt-1 flex items-baseline gap-2">
                                    <span className="text-2xl font-semibold tabular-nums">
                                        {group.count}
                                    </span>
                                    <span className="text-sm text-muted-foreground tabular-nums">
                                        {percent(group.count, stats.total)} %
                                    </span>
                                </span>
                            </>
                        );
                        const className = cn(
                            'block rounded-lg border p-3',
                            activeGroup === group.key
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent bg-muted/40',
                        );

                        return groupHref ? (
                            <Link
                                key={group.key}
                                href={groupHref(
                                    activeGroup === group.key ? '' : group.key,
                                )}
                                preserveScroll
                                className={cn(className, 'hover:bg-muted')}
                            >
                                {content}
                            </Link>
                        ) : (
                            <div key={group.key} className={className}>
                                {content}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                <p className="text-sm font-medium">Par fonction</p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.roles.map((role) => (
                        <div
                            key={role.label}
                            className="rounded-lg bg-muted/40 p-3"
                        >
                            <p className="truncate text-sm text-muted-foreground">
                                {role.label}
                            </p>
                            <p className="mt-1 text-2xl font-semibold tabular-nums">
                                {role.count}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
