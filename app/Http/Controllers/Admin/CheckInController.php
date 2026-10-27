<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckInController extends Controller
{
    /**
     * Entrance page: scans the QR code of the registration PDF.
     */
    public function show(): Response
    {
        return Inertia::render('registrations/check-in', [
            'present' => Registration::whereNotNull('checked_in_at')->count(),
            'total' => Registration::count(),
        ]);
    }

    /**
     * Mark a registrant as present. Always answers 200 with a status, so the
     * scanner can chain scans without handling HTTP errors.
     */
    public function store(Request $request): JsonResponse
    {
        // Accepts the bare code, a lowercase one typed by hand, or any text containing it.
        preg_match('/ADP-[A-Z0-9]{6}/', strtoupper((string) $request->input('reference')), $match);

        $registration = isset($match[0])
            ? Registration::firstWhere('reference', $match[0])
            : null;

        if (! $registration) {
            return response()->json(['status' => 'unknown']);
        }

        // Conditional update: with two phones scanning, only one marks the person present.
        $checkedIn = Registration::whereKey($registration->id)
            ->whereNull('checked_in_at')
            ->update(['checked_in_at' => now()]) === 1;

        $registration->refresh();

        return response()->json([
            'status' => $checkedIn ? 'ok' : 'already',
            'registration' => [
                'reference' => $registration->reference,
                'name' => $registration->first_name.' '.$registration->last_name,
                'gender' => $registration->gender,
                'role' => $registration->role,
                'churchGroup' => Registration::CHURCH_GROUPS[$registration->church_group] ?? null,
                'checkedInAt' => $registration->checked_in_at?->format('H:i'),
            ],
            'present' => Registration::whereNotNull('checked_in_at')->count(),
        ]);
    }
}
