<?php

use App\Http\Controllers\Admin\RegistrationController as AdminRegistrationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeployHookController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('confidentialite', 'privacy')->name('privacy');
Route::inertia('boutique', 'boutique')->name('boutique');

Route::get('inscription', [RegistrationController::class, 'create'])->name('registration.create');
Route::post('inscription', [RegistrationController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('registration.store');
Route::get('inscription/confirmee', [RegistrationController::class, 'confirmed'])->name('registration.confirmed');
Route::get('inscription/confirmee/pdf', [RegistrationController::class, 'pdf'])->name('registration.pdf');

Route::post('deploy-hook', DeployHookController::class)
    ->withoutMiddleware(ValidateCsrfToken::class)
    ->middleware('throttle:5,1')
    ->name('deploy-hook');

Route::prefix('{current_team}')
    ->middleware(['auth', 'verified', EnsureTeamMembership::class])
    ->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::middleware('can:manage-registrations')->group(function () {
            Route::get('inscrits', [AdminRegistrationController::class, 'index'])->name('registrations.index');
            Route::get('inscrits/export', [AdminRegistrationController::class, 'export'])->name('registrations.export');
        });
    });

Route::middleware(['auth'])->group(function () {
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

require __DIR__.'/settings.php';
