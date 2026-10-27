import { cn } from '@/lib/utils';

export type MosaicPhoto = {
    src: string;
    alt: string;
    label: string;
};

/**
 * Grande photo à gauche (en haut sur mobile), les autres en grille de deux
 * colonnes, chacune avec son libellé et son numéro.
 */
export default function PhotoMosaic({ photos }: { photos: MosaicPhoto[] }) {
    const [first, ...rest] = photos;

    if (!first) {
        return null;
    }

    return (
        <div className="grid gap-2 sm:grid-cols-[1.8fr_2fr] sm:gap-3">
            <Tile
                photo={first}
                index={0}
                className="aspect-3/4 sm:aspect-auto sm:h-full"
            />
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {rest.map((photo, i) => (
                    <Tile
                        key={photo.src}
                        photo={photo}
                        index={i + 1}
                        className={cn(
                            'aspect-square',
                            rest.length % 2 === 1 &&
                                i === rest.length - 1 &&
                                'col-span-2 aspect-2/1',
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

function Tile({
    photo,
    index,
    className,
}: {
    photo: MosaicPhoto;
    index: number;
    className?: string;
}) {
    return (
        <figure
            className={cn(
                'group relative overflow-hidden bg-event-surface',
                className,
            )}
        >
            <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
            {index > 0 && (
                <span className="absolute top-3 right-3 text-sm font-bold text-white/60 tabular-nums sm:top-4 sm:right-4">
                    {String(index + 1).padStart(2, '0')}
                </span>
            )}
            <figcaption className="absolute bottom-3 left-3 text-[10px] font-bold tracking-[0.25em] text-white uppercase sm:bottom-5 sm:left-5 sm:text-xs">
                {photo.label}
            </figcaption>
        </figure>
    );
}
