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
        $group = $request->string('group')->value();
        $group = array_key_exists($group, Registration::CHURCH_GROUPS) ? $group : '';

        $registrations = Registration::query()
            ->search($search)
            ->when($group !== '', fn ($query) => $query->where('church_group', $group))
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
                'role' => $registration->role,
                'church' => $registration->church,
                'churchGroup' => Registration::CHURCH_GROUPS[$registration->church_group] ?? null,
                'createdAt' => $registration->created_at?->format('d/m/Y H:i'),
                'checkedInAt' => $registration->checked_in_at?->format('d/m H:i'),
            ]);

        return Inertia::render('registrations/index', [
            'registrations' => $registrations,
            'filters' => ['search' => $search, 'group' => $group],
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

            fputcsv($handle, ['Référence', 'Prénom', 'Nom', 'Sexe', 'Téléphone', 'E-mail', 'Catégorie', 'Église', 'Fonction / rôle', 'Ville / commune', 'Inscrit le', 'Présent à'], ';');

            Registration::query()->oldest()->lazy()->each(fn (Registration $registration) => fputcsv($handle, [
                $registration->reference,
                self::csvSafe($registration->first_name),
                self::csvSafe($registration->last_name),
                $registration->gender,
                $registration->phone,
                self::csvSafe($registration->email),
                Registration::CHURCH_GROUPS[$registration->church_group] ?? '',
                self::csvSafe($registration->church),
                self::csvSafe($registration->role),
                self::csvSafe($registration->city),
                $registration->created_at?->format('d/m/Y H:i'),
                $registration->checked_in_at?->format('d/m/Y H:i'),
            ], ';'));

            fclose($handle);
        }, 'inscrits-autel-des-parfums-'.now()->format('Y-m-d').'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Neutralise spreadsheet formulas in visitor-typed text (CSV injection):
     * a cell starting with = + - @ or a control character is prefixed with a quote,
     * so Excel shows it as text instead of running it.
     */
    private static function csvSafe(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return in_array($value[0], ['=', '+', '-', '@', "\t", "\r", "\n"], true) ? "'".$value : $value;
    }
}
