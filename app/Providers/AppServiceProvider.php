<?php

namespace App\Providers;

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

            return [
                Limit::perMinute(300)->by('ip:'.$request->ip())->response($tooMany),
                Limit::perMinute(5)->by('phone:'.preg_replace('/\D/', '', (string) $request->input('phone')))->response($tooMany),
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
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
