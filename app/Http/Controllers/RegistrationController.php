<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRegistrationRequest;
use App\Mail\RegistrationConfirmed;
use App\Models\Registration;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
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
        $registration = Registration::create($request->validated());

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

        return to_route('registration.confirmed');
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
        ]);
    }

    /**
     * Download the confirmation of the registration just submitted as a PDF.
     */
    public function pdf(Request $request): HttpResponse|RedirectResponse
    {
        $registration = Registration::find((int) $request->session()->get('registration_id'));

        if (! $registration) {
            return to_route('registration.create');
        }

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
        ])->download("inscription-{$registration->reference}.pdf");
    }
}
