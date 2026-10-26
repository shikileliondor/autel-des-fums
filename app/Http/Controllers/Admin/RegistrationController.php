<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RegistrationController extends Controller
{
    /**
     * List registrations with search, pagination and summary stats.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->value();

        $registrations = Registration::query()
            ->search($search)
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Registration $registration) => [
                'id' => $registration->id,
                'reference' => $registration->reference,
                'name' => $registration->first_name.' '.$registration->last_name,
                'gender' => $registration->gender,
                'phone' => $registration->phone,
                'email' => $registration->email,
                'city' => $registration->city,
                'church' => $registration->church,
                'createdAt' => $registration->created_at?->format('d/m/Y H:i'),
            ]);

        return Inertia::render('registrations/index', [
            'registrations' => $registrations,
            'filters' => ['search' => $search],
            'stats' => Registration::stats(),
        ]);
    }

    /**
     * Download all registrations as a CSV file readable by Excel.
     */
    public function export(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            // UTF-8 BOM so Excel displays accents correctly.
            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['Référence', 'Prénom', 'Nom', 'Sexe', 'Téléphone', 'E-mail', 'Ville / commune', 'Église', 'Inscrit le'], ';');

            Registration::query()->oldest()->lazy()->each(fn (Registration $registration) => fputcsv($handle, [
                $registration->reference,
                $registration->first_name,
                $registration->last_name,
                $registration->gender,
                $registration->phone,
                $registration->email,
                $registration->city,
                $registration->church,
                $registration->created_at?->format('d/m/Y H:i'),
            ], ';'));

            fclose($handle);
        }, 'inscrits-autel-des-parfums-'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
