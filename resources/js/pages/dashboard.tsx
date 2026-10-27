import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Users } from 'lucide-react';
import { useState } from 'react';
import PendingInvitationsModal from '@/components/pending-invitations-modal';
import RegistrationStats from '@/components/registration-stats';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { index as registrationsIndex } from '@/routes/registrations';
import type { DashboardInvitation, RegistrationStats as Stats } from '@/types';

type LatestRegistration = {
    id: number;
    reference: string;
    name: string;
    phone: string;
    church: string | null;
    churchGroup: string | null;
    role: string | null;
    createdAt: string | null;
};

type Props = {
    pendingInvitations?: DashboardInvitation[];
    stats: Stats | null;
    latestRegistrations: LatestRegistration[];
};

export default function Dashboard({
    pendingInvitations = [],
    stats,
    latestRegistrations,
}: Props) {
    const { currentTeam } = usePage().props;
    const [showInvitations, setShowInvitations] = useState(
        pendingInvitations.length > 0,
    );

    return (
        <>
            <Head title="Dashboard" />
            <PendingInvitationsModal
                invitations={pendingInvitations}
                open={pendingInvitations.length > 0 && showInvitations}
                onOpenChange={setShowInvitations}
            />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {stats ? (
                    <>
                        <RegistrationStats
                            stats={stats}
                            groupHref={(group) =>
                                registrationsIndex(currentTeam?.slug, {
                                    query: group ? { group } : {},
                                }).url
                            }
                        />

                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <div className="flex items-center justify-between gap-3 border-b p-4">
                                <h2 className="font-semibold">
                                    Dernières inscriptions
                                </h2>
                                <Button asChild size="sm" variant="outline">
                                    <Link
                                        href={registrationsIndex(
                                            currentTeam?.slug,
                                        )}
                                    >
                                        Voir tous les inscrits
                                        <ArrowRight />
                                    </Link>
                                </Button>
                            </div>

                            {latestRegistrations.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 text-left text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">
                                                    Code
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Nom
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Téléphone
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Catégorie
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Église
                                                </th>
                                                <th className="px-4 py-3 font-medium">
                                                    Inscrit le
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {latestRegistrations.map((r) => (
                                                <tr
                                                    key={r.id}
                                                    className="border-t"
                                                >
                                                    <td className="px-4 py-3 font-mono text-xs">
                                                        {r.reference}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">
                                                        {r.name}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {r.phone}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        {r.churchGroup ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {r.church ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                                        {r.createdAt}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="p-8 text-center text-sm text-muted-foreground">
                                    Aucune inscription pour le moment.
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-sidebar-border/70 p-8 text-center dark:border-sidebar-border">
                        <Users className="size-8 text-muted-foreground" />
                        <p className="max-w-sm text-sm text-muted-foreground">
                            Tu n’as pas accès à la liste des inscrits. Demande à
                            un organisateur d’ajouter ton e-mail.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

Dashboard.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: props.currentTeam ? dashboard(props.currentTeam.slug) : '/',
        },
    ],
});
