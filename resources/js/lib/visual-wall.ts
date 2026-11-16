/**
 * Mur des participants : les visuels « J'y serai ! » que leurs auteurs ont choisi d'afficher.
 *
 * Seul le visuel terminé est envoyé (grand format et vignette), jamais la photo d'origine.
 * Le code de retrait renvoyé par le serveur reste sur l'appareil de l'auteur : c'est lui
 * qui permet de retirer son visuel, ou de le remplacer en publiant une nouvelle version.
 */
import { http } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { destroy, index, store } from '@/routes/visuals';

export type WallItem = {
    id: number;
    name: string | null;
    thumb: string;
    image: string;
};

export type WallPage = {
    items: WallItem[];
    next: number | null;
    total: number;
};

type MyVisual = { id: number; token: string };

const STORAGE_KEY = 'adp-mon-visuel';
// Tailles attendues par le serveur (StoreVisualRequest).
const IMAGE_SIZE = [720, 1280] as const;
const THUMB_SIZE = [360, 640] as const;

export function useVisualWall(initial: WallPage) {
    const [items, setItems] = useState(initial.items);
    const [next, setNext] = useState(initial.next);
    const [total, setTotal] = useState(initial.total);
    const [loadingMore, setLoadingMore] = useState(false);
    const [mine, setMineState] = useState<MyVisual | null>(null);
    // Toujours à jour dans les fonctions asynchrones.
    const mineRef = useRef<MyVisual | null>(null);

    const setMine = (visual: MyVisual | null) => {
        mineRef.current = visual;
        setMineState(visual);
        writeMyVisual(visual);
    };

    // Lu après le premier affichage : le rendu serveur n'a pas accès au stockage du navigateur.
    useEffect(() => {
        const stored = readMyVisual();
        mineRef.current = stored;
        setMineState(stored);
    }, []);

    const loadMore = async () => {
        if (!next || loadingMore) {
            return;
        }

        setLoadingMore(true);

        try {
            const response = await http.getClient().request({
                method: 'get',
                url: index.url({ query: { avant: next } }),
                headers: { Accept: 'application/json' },
            });
            const page = JSON.parse(response.data) as WallPage;

            setItems((current) => [
                ...current,
                ...page.items.filter(
                    (item) => !current.some(({ id }) => id === item.id),
                ),
            ]);
            setNext(page.next);
            setTotal(page.total);
        } finally {
            setLoadingMore(false);
        }
    };

    /** Envoie le visuel affiché sur le canvas ; remplace le précédent publié depuis cet appareil. */
    const publish = async (canvas: HTMLCanvasElement, name: string) => {
        // Copiés tout de suite : la personne peut continuer à bouger sa photo pendant l'envoi.
        const image = resized(canvas, IMAGE_SIZE);
        const thumb = resized(canvas, THUMB_SIZE);

        const data = new FormData();
        data.append('image', await toJpeg(image, 0.86), 'visuel.jpg');
        data.append('thumb', await toJpeg(thumb, 0.8), 'visuel-petit.jpg');

        if (name.trim()) {
            data.append('first_name', name.trim());
        }

        const previous = mineRef.current;

        if (previous) {
            data.append('replaces', String(previous.id));
            data.append('replaces_token', previous.token);
        }

        const response = await http.getClient().request({
            method: 'post',
            url: store.url(),
            data,
            headers: { Accept: 'application/json' },
        });
        const body = JSON.parse(response.data) as {
            visual: WallItem;
            token: string;
            replaced: number | null;
        };

        setMine({ id: body.visual.id, token: body.token });
        setItems((current) => [
            body.visual,
            ...current.filter(({ id }) => id !== body.replaced),
        ]);
        setTotal((count) => count + (body.replaced ? 0 : 1));

        return body.visual;
    };

    /** Retire un visuel : le sien (avec son code de retrait) ou n'importe lequel pour un admin. */
    const remove = async (item: WallItem) => {
        const own = mineRef.current?.id === item.id;

        try {
            await http.getClient().request({
                method: 'delete',
                url: destroy.url({ visual: item.id }),
                data: own ? { token: mineRef.current?.token } : {},
                headers: { Accept: 'application/json' },
            });
        } catch (error) {
            // Déjà retiré (par un admin, ou depuis un autre onglet) : on le retire aussi de l'affichage.
            const status = (error as { response?: { status?: number } })
                .response?.status;

            if (status !== 404) {
                throw error;
            }
        }

        if (own) {
            setMine(null);
        }

        setItems((current) => current.filter(({ id }) => id !== item.id));
        setTotal((count) => Math.max(0, count - 1));
    };

    return { items, next, total, loadingMore, mine, loadMore, publish, remove };
}

function readMyVisual(): MyVisual | null {
    try {
        const value: unknown = JSON.parse(
            localStorage.getItem(STORAGE_KEY) ?? 'null',
        );

        if (
            value &&
            typeof value === 'object' &&
            'id' in value &&
            'token' in value &&
            typeof value.id === 'number' &&
            typeof value.token === 'string'
        ) {
            return { id: value.id, token: value.token };
        }
    } catch {
        // Stockage indisponible (navigation privée) : le visuel ne pourra pas être retiré d'ici.
    }

    return null;
}

function writeMyVisual(visual: MyVisual | null) {
    try {
        if (visual) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(visual));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // Stockage indisponible : sans conséquence pour la publication.
    }
}

function resized(
    source: HTMLCanvasElement,
    [width, height]: readonly [number, number],
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas 2D indisponible.');
    }

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);

    return canvas;
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) =>
        canvas.toBlob(
            (blob) =>
                blob
                    ? resolve(blob)
                    : reject(new Error('Export du visuel impossible.')),
            'image/jpeg',
            quality,
        ),
    );
}
