import { Head, http, usePage } from '@inertiajs/react';
import { CameraOff, CheckCircle2, CircleAlert, CircleX } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { show, store } from '@/routes/check-in';

type Scanned = {
    reference: string;
    name: string;
    gender: 'homme' | 'femme';
    role: string | null;
    churchGroup: string | null;
    checkedInAt: string | null;
};

type CheckInResponse =
    | { status: 'ok' | 'already'; registration: Scanned; present: number }
    | { status: 'unknown' };

type Result = {
    status: CheckInResponse['status'] | 'error';
    code: string;
    registration?: Scanned;
};

// Le même QR code reste souvent devant la caméra : on l'ignore pendant ce délai.
const SAME_CODE_DELAY = 4000;
const RESULT_DURATION = 3500;

export default function CheckIn({
    present: initialPresent,
    total,
}: {
    present: number;
    total: number;
}) {
    const teamSlug = usePage().props.currentTeam?.slug;
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastScan = useRef({ code: '', at: 0 });
    const hideTimer = useRef<number>(undefined);
    const [present, setPresent] = useState(initialPresent);
    const [result, setResult] = useState<Result | null>(null);
    const [history, setHistory] = useState<Result[]>([]);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [manual, setManual] = useState('');

    const checkIn = useCallback(
        async (code: string) => {
            const now = Date.now();

            if (
                code === lastScan.current.code &&
                now - lastScan.current.at < SAME_CODE_DELAY
            ) {
                return;
            }

            lastScan.current = { code, at: now };

            let next: Result;

            try {
                const response = await http.getClient().request({
                    method: 'post',
                    url: store(teamSlug).url,
                    data: { reference: code },
                    headers: { Accept: 'application/json' },
                });
                const body = JSON.parse(response.data) as CheckInResponse;

                next = { status: body.status, code };

                if (body.status !== 'unknown') {
                    next.registration = body.registration;
                    setPresent(body.present);
                }
            } catch {
                next = { status: 'error', code };
            }

            signal(next.status);
            setResult(next);
            setHistory((items) => [next, ...items].slice(0, 8));
            window.clearTimeout(hideTimer.current);
            hideTimer.current = window.setTimeout(
                () => setResult(null),
                RESULT_DURATION,
            );
        },
        [teamSlug],
    );

    useEffect(() => {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        const scanner = new QrScanner(
            video,
            (scan) => void checkIn(scan.data.trim()),
            {
                preferredCamera: 'environment',
                maxScansPerSecond: 15,
                highlightScanRegion: true,
                highlightCodeOutline: true,
                returnDetailedScanResult: true,
            },
        );

        scanner
            .start()
            .catch(() =>
                setCameraError(
                    'Caméra indisponible. Autorise l’accès à la caméra (le site doit être en HTTPS), ou saisis le code à la main.',
                ),
            );

        return () => {
            scanner.destroy();
            window.clearTimeout(hideTimer.current);
        };
    }, [checkIn]);

    const submitManual = (e: FormEvent) => {
        e.preventDefault();

        if (manual.trim()) {
            lastScan.current = { code: '', at: 0 };
            void checkIn(manual.trim());
            setManual('');
        }
    };

    return (
        <>
            <Head title="Accueil" />
            <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Accueil</h1>
                        <p className="text-sm text-muted-foreground">
                            Scanne le QR code du PDF d’inscription.
                        </p>
                    </div>
                    <p className="text-right">
                        <span className="text-3xl font-extrabold tabular-nums">
                            {present}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                            {' '}
                            / {total}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                            présents
                        </span>
                    </p>
                </div>

                <div className="relative aspect-square overflow-hidden rounded-2xl bg-black">
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        className="size-full object-cover"
                    />

                    {cameraError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white">
                            <CameraOff className="size-8" />
                            {cameraError}
                        </div>
                    )}

                    {result && <ResultCard result={result} overlay />}
                </div>

                <form onSubmit={submitManual} className="flex gap-2">
                    <Input
                        value={manual}
                        onChange={(e) => setManual(e.target.value)}
                        placeholder="Code (ADP-XXXXXX)"
                        autoCapitalize="characters"
                        className="font-mono uppercase"
                    />
                    <Button type="submit">Valider</Button>
                </form>

                {history.length > 0 && (
                    <section className="flex flex-col gap-2">
                        <h2 className="text-sm font-semibold text-muted-foreground">
                            Derniers scans
                        </h2>
                        {history.map((item, i) => (
                            <ResultCard key={i} result={item} />
                        ))}
                    </section>
                )}
            </div>
        </>
    );
}

const STATUS = {
    ok: {
        title: 'Bienvenue !',
        icon: CheckCircle2,
        className: 'bg-emerald-600 text-white',
    },
    already: {
        title: 'Déjà enregistré',
        icon: CircleAlert,
        className: 'bg-amber-500 text-black',
    },
    unknown: {
        title: 'Code inconnu',
        icon: CircleX,
        className: 'bg-red-600 text-white',
    },
    error: {
        title: 'Erreur réseau, réessaie',
        icon: CircleX,
        className: 'bg-red-600 text-white',
    },
} as const;

function ResultCard({
    result,
    overlay,
}: {
    result: Result;
    overlay?: boolean;
}) {
    const { title, icon: Icon, className } = STATUS[result.status];
    const person = result.registration;

    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-xl p-3',
                className,
                overlay && 'absolute inset-x-3 bottom-3 p-4 shadow-xl',
            )}
        >
            <Icon className={cn('shrink-0', overlay ? 'size-10' : 'size-6')} />
            <div className="min-w-0">
                <p className={cn('font-bold', overlay && 'text-lg')}>
                    {person?.name ?? title}
                </p>
                <p className="truncate text-sm opacity-90">
                    {person
                        ? [
                              title,
                              result.status === 'already' &&
                                  `à ${person.checkedInAt}`,
                              person.role,
                              person.churchGroup,
                          ]
                              .filter(Boolean)
                              .join(' · ')
                        : result.code}
                </p>
            </div>
        </div>
    );
}

/** Bip et vibration : l'accueil n'a pas besoin de regarder l'écran. */
function signal(status: Result['status']) {
    navigator.vibrate?.(status === 'ok' ? 80 : [80, 60, 80]);

    try {
        const audio = new AudioContext();
        const oscillator = audio.createOscillator();
        oscillator.frequency.value = status === 'ok' ? 880 : 220;
        oscillator.connect(audio.destination);
        oscillator.start();
        oscillator.stop(audio.currentTime + 0.15);
        oscillator.onended = () => void audio.close();
    } catch {
        // Pas de son disponible : la couleur suffit.
    }
}

CheckIn.layout = (props: { currentTeam?: { slug: string } | null }) => ({
    breadcrumbs: [
        {
            title: 'Accueil',
            href: show(props.currentTeam?.slug),
        },
    ],
});
