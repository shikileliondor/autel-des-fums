import { Link, usePage } from '@inertiajs/react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { EventLogo } from '@/components/event/event-shell';
import { useCartCount } from '@/lib/boutique';
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
    const cartCount = useCartCount();
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

                <div className="flex items-center gap-2">
                    <Link
                        href={`${boutique().url}#panier`}
                        aria-label={`Panier (${cartCount} article${cartCount > 1 ? 's' : ''})`}
                        className="relative flex size-12 items-center justify-center rounded-xl text-event-fg transition hover:text-event-accent-ink"
                    >
                        <ShoppingBag className="size-6" />
                        {cartCount > 0 && (
                            <span className="absolute top-1.5 right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-event-accent px-1 text-[11px] font-bold text-white tabular-nums">
                                {cartCount}
                            </span>
                        )}
                    </Link>

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
                </div>
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
