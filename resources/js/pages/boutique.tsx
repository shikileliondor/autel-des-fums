import { Head, usePage } from '@inertiajs/react';
import { Minus, Plus, ShoppingBag, Trash2, ZoomIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import EventShell from '@/components/event/event-shell';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { whatsappNumber } from '@/components/event/whatsapp-button';
import { formatPrice, loadCart, products, saveCart } from '@/lib/boutique';
import type { CartLine, Product } from '@/lib/boutique';
import { cn } from '@/lib/utils';

function linePrice(product: Product, custom: string | null): number {
    return custom && product.customPrice ? product.customPrice : product.price;
}

const label =
    'text-[10px] font-bold tracking-[0.15em] text-event-muted uppercase';

const field =
    'h-10 rounded-lg border border-event-border bg-white px-3 text-sm text-event-fg outline-none focus:border-event-accent';

function Stepper({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="inline-flex h-10 items-center rounded-lg border border-event-border bg-white">
            <button
                type="button"
                aria-label="Diminuer"
                onClick={() => onChange(Math.max(1, value - 1))}
                className="flex size-10 items-center justify-center text-event-fg hover:text-event-accent-ink"
            >
                <Minus className="size-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-semibold tabular-nums">
                {value}
            </span>
            <button
                type="button"
                aria-label="Augmenter"
                onClick={() => onChange(Math.min(20, value + 1))}
                className="flex size-10 items-center justify-center text-event-fg hover:text-event-accent-ink"
            >
                <Plus className="size-3.5" />
            </button>
        </div>
    );
}

/**
 * Photo du t-shirt (dos à gauche, devant à droite) avec l'aperçu du flocage
 * sur le devant, côté poitrine opposé au logo. Positions en % de la photo 3:2.
 */
function TeePreview({
    product,
    text,
    className,
}: {
    product: Product;
    text: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                '@container relative aspect-3/2 w-full overflow-hidden',
                className,
            )}
        >
            <img
                src={product.image}
                alt={product.name}
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
            />
            {text.trim() && (
                <span
                    className="absolute top-[33.8%] left-[81.9%] w-[14%] -translate-x-1/2 -translate-y-1/2 truncate text-center text-[1.6cqw] leading-none font-extrabold tracking-wide text-white uppercase"
                    style={{ textShadow: '0 0 1px rgb(0 0 0 / 0.15)' }}
                >
                    {text.trim()}
                </span>
            )}
        </div>
    );
}

function ProductCard({
    product,
    onAdd,
}: {
    product: Product;
    onAdd: (
        size: string | null,
        custom: string | null,
        quantity: number,
    ) => void;
}) {
    const [size, setSize] = useState(product.sizes ? 'M' : null);
    const [quantity, setQuantity] = useState(1);
    const [personalised, setPersonalised] = useState(false);
    const [text, setText] = useState('');
    const [added, setAdded] = useState(false);

    const custom = personalised && text.trim() ? text.trim() : null;
    const missingText = personalised && !custom;

    return (
        <div className="flex flex-col">
            <Dialog>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        aria-label={`Agrandir ${product.name}`}
                        className="group relative cursor-zoom-in overflow-hidden rounded-2xl bg-event-surface"
                    >
                        <TeePreview
                            product={product}
                            text={personalised ? text : ''}
                        />
                        <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-event-fg shadow-sm transition group-hover:bg-white">
                            <ZoomIn className="size-3.5" />
                            Voir
                        </span>
                    </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl! border-0 bg-white p-3 sm:p-4">
                    <DialogTitle className="sr-only">
                        {product.name}
                    </DialogTitle>
                    <TeePreview
                        product={product}
                        text={personalised ? text : ''}
                        className="rounded-xl"
                    />
                    <p className="px-1 text-sm text-event-muted">
                        <span className="font-semibold text-event-fg">
                            {product.name}
                        </span>{' '}
                        · Dos à gauche, devant à droite.
                        {personalised &&
                            text.trim() &&
                            ' Le texte floqué apparaît sur le devant, en face du logo.'}
                    </p>
                </DialogContent>
            </Dialog>
            <h3 className="mt-4 font-bold text-event-fg">{product.name}</h3>
            <p className="mt-1 text-sm leading-relaxed text-event-muted">
                {product.description}
            </p>
            <p className="mt-3 font-bold text-event-accent-ink">
                {formatPrice(linePrice(product, personalised ? 'x' : null))}
            </p>

            <div className="mt-4 flex items-end gap-3">
                {product.sizes && (
                    <label className="grid gap-1.5">
                        <span className={label}>Taille</span>
                        <select
                            value={size ?? ''}
                            onChange={(e) => setSize(e.target.value)}
                            className={`${field} font-semibold`}
                        >
                            {product.sizes.map((s) => (
                                <option key={s}>{s}</option>
                            ))}
                        </select>
                    </label>
                )}
                <div className="grid gap-1.5">
                    <span className={label}>Quantité</span>
                    <Stepper value={quantity} onChange={setQuantity} />
                </div>
            </div>

            {product.customPrice && (
                <div className="mt-4 grid gap-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-event-fg">
                        <input
                            type="checkbox"
                            checked={personalised}
                            onChange={(e) => setPersonalised(e.target.checked)}
                            className="size-4 accent-event-accent"
                        />
                        Personnaliser ({formatPrice(product.customPrice)})
                    </label>
                    {personalised && (
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            maxLength={30}
                            placeholder="Texte à floquer (ex. ton prénom)"
                            className={field}
                        />
                    )}
                </div>
            )}

            <button
                type="button"
                disabled={missingText}
                onClick={() => {
                    onAdd(size, custom, quantity);
                    setQuantity(1);
                    setAdded(true);
                    setTimeout(() => setAdded(false), 1500);
                }}
                className="mt-4 h-12 rounded-xl border border-event-border text-xs font-bold tracking-[0.15em] text-event-fg uppercase transition hover:border-event-accent hover:text-event-accent-ink disabled:opacity-40"
            >
                {added ? 'Ajouté ✓' : 'Ajouter au panier'}
            </button>
        </div>
    );
}

export default function Boutique() {
    const { event } = usePage().props;
    const [cart, setCart] = useState<CartLine[]>([]);
    const [customer, setCustomer] = useState('');

    useEffect(() => setCart(loadCart()), []);

    const update = (next: CartLine[]) => {
        setCart(next);
        saveCart(next);
    };

    const add = (
        product: Product,
        size: string | null,
        custom: string | null,
        quantity: number,
    ) => {
        const key = `${product.id}:${size ?? ''}:${custom ?? ''}`;
        const existing = cart.find((line) => line.key === key);

        update(
            existing
                ? cart.map((line) =>
                      line.key === key
                          ? { ...line, quantity: line.quantity + quantity }
                          : line,
                  )
                : [
                      ...cart,
                      { key, productId: product.id, size, custom, quantity },
                  ],
        );
    };

    const lines = cart
        .map((line) => ({
            ...line,
            product: products.find((p) => p.id === line.productId),
        }))
        .filter(
            (line): line is typeof line & { product: Product } =>
                line.product !== undefined,
        )
        .map((line) => ({
            ...line,
            unit: linePrice(line.product, line.custom),
        }));

    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const total = lines.reduce(
        (sum, line) => sum + line.unit * line.quantity,
        0,
    );

    const message = [
        `Bonjour, je souhaite commander à la boutique de ${event.name}.`,
        `Nom : ${customer.trim()}`,
        '',
        ...lines.map(
            (line) =>
                `- ${line.quantity} × ${line.product.name}` +
                (line.size ? `, taille ${line.size}` : '') +
                (line.custom ? `, personnalisé « ${line.custom} »` : '') +
                ` : ${formatPrice(line.unit * line.quantity)}`,
        ),
        '',
        `Total : ${formatPrice(total)}`,
    ].join('\n');

    const canOrder = lines.length > 0 && customer.trim() !== '';

    return (
        <EventShell>
            <Head title="Boutique" />

            <div className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-event-fg sm:text-6xl">
                    Boutique
                </h1>
                <div className="mx-auto mt-5 h-0.5 w-12 bg-event-accent" />
                <p className="mx-auto mt-5 max-w-lg leading-relaxed text-event-muted">
                    Les articles officiels de {event.name}. Commande par
                    WhatsApp, sans paiement en ligne.
                </p>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_18rem]">
                <section>
                    <div className="flex items-baseline justify-between">
                        <h2 className="text-xl font-extrabold text-event-fg sm:text-2xl">
                            T-shirts officiels
                        </h2>
                        <p className="text-sm text-event-muted">
                            {products.length} articles
                        </p>
                    </div>
                    <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAdd={(size, custom, quantity) =>
                                    add(product, size, custom, quantity)
                                }
                            />
                        ))}
                    </div>
                </section>

                <aside
                    id="panier"
                    className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
                >
                    <div className="rounded-2xl border border-event-border bg-event-surface p-5">
                        <div className="flex items-center justify-between">
                            <h2 className="flex items-center gap-2 font-bold text-event-fg">
                                <ShoppingBag className="size-4" />
                                Mon panier
                            </h2>
                            <span className="flex size-6 items-center justify-center rounded-full bg-event-accent text-xs font-bold text-white">
                                {count}
                            </span>
                        </div>

                        {lines.length === 0 ? (
                            <p className="mt-4 text-sm leading-relaxed text-event-muted">
                                Ton panier est vide. Ajoute des articles, le
                                récapitulatif s’affiche ici.
                            </p>
                        ) : (
                            <>
                                <ul className="mt-4 divide-y divide-event-border">
                                    {lines.map((line) => (
                                        <li
                                            key={line.key}
                                            className="flex items-start justify-between gap-3 py-3 text-sm"
                                        >
                                            <div>
                                                <p className="font-semibold text-event-fg">
                                                    {line.product.name}
                                                </p>
                                                <p className="text-event-muted">
                                                    {line.size &&
                                                        `Taille ${line.size} · `}
                                                    Qté {line.quantity}
                                                </p>
                                                {line.custom && (
                                                    <p className="text-event-muted">
                                                        Floqué « {line.custom} »
                                                    </p>
                                                )}
                                                <p className="font-semibold text-event-fg">
                                                    {formatPrice(
                                                        line.unit *
                                                            line.quantity,
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                aria-label="Retirer"
                                                onClick={() =>
                                                    update(
                                                        cart.filter(
                                                            (l) =>
                                                                l.key !==
                                                                line.key,
                                                        ),
                                                    )
                                                }
                                                className="text-event-muted hover:text-red-600"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-2 flex justify-between border-t border-event-border pt-3 font-bold text-event-fg">
                                    <span>Total</span>
                                    <span>{formatPrice(total)}</span>
                                </p>

                                <label className="mt-4 grid gap-1.5">
                                    <span className={label}>Ton nom</span>
                                    <input
                                        value={customer}
                                        onChange={(e) =>
                                            setCustomer(e.target.value)
                                        }
                                        autoComplete="name"
                                        placeholder="Nom et prénom"
                                        className={field}
                                    />
                                </label>

                                {event.contactPhone ? (
                                    <a
                                        href={
                                            canOrder
                                                ? `https://wa.me/${whatsappNumber(event.contactPhone)}?text=${encodeURIComponent(message)}`
                                                : undefined
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-disabled={!canOrder}
                                        className={`mt-3 flex h-12 items-center justify-center rounded-xl bg-[#25d366] text-sm font-bold text-white transition hover:brightness-105 ${canOrder ? '' : 'pointer-events-none opacity-40'}`}
                                    >
                                        Commander sur WhatsApp
                                    </a>
                                ) : (
                                    <p className="mt-3 text-sm text-event-muted">
                                        Les commandes ouvrent très bientôt.
                                    </p>
                                )}
                            </>
                        )}

                        <p className="mt-4 border-t border-event-border pt-4 text-xs leading-relaxed text-event-muted">
                            Aucun paiement en ligne : le règlement et la
                            livraison se font avec l’équipe après ta commande.
                            {event.contactPhone && (
                                <>
                                    {' '}
                                    Commande aussi possible au{' '}
                                    <a
                                        href={`tel:+${whatsappNumber(event.contactPhone)}`}
                                        className="font-semibold text-event-fg underline"
                                    >
                                        {event.contactPhone}
                                    </a>
                                    .
                                </>
                            )}
                        </p>
                    </div>
                </aside>
            </div>

            {/* Espace réservé pour que la barre fixe ne masque pas le bas de page. */}
            {count > 0 && <div className="h-16 lg:hidden" />}
            {count > 0 && (
                <a
                    href="#panier"
                    className={cn(
                        'fixed bottom-4 left-4 z-40 flex h-14 items-center justify-between gap-3 rounded-2xl bg-event-fg px-5 text-white shadow-xl lg:hidden',
                        event.contactPhone ? 'right-24 sm:right-28' : 'right-4',
                    )}
                >
                    <span className="flex items-center gap-2 text-sm font-bold">
                        <ShoppingBag className="size-4" />
                        Panier ({count})
                    </span>
                    <span className="text-sm font-bold text-event-accent">
                        {formatPrice(total)}
                    </span>
                </a>
            )}
        </EventShell>
    );
}
