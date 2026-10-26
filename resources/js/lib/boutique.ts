import { useEffect, useState } from 'react';

export type Product = {
    id: string;
    name: string;
    description: string;
    image: string;
    /** Prix en F CFA. */
    price: number;
    /** Prix avec un texte floqué au choix ; absent si l'article n'est pas personnalisable. */
    customPrice?: number;
    sizes?: string[];
};

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const COLORS: [string, string][] = [
    ['rouge', 'Rouge'],
    ['bleu', 'Bleu'],
    ['jaune', 'Jaune'],
    ['violet', 'Violet'],
    ['marron', 'Marron'],
    ['rose', 'Rose'],
];

export const products: Product[] = COLORS.map(([slug, label]) => ({
    id: `tshirt-${slug}`,
    name: `T-shirt JÉSUS · ${label}`,
    description:
        'Logo de L’Autel des Parfums devant, « JÉSUS » et Lévitique 6:6 au dos.',
    image: `/image/boutique/tshirt-${slug}.jpg`,
    price: 7500,
    customPrice: 8000,
    sizes: SIZES,
}));

export function formatPrice(price: number): string {
    return `${new Intl.NumberFormat('fr-FR').format(price)} F CFA`;
}

export type CartLine = {
    key: string;
    productId: string;
    size: string | null;
    /** Texte à floquer, null pour la version standard. */
    custom: string | null;
    quantity: number;
};

const STORAGE_KEY = 'adp-panier-v2';

// Émis à chaque modification pour mettre à jour l'icône du panier dans la barre de navigation.
const CHANGE_EVENT = 'adp-panier-change';

export function loadCart(): CartLine[] {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
        return [];
    }
}

export function saveCart(cart: CartLine[]): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
        // Panier non conservé (navigation privée) : sans conséquence.
    }

    window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Nombre d'articles du panier, tenu à jour (y compris depuis un autre onglet). */
export function useCartCount(): number {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const refresh = () =>
            setCount(loadCart().reduce((sum, line) => sum + line.quantity, 0));

        refresh();
        window.addEventListener(CHANGE_EVENT, refresh);
        window.addEventListener('storage', refresh);

        return () => {
            window.removeEventListener(CHANGE_EVENT, refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    return count;
}
