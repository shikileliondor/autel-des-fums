<?php

namespace App\Http\Middleware;

use App\Models\Registration;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
                'canManageRegistrations' => $user?->can('manage-registrations') ?? false,
            ],
            'event' => [
                'name' => config('event.name'),
                'tagline' => config('event.tagline'),
                'theme' => config('event.theme'),
                'themeReference' => config('event.theme_reference'),
                'startsAt' => config('event.starts_at')
                    ? Carbon::parse(config('event.starts_at'))->toIso8601String()
                    : null,
                'hasTime' => str_contains((string) config('event.starts_at'), ':'),
                'city' => config('event.city'),
                'venue' => config('event.venue'),
                'hostChurch' => Registration::HOST_CHURCH,
                'contactEmail' => config('event.contact_email'),
                'contactPhone' => config('event.contact_phone'),
                'contacts' => config('event.contacts'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],
        ];
    }
}
