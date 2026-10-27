export type EventInfo = {
    name: string;
    tagline: string;
    theme: string;
    themeReference: string | null;
    startsAt: string | null;
    hasTime: boolean;
    city: string;
    venue: string | null;
    hostChurch: string;
    contactEmail: string;
    contactPhone: string | null;
};

export type RegistrationRow = {
    id: number;
    reference: string;
    name: string;
    gender: 'homme' | 'femme';
    phone: string;
    email: string | null;
    role: string | null;
    church: string | null;
    /** Libellé de la catégorie : Foursquare Révélation, Autre Foursquare ou Autres églises. */
    churchGroup: string | null;
    createdAt: string | null;
};

export type ChurchGroupStat = {
    key: 'revelation' | 'foursquare' | 'invite';
    label: string;
    count: number;
};

export type RegistrationStats = {
    total: number;
    today: number;
    men: number;
    women: number;
    groups: ChurchGroupStat[];
    /** Chantre, Commando… puis « Autre » (fonctions précisées à la main). */
    roles: { label: string; count: number }[];
};
