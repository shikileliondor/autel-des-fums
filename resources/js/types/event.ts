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
    /** Numéro unique, WhatsApp et appels (ancien format à 8 chiffres). */
    contactPhone: string | null;
    /** Personnes à contacter en cas de besoin (config/event.php). */
    contacts: { name: string; phone: string; whatsapp: string }[];
    /** Ouverture des inscriptions, null si elles sont ouvertes dès maintenant. */
    registrationsOpenAt: string | null;
    /** Heure du serveur (ms) au chargement de la page. */
    serverTime: number;
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
    /** Heure du scan à l'entrée, null tant que la personne n'est pas arrivée. */
    checkedInAt: string | null;
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
