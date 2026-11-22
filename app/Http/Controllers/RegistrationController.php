<?php

namespace App\Http\Controllers;

use App\Actions\Registrations\RegistrationPdf;
use App\Http\Requests\StoreRegistrationRequest;
use App\Mail\RegistrationConfirmed;
use App\Models\Registration;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
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
    public function create(Request $request): Response
    {
        return Inertia::render('registration/create', [
            // Admins can register before the opening, to test the form.
            'canRegisterEarly' => $request->user()?->can('manage-registrations') ?? false,
        ]);
    }

    /**
     * Store a new registration.
     */
    public function store(StoreRegistrationRequest $request): RedirectResponse
    {
        // The countdown hides the form, but only the server can really keep it closed.
        if (! Registration::registrationsOpen() && ! $request->user()?->can('manage-registrations')) {
            return back()->withInput()->withErrors(['form' => 'Les inscriptions ne sont pas encore ouvertes. Patiente jusqu’à l’ouverture.']);
        }

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
                'gender' => $registration->gender,
                // "Tu es le 152e adorateur inscrit": position in registration order.
                'rank' => Registration::where('id', '<=', $registration->id)->count(),
            ],
            'autoDownload' => (bool) $request->session()->get('download_pdf', false),
        ]);
    }

    /**
     * Download the confirmation of the registration just submitted as a PDF.
     */
    public function pdf(Request $request, RegistrationPdf $pdf): StreamedResponse|RedirectResponse
    {
        $registration = Registration::find((int) $request->session()->get('registration_id'));

        if (! $registration) {
            return to_route('registration.create');
        }

        return $pdf->download($registration);
    }

    /**
     * Page where registrants find their registration again, and its PDF.
     */
    public function find(): Response
    {
        return Inertia::render('registration/find');
    }

    /**
     * Find a registration by the phone number used to register, then open its
     * confirmation page (with the PDF). The phone is asked rather than the name:
     * the PDF shows the phone, e-mail and entrance QR code, which a name alone
     * must not give away.
     */
    public function lookup(Request $request): RedirectResponse
    {
        $request->merge(['phone' => StoreRegistrationRequest::normalizePhone((string) $request->input('phone'))]);

        $request->validate([
            'phone' => ['required', 'regex:/^\+225[0-9]{10}$/'],
        ], [
            'phone.required' => 'Entre le numéro de téléphone utilisé pour ton inscription.',
            'phone.regex' => 'Le numéro doit avoir 10 chiffres après +225 (ex. +225 07 01 02 03 04).',
        ]);

        $registration = Registration::where('phone', $request->input('phone'))->first();

        if (! $registration) {
            return back()->withInput()->withErrors([
                'phone' => 'Aucune inscription avec ce numéro. Vérifie-le, ou inscris-toi si ce n’est pas encore fait.',
            ]);
        }

        $request->session()->put('registration_id', $registration->id);

        return to_route('registration.confirmed');
    }

    /**
     * Public page opened by the QR code: no phone or email, anyone can scan it.
     */
    public function show(Registration $registration): Response
    {
        return Inertia::render('registration/show', [
            'registration' => [
                'reference' => $registration->reference,
                'name' => $registration->first_name.' '.$registration->last_name,
                'role' => $registration->role,
                'churchGroup' => Registration::CHURCH_GROUPS[$registration->church_group] ?? null,
                'checkedIn' => $registration->checked_in_at !== null,
            ],
        ]);
    }
}
