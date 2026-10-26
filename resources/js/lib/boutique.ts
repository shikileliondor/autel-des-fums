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
