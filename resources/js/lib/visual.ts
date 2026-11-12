/**
 * Visuel « J'y serai ! » : une affiche au format story (1080 × 1920) dessinée sur
 * un canvas, directement dans le navigateur. La photo ne quitte jamais l'appareil.
 *
 * Trois couches superposées : le décor (fond, logos, date), la photo découpée
 * en arche, puis l'habillage (bordure, prénom, « J'y serai ! »). La photo reste
 * nette : aucun texte ni dégradé ne la recouvre, à part le prénom posé sur le bord.
 * Le décor et l'habillage sont préparés une fois : seul le collage de la photo
 * est refait pendant qu'on la déplace.
 */
import { EVENT_TIMEZONE } from '@/components/event/event-shell';
import type { EventInfo } from '@/types/event';

export const VISUAL_WIDTH = 1080;
export const VISUAL_HEIGHT = 1920;

/** Fenêtre en arche où se place la photo. */
export const FRAME = { x: 100, y: 340, width: 880, height: 930 };

export const MAX_ZOOM = 3;

/** Décalage du centre de la photo par rapport au centre de l'arche, en pixels du visuel. */
export type Placement = { zoom: number; x: number; y: number };

export const CENTERED: Placement = { zoom: 1, x: 0, y: 0 };

export type VisualAssets = {
    logo: HTMLImageElement;
    church: HTMLCanvasElement;
};

type VisualInfo = {
    edition: string | null;
    weekday: string | null;
    day: string | null;
    year: string | null;
    church: [string, string];
    place: string;
    theme: string;
    link: string;
};

type Rect = { x: number; y: number; width: number; height: number };

const CENTER_X = VISUAL_WIDTH / 2;
const FRAME_BOTTOM = FRAME.y + FRAME.height;
// Sous l'arche, de haut en bas : « J'y serai ! », thème, date et lieu, lien.
const TITLE_Y = FRAME_BOTTOM + 222;
const THEME_Y = TITLE_Y + 88;
const DATE_Y = THEME_Y + 30;
const LINK_Y = DATE_Y + 192;
const SANS = '"Instrument Sans", system-ui, sans-serif';
const SCRIPT = 'Charm, cursive';
// Photo réduite à l'import : assez pour un zoom ×3 net, sans saturer la mémoire du téléphone.
const MAX_PHOTO_SIZE = 2048;

export async function loadVisualAssets(): Promise<VisualAssets> {
    const [logo, church] = await Promise.all([
        loadImage('/image/logo-autel-des-parfums.png'),
        loadImage('/image/logo-foursquare-niangon.png'),
        // Sans ces polices, le canvas retomberait sur celles du système.
        Promise.all(
            [
                `700 100px ${SCRIPT}`,
                `400 100px ${SCRIPT}`,
                `700 100px ${SANS}`,
                `600 100px ${SANS}`,
            ].map((font) => document.fonts.load(font)),
        ).catch(() => {}),
    ]);

    return { logo, church: whiten(church) };
}

/** Prépare la photo choisie : décodée et réduite une fois pour toutes. */
export async function preparePhoto(file: File): Promise<HTMLCanvasElement> {
    const url = URL.createObjectURL(file);

    try {
        const image = await loadImage(url);
        const ratio = Math.min(
            1,
            MAX_PHOTO_SIZE / Math.max(image.naturalWidth, image.naturalHeight),
        );
        const { canvas, ctx } = createCanvas(
            Math.round(image.naturalWidth * ratio),
            Math.round(image.naturalHeight * ratio),
        );
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        return canvas;
    } finally {
        URL.revokeObjectURL(url);
    }
}

/** Garde la photo collée aux bords de l'arche : jamais de vide dans le cadre. */
export function clampPlacement(
    photo: HTMLCanvasElement,
    placement: Placement,
): Placement {
    const zoom = clamp(placement.zoom, 1, MAX_ZOOM);
    const scale = coverScale(photo) * zoom;
    const maxX = Math.max(0, (photo.width * scale - FRAME.width) / 2);
    const maxY = Math.max(0, (photo.height * scale - FRAME.height) / 2);

    return {
        zoom,
        x: clamp(placement.x, -maxX, maxX),
        y: clamp(placement.y, -maxY, maxY),
    };
}

export function drawVisual(
    ctx: CanvasRenderingContext2D,
    scene: HTMLCanvasElement,
    frame: HTMLCanvasElement,
    photo: HTMLCanvasElement | null,
    placement: Placement,
) {
    ctx.clearRect(0, 0, VISUAL_WIDTH, VISUAL_HEIGHT);
    ctx.drawImage(scene, 0, 0);

    ctx.save();
    archPath(ctx, FRAME);
    ctx.clip();

    if (photo) {
        const scale = coverScale(photo) * placement.zoom;
        const width = photo.width * scale;
        const height = photo.height * scale;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
            photo,
            FRAME.x + (FRAME.width - width) / 2 + placement.x,
            FRAME.y + (FRAME.height - height) / 2 + placement.y,
            width,
            height,
        );
    } else {
        drawSilhouette(ctx);
    }

    ctx.restore();
    ctx.drawImage(frame, 0, 0);
}

/** Décor fixe : fond, logos, date et lieu. */
export function renderScene(
    assets: VisualAssets,
    event: EventInfo,
    host: string,
): HTMLCanvasElement {
    const info = visualInfo(event, host);
    const { canvas, ctx } = createCanvas(VISUAL_WIDTH, VISUAL_HEIGHT);

    drawBackground(ctx);

    // Logos, comme en tête de l'affiche officielle.
    const churchWidth = 250;
    const churchHeight =
        (assets.church.height / assets.church.width) * churchWidth;
    ctx.globalAlpha = 0.92;
    ctx.drawImage(
        assets.church,
        CENTER_X - churchWidth / 2,
        58,
        churchWidth,
        churchHeight,
    );
    ctx.globalAlpha = 1;

    const logoWidth = 390;
    const logoHeight =
        (assets.logo.naturalHeight / assets.logo.naturalWidth) * logoWidth;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 30;
    ctx.drawImage(
        assets.logo,
        CENTER_X - logoWidth / 2,
        118,
        logoWidth,
        logoHeight,
    );
    ctx.restore();

    if (info.edition) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        fitFont(ctx, info.edition, 700, 24, SANS, 760, 8);
        spacedText(ctx, info.edition, CENTER_X, 306, 8);
    }

    // Halo de l'arche, posé sous la photo : il rayonne autour sans la voiler.
    ctx.save();
    ctx.shadowColor = 'rgba(249, 115, 26, 0.95)';
    ctx.shadowBlur = 80;
    ctx.strokeStyle = '#f9731a';
    ctx.lineWidth = 12;
    archPath(ctx, FRAME);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.textAlign = 'center';
    fitFont(ctx, info.theme, 400, 40, SCRIPT, 880);
    ctx.fillText(info.theme, CENTER_X, THEME_Y);

    drawDateBlock(ctx, info);

    // Lien d'inscription, pour ceux qui verront le statut.
    const link = `Inscris-toi sur ${info.link}`;
    ctx.font = `600 26px ${SANS}`;
    const linkWidth = Math.min(ctx.measureText(link).width, 860);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    roundRectPath(
        ctx,
        CENTER_X - linkWidth / 2 - 32,
        LINK_Y,
        linkWidth + 64,
        58,
        29,
    );
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(link, CENTER_X, LINK_Y + 38, 860);

    return canvas;
}

/** Habillage posé par-dessus la photo : bordure, prénom et « J'y serai ! » sous l'arche. */
export function renderFrame(name: string): HTMLCanvasElement {
    const { canvas, ctx } = createCanvas(VISUAL_WIDTH, VISUAL_HEIGHT);

    // Bordure lumineuse, comme une flamme autour de l'autel (le halo est dans le décor).
    const border = ctx.createLinearGradient(0, FRAME.y, 0, FRAME_BOTTOM);
    border.addColorStop(0, '#fde68a');
    border.addColorStop(0.35, '#f9731a');
    border.addColorStop(1, '#c2410c');
    ctx.strokeStyle = border;
    ctx.lineWidth = 10;
    archPath(ctx, FRAME);
    ctx.stroke();

    const cleanName = name.trim();

    if (cleanName) {
        drawNamePill(ctx, cleanName.toLocaleUpperCase('fr'));
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = `700 32px ${SANS}`;
    spacedText(ctx, 'MOI AUSSI,', CENTER_X, FRAME_BOTTOM + 96, 12);

    const title = 'J’y serai !';
    const ink = ctx.createLinearGradient(0, TITLE_Y - 110, 0, TITLE_Y + 10);
    ink.addColorStop(0, '#fef3c7');
    ink.addColorStop(0.45, '#fdba74');
    ink.addColorStop(1, '#f9731a');
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    fitFont(ctx, title, 700, 140, SCRIPT, FRAME.width - 60);
    ctx.fillText(title, CENTER_X, TITLE_Y);
    ctx.restore();

    return canvas;
}

function drawBackground(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0c0907';
    ctx.fillRect(0, 0, VISUAL_WIDTH, VISUAL_HEIGHT);

    // Lueurs chaudes : derrière l'arche, en haut et en bas.
    glow(ctx, CENTER_X, 860, 980, [
        [0, 'rgba(249, 115, 26, 0.6)'],
        [0.4, 'rgba(194, 65, 12, 0.26)'],
        [1, 'rgba(194, 65, 12, 0)'],
    ]);
    glow(ctx, CENTER_X, -120, 760, [
        [0, 'rgba(253, 186, 116, 0.35)'],
        [1, 'rgba(253, 186, 116, 0)'],
    ]);
    glow(ctx, CENTER_X, VISUAL_HEIGHT + 100, 900, [
        [0, 'rgba(154, 52, 18, 0.55)'],
        [1, 'rgba(154, 52, 18, 0)'],
    ]);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Faisceaux de projecteurs depuis le haut.
    beam(ctx, 60, -60, 1.12, 1500, 210, 0.07);
    beam(ctx, VISUAL_WIDTH - 60, -60, Math.PI - 1.12, 1500, 210, 0.07);
    beam(ctx, CENTER_X, -100, Math.PI / 2, 1200, 260, 0.035);

    // Reflets irisés sur les bords, comme sur l'affiche.
    prism(ctx, -40, 1500, -0.62, 0.2);
    prism(ctx, VISUAL_WIDTH + 40, 330, Math.PI - 0.62, 0.14);

    // Bokeh : lumières floues de la salle (tirage fixe, toujours le même décor).
    const random = seededRandom(29);

    for (let i = 0; i < 46; i++) {
        const x = random() * VISUAL_WIDTH;
        const y = random() * VISUAL_HEIGHT;
        const radius = 8 + random() ** 2 * 64;
        const alpha = 0.05 + random() * 0.16;
        const color = ['253, 186, 116', '249, 115, 26', '254, 243, 199'][
            Math.floor(random() * 3)
        ];
        glow(ctx, x, y, radius, [
            [0, `rgba(${color}, ${alpha})`],
            [0.7, `rgba(${color}, ${alpha * 0.6})`],
            [1, `rgba(${color}, 0)`],
        ]);
    }

    ctx.restore();

    // Vignette pour recentrer le regard.
    const vignette = ctx.createRadialGradient(
        CENTER_X,
        VISUAL_HEIGHT / 2,
        480,
        CENTER_X,
        VISUAL_HEIGHT / 2,
        1250,
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, VISUAL_WIDTH, VISUAL_HEIGHT);
}

/** Date à gauche en grand, église et lieu à droite (comme l'affiche). */
function drawDateBlock(ctx: CanvasRenderingContext2D, info: VisualInfo) {
    const gap = 40;
    const top = DATE_Y;

    const left = [
        { text: info.weekday, font: `700 26px ${SANS}`, spacing: 12 },
        { text: info.day, font: `700 100px ${SANS}`, spacing: 0 },
        { text: info.year, font: `700 26px ${SANS}`, spacing: 12 },
    ];
    const right = [
        { text: info.church[0], font: `700 38px ${SANS}`, color: '#ffffff' },
        { text: info.church[1], font: `700 38px ${SANS}`, color: '#fb923c' },
        {
            text: info.place,
            font: `600 30px ${SANS}`,
            color: 'rgba(255, 255, 255, 0.82)',
        },
    ];

    const hasDate = !!info.day;
    const leftWidth = hasDate
        ? Math.min(
              360,
              Math.max(
                  ...left.map(({ text, font, spacing }) => {
                      ctx.font = font;

                      return spacedWidth(ctx, text ?? '', spacing);
                  }),
              ),
          )
        : 0;
    const rightWidth = Math.min(
        hasDate ? 520 : 900,
        Math.max(
            ...right.map(({ text, font }) => {
                ctx.font = font;

                return ctx.measureText(text).width;
            }),
        ),
    );
    const total = hasDate ? leftWidth + gap * 2 + rightWidth : rightWidth;
    const startX = (VISUAL_WIDTH - total) / 2;

    if (hasDate) {
        const leftCenter = startX + leftWidth / 2;
        ctx.fillStyle = '#ffffff';

        if (left[0].text) {
            ctx.font = left[0].font;
            spacedText(ctx, left[0].text, leftCenter, top + 30, 12);
        }

        const big = ctx.createLinearGradient(0, top + 52, 0, top + 130);
        big.addColorStop(0, '#fdba74');
        big.addColorStop(1, '#ea580c');
        ctx.fillStyle = big;
        ctx.font = left[1].font;
        ctx.textAlign = 'center';
        ctx.fillText(info.day ?? '', leftCenter, top + 124, leftWidth);

        if (left[2].text) {
            ctx.fillStyle = '#ffffff';
            ctx.font = left[2].font;
            spacedText(ctx, left[2].text, leftCenter, top + 164, 12);
        }

        const dividerX = startX + leftWidth + gap;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(dividerX - 1.5, top, 3, 170);
    }

    const rightX = hasDate ? startX + leftWidth + gap * 2 : CENTER_X;
    ctx.textAlign = hasDate ? 'left' : 'center';
    right.forEach(({ text, font, color }, index) => {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.fillText(text, rightX, top + 54 + index * 48, rightWidth);
    });
    ctx.textAlign = 'center';
}

function drawNamePill(ctx: CanvasRenderingContext2D, name: string) {
    const spacing = 5;
    const size = fitFont(ctx, name, 700, 38, SANS, 560, spacing);
    const textWidth = spacedWidth(ctx, name, spacing);
    const width = textWidth + 96;
    const height = 84;
    const x = CENTER_X - width / 2;
    const y = FRAME_BOTTOM - height / 2;

    const fill = ctx.createLinearGradient(x, 0, x + width, 0);
    fill.addColorStop(0, '#fb923c');
    fill.addColorStop(0.5, '#f9731a');
    fill.addColorStop(1, '#c2410c');

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 34;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = fill;
    roundRectPath(ctx, x, y, width, height, height / 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(255, 237, 213, 0.9)';
    ctx.lineWidth = 3;
    roundRectPath(ctx, x, y, width, height, height / 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    spacedText(ctx, name, CENTER_X, FRAME_BOTTOM + size * 0.36, spacing);
}

/** Silhouette affichée tant qu'aucune photo n'est choisie. */
function drawSilhouette(ctx: CanvasRenderingContext2D) {
    const fill = ctx.createLinearGradient(0, FRAME.y, 0, FRAME_BOTTOM);
    fill.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    fill.addColorStop(1, 'rgba(255, 255, 255, 0.03)');
    ctx.fillStyle = fill;
    ctx.fillRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.arc(CENTER_X, FRAME.y + FRAME.height * 0.4, 140, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(CENTER_X, FRAME_BOTTOM - 20, 320, 260, 0, 0, Math.PI * 2);
    ctx.fill();
}

function visualInfo(event: EventInfo, host: string): VisualInfo {
    const part = (options: Intl.DateTimeFormatOptions) =>
        event.startsAt
            ? new Intl.DateTimeFormat('fr-FR', {
                  ...options,
                  timeZone: EVENT_TIMEZONE,
              })
                  .format(new Date(event.startsAt))
                  .replace('.', '')
                  .toLocaleUpperCase('fr')
            : null;

    const year = part({ year: 'numeric' });
    const time = event.hasTime
        ? part({ hour: '2-digit', minute: '2-digit' })?.replace(':', 'H')
        : null;
    const day = part({ day: 'numeric' });

    return {
        edition: year ? `ÉDITION ${part({ month: 'long' })} ${year}` : null,
        weekday: part({ weekday: 'long' }),
        day: day ? `${day} ${part({ month: 'short' })}` : null,
        year: [year, time].filter(Boolean).join(' · ') || null,
        church: splitInTwo(event.hostChurch.toLocaleUpperCase('fr')),
        place: event.venue ?? event.city,
        theme: event.theme,
        link: `${host.replace(/^www\./, '')}/inscription`,
    };
}

/** Coupe un texte en deux lignes de longueurs proches. */
function splitInTwo(text: string): [string, string] {
    const words = text.split(' ');
    let best: [string, string] = [text, ''];
    let bestLength = Infinity;

    for (let i = 1; i < words.length; i++) {
        const first = words.slice(0, i).join(' ');
        const second = words.slice(i).join(' ');
        const length = Math.max(first.length, second.length);

        if (length < bestLength) {
            best = [first, second];
            bestLength = length;
        }
    }

    return best;
}

function coverScale(photo: HTMLCanvasElement) {
    return Math.max(FRAME.width / photo.width, FRAME.height / photo.height);
}

function archPath(ctx: CanvasRenderingContext2D, rect: Rect, corner = 48) {
    const { x, y, width, height } = rect;
    const radius = width / 2;

    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.arc(x + radius, y + radius, radius, Math.PI, 0);
    ctx.lineTo(x + width, y + height - corner);
    ctx.arcTo(x + width, y + height, x + width - corner, y + height, corner);
    ctx.lineTo(x + corner, y + height);
    ctx.arcTo(x, y + height, x, y + height - corner, corner);
    ctx.closePath();
}

function roundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

function glow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    stops: [number, string][],
) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function beam(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    length: number,
    spread: number,
    alpha: number,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(0, 0, length, 0);
    gradient.addColorStop(0, `rgba(255, 220, 180, ${alpha})`);
    gradient.addColorStop(1, 'rgba(255, 220, 180, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(length, -spread);
    ctx.lineTo(length, spread);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function prism(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    alpha: number,
) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const gradient = ctx.createLinearGradient(0, -120, 0, 120);
    gradient.addColorStop(0, 'rgba(249, 115, 26, 0)');
    gradient.addColorStop(0.3, `rgba(251, 146, 60, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(236, 72, 153, ${alpha * 0.7})`);
    gradient.addColorStop(0.7, `rgba(96, 165, 250, ${alpha * 0.6})`);
    gradient.addColorStop(1, 'rgba(96, 165, 250, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(-200, -120, 900, 240);
    ctx.restore();
}

/** Spacing between letters, drawn one by one (ctx.letterSpacing is too recent on iOS). */
function spacedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    y: number,
    spacing: number,
) {
    const align = ctx.textAlign;
    let x = centerX - spacedWidth(ctx, text, spacing) / 2;
    ctx.textAlign = 'left';

    for (const char of text) {
        ctx.fillText(char, x, y);
        x += ctx.measureText(char).width + spacing;
    }

    ctx.textAlign = align;
}

function spacedWidth(
    ctx: CanvasRenderingContext2D,
    text: string,
    spacing: number,
) {
    let width = 0;
    let count = 0;

    // Same letter by letter walk as spacedText, so the measure matches the drawing.
    for (const char of text) {
        width += ctx.measureText(char).width;
        count++;
    }

    return width + spacing * Math.max(0, count - 1);
}

/** Applies the largest font size (down from `size`) at which the text fits. */
function fitFont(
    ctx: CanvasRenderingContext2D,
    text: string,
    weight: number,
    size: number,
    family: string,
    maxWidth: number,
    spacing = 0,
): number {
    let current = size;
    ctx.font = `${weight} ${current}px ${family}`;

    while (current > 14 && spacedWidth(ctx, text, spacing) > maxWidth) {
        current -= 2;
        ctx.font = `${weight} ${current}px ${family}`;
    }

    return current;
}

/** Logo de l'église en blanc pour le fond sombre ; les pictogrammes gardent leurs couleurs. */
function whiten(image: HTMLImageElement): HTMLCanvasElement {
    const { canvas, ctx } = createCanvas(
        image.naturalWidth,
        image.naturalHeight,
    );
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = pixels.data;

    for (let i = 0; i < data.length; i += 4) {
        const max = Math.max(data[i], data[i + 1], data[i + 2]);
        const min = Math.min(data[i], data[i + 1], data[i + 2]);

        // Texte noir ou gris (peu saturé et sombre) : passé en blanc.
        if (max - min < 48 && max < 170) {
            data[i] = data[i + 1] = data[i + 2] = 255;
        }
    }

    ctx.putImageData(pixels, 0, 0);

    return canvas;
}

function createCanvas(width: number, height: number) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Canvas 2D indisponible.');
    }

    return { canvas, ctx };
}

function loadImage(src: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.decoding = 'async';
    image.src = src;

    return image.decode().then(() => image);
}

function seededRandom(seed: number) {
    let state = seed;

    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}
