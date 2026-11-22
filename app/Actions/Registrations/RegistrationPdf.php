<?php

namespace App\Actions\Registrations;

use App\Models\Registration;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Registration confirmation PDF, shared by the registrant pages and the admin list.
 */
class RegistrationPdf
{
    /** Bumped whenever the PDF layout changes (v3: the QR code opens the registrant page). */
    private const VERSION = 'v3';

    /**
     * Generated once per registration, then served from disk: dompdf is the heaviest
     * part of the site and the PDF is requested automatically after each registration.
     */
    public function download(Registration $registration): StreamedResponse
    {
        // The event details are part of the path, so changing the date, time or place
        // regenerates every PDF instead of serving copies with the old details.
        $event = substr(md5((string) json_encode(config()->get([
            'event.name', 'event.starts_at', 'event.venue', 'event.city', 'event.contacts',
        ]))), 0, 8);
        $path = 'pdf/'.self::VERSION."-{$event}/inscription-{$registration->reference}.pdf";
        $disk = Storage::disk('local');

        if (! $disk->exists($path)) {
            $disk->put($path, $this->render($registration));
        }

        return $disk->download($path, "inscription-{$registration->reference}.pdf", [
            'Content-Type' => 'application/pdf',
        ]);
    }

    private function render(Registration $registration): string
    {
        $startsAt = config('event.starts_at');

        return Pdf::loadView('pdf.registration', [
            'registration' => $registration,
            'qrCode' => $this->qrCode(route('registration.show', $registration)),
            'eventName' => config('event.name'),
            'startsAt' => $startsAt
                ? Str::ucfirst(Carbon::parse($startsAt)->settings(['locale' => 'fr'])->translatedFormat(
                    str_contains($startsAt, ':') ? 'l j F Y \à H\hi' : 'l j F Y'
                ))
                : null,
            'place' => collect([config('event.venue'), config('event.city')])->filter()->implode(', '),
        ])->output();
    }

    /**
     * QR code opening the registrant page, scanned at the entrance. SVG, so dompdf
     * renders it without the GD extension.
     */
    private function qrCode(string $content): string
    {
        $svg = (new Writer(new ImageRenderer(new RendererStyle(320, 1), new SvgImageBackEnd)))
            ->writeString($content);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }
}
