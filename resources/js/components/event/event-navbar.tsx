import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { EventLogo } from '@/components/event/event-shell';
import { cn } from '@/lib/utils';
import { boutique, home } from '@/routes';
import { create } from '@/routes/registration';

const links = [
    { label: 'Accueil', href: home().url },
    { label: 'Boutique', href: boutique().url },
    { label: 'Inscription', href: create().url },
];

export default function EventNavbar() {
    const { url } = usePage();
    const [open, setOpen] = useState(false);
    const path = url.split('?')[0];

    const isActive = (href: string) =>
        href === '/' ? path === '/' : path.startsWith(href);

    return (
        <header className="sticky top-0 z-40 -mx-4 border-b border-event-border bg-white/90 px-4 backdrop-blur-md sm:-mx-10 sm:px-10">
            <nav className="flex h-20 items-center justify-between gap-4">
                <EventLogo />

                <ul className="hidden items-center gap-8 md:flex">
                    {links.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className={cn(
                                    'text-[15px] font-medium transition',
                                    isActive(link.href)
                                        ? 'text-event-accent-ink'
                                        : 'text-event-fg hover:text-event-accent-ink',
                                )}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <button
                    type="button"
                    aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                    className="flex size-12 items-center justify-center rounded-xl bg-event-fg text-white md:hidden"
                >
                    {open ? (
                        <X className="size-6" />
                    ) : (
                        <Menu className="size-6" />
                    )}
                </button>
            </nav>

            {open && (
                <ul className="grid gap-1 border-t border-event-border py-4 md:hidden">
                    {links.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    'block rounded-lg px-3 py-3 text-base font-semibold',
                                    isActive(link.href)
                                        ? 'bg-event-surface text-event-accent-ink'
                                        : 'text-event-fg',
                                )}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </header>
    );
}
