<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use App\Models\TeamInvitation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $email = strtolower($request->user()->email);

        $pendingInvitations = TeamInvitation::query()
            ->with(['inviter', 'team'])
            ->whereRaw('LOWER(email) = ?', [$email])
            ->whereNull('accepted_at')
            ->where(fn ($query) => $query
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>=', now()))
            ->latest()
            ->get()
            ->map(fn (TeamInvitation $invitation) => [
                'code' => $invitation->code,
                'inviterName' => $invitation->inviter->name,
                'team' => [
                    'name' => $invitation->team->name,
                    'slug' => $invitation->team->slug,
                ],
            ]);

        $canManageRegistrations = $request->user()->can('manage-registrations');

        return Inertia::render('dashboard', [
            'pendingInvitations' => $pendingInvitations,
            'stats' => $canManageRegistrations ? Registration::stats() : null,
            'latestRegistrations' => $canManageRegistrations
                ? Registration::latest()->limit(5)->get()->map(fn (Registration $registration) => [
                    'id' => $registration->id,
                    'reference' => $registration->reference,
                    'name' => $registration->first_name.' '.$registration->last_name,
                    'phone' => $registration->phone,
                    'church' => $registration->church,
                    'createdAt' => $registration->created_at?->format('d/m/Y H:i'),
                ])
                : [],
        ]);
    }
}
