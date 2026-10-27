<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRegistrationRequest;
use App\Mail\RegistrationConfirmed;
use App\Models\Registration;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

use function Illuminate\Support\defer;

class RegistrationController extends Controller
{
    /**
     * Show the public registration form.
     */
    public function create(): Response
    {
        return Inertia::render('registration/create');
    }

    /**
     * Store a new registration.
     */
    public function store(StoreRegistrationRequest $request): RedirectResponse
    {
        try {
            $registration = Registration::create($request->safe()->except(['role_choice', 'role_other']));
        } catch (UniqueConstraintViolationException) {
            // Same phone submitted twice at the same moment (double tap, two devices):
            // the unique index rejects the second one, show the usual message instead of an error page.
            return back()->withInput()->withErrors(['phone' => 'Ce numéro de téléphone est déjà inscrit.']);
        }

        if ($registration->email) {
            // Sent after the response so a slow or failing SMTP server never blocks the registration.
            defer(function () use ($registration) {
                try {
                    Mail::to($registration->email)->send(new RegistrationConfirmed($registration));
                } catch (Throwable $e) {
                    report($e);
                }
            });
        }

        // Kept in the session (not flashed) so the page can be reloaded and the PDF downloaded.
        $request->session()->put('registration_id', $registration->id);

        // Flashed: the PDF downloads automatically on the first display only, not on reload.
        return to_route('registration.confirmed')->with('download_pdf', true);
    }

    /**
     * Show the confirmation page of the registration just submitted.
     */
    public function confirmed(Request $request): Response|RedirectResponse
    {
        $registration = Registration::find((int) $request->session()->get('registration_id'));

        if (! $registration) {
            return to_route('registration.create');
        }

        return Inertia::render('registration/confirmed', [
            'registration' => [
                'reference' => $registration->reference,
                'firstName' => $registration->first_name,
            ],
            'autoDownload' => (bool) $request->session()->get('download_pdf', false),
        ]);
    }

    /**
     * Download the confirmation of the registration just submitted as a PDF.
     */
    public function pdf(Request $request): StreamedResponse|RedirectResponse
    {
        $registration = Registration::find((int) $request->session()->get('registration_id'));

        if (! $registration) {
            return to_route('registration.create');
        }

        // Generated once per registration, then served from disk: dompdf is the heaviest
        // part of the site and the PDF is requested automatically after each registration.
        $path = "pdf/inscription-{$registration->reference}.pdf";
        $disk = Storage::disk('local');

        if (! $disk->exists($path)) {
            $disk->put($path, $this->renderPdf($registration));
        }

        return $disk->download($path, "inscription-{$registration->reference}.pdf", [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * Render the registration confirmation PDF.
     */
    private function renderPdf(Registration $registration): string
    {
        $startsAt = config('event.starts_at');

        return Pdf::loadView('pdf.registration', [
            'registration' => $registration,
            'eventName' => config('event.name'),
            'startsAt' => $startsAt
                ? Str::ucfirst(Carbon::parse($startsAt)->settings(['locale' => 'fr'])->translatedFormat(
                    str_contains($startsAt, ':') ? 'l j F Y \à H\hi' : 'l j F Y'
                ))
                : null,
            'place' => collect([config('event.venue'), config('event.city')])->filter()->implode(', '),
        ])->output();
    }
}
