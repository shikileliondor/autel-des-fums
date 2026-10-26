import { Head, Link, router, usePage } from '@inertiajs/react';
import { Download, Search } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    exportMethod as exportRegistrations,
    index,
} from '@/routes/registrations';
import type { RegistrationRow } from '@/types';

type Props = {
    registrations: {
        data: RegistrationRow[];
        links: { url: string | null; label: string; active: boolean }[];
        from: number | null;
        to: number | null;
        total: number;
    };
    filters: { search: string };
    stats: { total: number; today: number; men: number; women: number };
};

export default function RegistrationsIndex({
    registrations,
    filters,
    stats,
}: Props) {
    const { currentTeam } = usePage().props;
    const [search, setSearch] = useState(filters.search);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(index(currentTeam?.slug).url, search ? { search } : {}, {
            preserveState: true,
            replace: true,
        });
    };

    const statCards = [
        { label: 'Inscrits', value: stats.total },
        { label: 'Aujourd’hui', value: stats.today },
        { label: 'Hommes', value: stats.men },
        { label: 'Femmes', value: stats.women },
    ];

    return (
        <>
            <Head title="Inscrits" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {statCards.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border"
                        >
                            <p className="text-sm text-muted-foreground">
                                {stat.label}
                            </p>
                            <p className="mt-1 text-3xl font-semibold tabular-nums">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <form
                        onSubmit={submit}
                        className="relative w-full sm:max-w-sm"
                    >
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher (nom, téléphone, code…)"
                            className="pl-9"
                        />
                    </form>
                    <Button asChild variant="outline">
                        <a href={exportRegistrations(currentTeam?.slug).url}>
                            <Download />
                            Exporter (Excel / CSV)
                        </a>
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Code</th>
                                <th className="px-4 py-3 font-medium">Nom</th>
                                <th className="px-4 py-3 font-medium">Sexe</th>
                                <th className="px-4 py-3 font-medium">
                                    Téléphone
                                </th>
                                <th className="px-4 py-3 font-medium">Ville</th>
                                <th className="px-4 py-3 font-medium">
                                    Église
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Inscrit le
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrations.data.map((r) => (
                                <tr key={r.id} className="border-t">
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {r.reference}
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{r.name}</p>
                                        {r.email && (
                                            <p className="text-xs text-muted-foreground">
                                                {r.email}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="secondary">
                                            {r.gender === 'homme' ? 'H' : 'F'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {r.phone}
                                    </td>
                                    <td className="px-4 py-3">{r.city}</td>
                                    <td className="px-4 py-3">
                                        {r.church ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                        {r.createdAt}
                                    </td>
                                </tr>
                            ))}
                            {registrations.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-12 text-center text-muted-foreground"
                                    >
                                        Aucun inscrit pour le moment.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {registrations.total > 0 && (
                    <div className="flex flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
                        <p>
                            {registrations.from}–{registrations.to} sur{' '}
                            {registrations.total}
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {registrations.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? '#'}
                                    preserveState
                                    disabled={!link.url}
                                    className={cn(
                                        'rounded-md px-3 py-1.5',
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted',
                                        !link.url &&
                                            'pointer-events-none opacity-40',
                                    )}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

RegistrationsIndex.layout = (props: {
    currentTeam?: { slug: string } | null;
}) => ({
    breadcrumbs: [
        {
            title: 'Inscrits',
            href: index(props.currentTeam?.slug),
        },
    ],
});
