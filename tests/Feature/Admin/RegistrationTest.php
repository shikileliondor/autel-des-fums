<?php

use App\Models\Registration;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['event.admin_emails' => ['admin@example.com']]);
});

test('guests are redirected to the login page', function () {
    $this->get('/team/inscrits')->assertRedirect(route('login'));
});

test('users who are not admins cannot see registrations', function () {
    $user = User::factory()->create(['email' => 'someone@example.com']);

    $this->actingAs($user)
        ->get(route('registrations.index', $user->currentTeam))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('registrations.export', $user->currentTeam))
        ->assertForbidden();
});

test('admins can list registrations with stats', function () {
    $admin = User::factory()->create(['email' => 'Admin@example.com']);
    Registration::factory()->count(2)->create(['gender' => 'femme']);
    Registration::factory()->create(['gender' => 'homme']);

    $this->actingAs($admin)
        ->get(route('registrations.index', $admin->currentTeam))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registrations/index')
            ->has('registrations.data', 3)
            ->where('stats.total', 3)
            ->where('stats.women', 2)
            ->where('stats.men', 1)
            ->where('auth.canManageRegistrations', true));
});

test('admins can search registrations', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    Registration::factory()->create(['last_name' => 'Kouassi']);
    Registration::factory()->create(['last_name' => 'Traoré']);

    $this->actingAs($admin)
        ->get(route('registrations.index', [$admin->currentTeam, 'search' => 'kouas']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('registrations.data', 1)
            ->where('filters.search', 'kouas'));
});

test('admins can export registrations as csv', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    $registration = Registration::factory()->create();

    $response = $this->actingAs($admin)
        ->get(route('registrations.export', $admin->currentTeam))
        ->assertOk()
        ->assertDownload();

    expect($response->streamedContent())
        ->toContain('Référence;Prénom;Nom')
        ->toContain($registration->reference)
        ->toContain($registration->phone);
});
