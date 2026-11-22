<?php

namespace App\Providers;

use App\Http\Requests\StoreRegistrationRequest;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        Gate::define('manage-registrations', fn (User $user): bool => in_array(
            strtolower($user->email),
            config('event.admin_emails'),
            true,
        ));

        $this->configureRegistrationRateLimit();

        // Wall uploads: plenty for a family sharing one connection, not enough to flood the wall.
        RateLimiter::for('visuals', fn (Request $request) => [
            Limit::perMinute(10)->by('visuals-minute:'.$request->ip()),
            Limit::perHour(60)->by('visuals-hour:'.$request->ip()),
        ]);
    }

    /**
     * Many people register from the same IP (church Wi-Fi, mobile carrier NAT),
     * so the per-IP limit stays high; the tight limit is per phone number.
     */
    protected function configureRegistrationRateLimit(): void
    {
        RateLimiter::for('registrations', function (Request $request) {
            $tooMany = fn () => back()->withInput()->withErrors([
                'phone' => 'Trop de tentatives. Patiente une minute puis réessaie.',
            ]);

            $email = strtolower(trim((string) $request->input('email')));

            return array_filter([
                Limit::perMinute(300)->by('ip:'.$request->ip())->response($tooMany),
                // Same key whatever way the number is written, so the limit can't be dodged.
                Limit::perMinute(5)->by('phone:'.StoreRegistrationRequest::normalizePhone((string) $request->input('phone')))->response($tooMany),
                // Each registration emails this address: stops the form being used to flood a mailbox.
                // Generous enough for a family sharing one address.
                $email !== '' ? Limit::perHour(10)->by('email:'.$email)->response(fn () => back()->withInput()->withErrors([
                    'email' => 'Trop d’inscriptions avec cette adresse e-mail. Réessaie plus tard.',
                ])) : null,
            ]);
        });

        // "Retrouver mon inscription": a phone number opens a registration and its PDF,
        // so numbers can't be tried in bulk. The per-IP limit stays high for the church
        // Wi-Fi on the day, when many people look themselves up from the same connection.
        RateLimiter::for('registration-lookups', function (Request $request) {
            $tooMany = fn () => back()->withInput()->withErrors([
                'phone' => 'Trop de tentatives. Patiente une minute puis réessaie.',
            ]);

            return [
                Limit::perMinute(60)->by('lookup-ip:'.$request->ip())->response($tooMany),
                Limit::perHour(600)->by('lookup-ip-hour:'.$request->ip())->response($tooMany),
                Limit::perMinute(10)->by('lookup-phone:'.StoreRegistrationRequest::normalizePhone((string) $request->input('phone')))->response($tooMany),
            ];
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            // No symbol required: organisers type it on their phone.
            ? Password::min(10)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->uncompromised()
            : null,
        );
    }
}
