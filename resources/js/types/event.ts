export type EventInfo = {
    name: string;
    tagline: string;
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
    city: string;
    church: string | null;
    createdAt: string | null;
};
