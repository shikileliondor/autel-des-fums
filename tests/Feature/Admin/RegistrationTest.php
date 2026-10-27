<?php

use App\Models\Registration;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['event.admin_emails' => ['admin@example.com']]);
});

test('guests get a 404 and are not sent to the sign-in page', function () {
    $this->get('/team/inscrits')->assertNotFound();
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

test('admins see registrations split by church category and can filter on one', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    Registration::factory()->count(3)->create(['church_group' => Registration::GROUP_HOST]);
    Registration::factory()->count(2)->create(['church_group' => Registration::GROUP_FOURSQUARE]);
    Registration::factory()->create(['church_group' => Registration::GROUP_GUEST]);

    $this->actingAs($admin)
        ->get(route('registrations.index', $admin->currentTeam))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.groups.0', ['key' => 'revelation', 'label' => 'Foursquare Révélation', 'count' => 3])
            ->where('stats.groups.1', ['key' => 'foursquare', 'label' => 'Autre Foursquare', 'count' => 2])
            ->where('stats.groups.2', ['key' => 'invite', 'label' => 'Autres églises', 'count' => 1]));

    $this->actingAs($admin)
        ->get(route('registrations.index', [$admin->currentTeam, 'group' => 'foursquare']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('registrations.data', 2)
            ->where('registrations.data.0.churchGroup', 'Autre Foursquare')
            ->where('filters.group', 'foursquare')
            ->where('stats.total', 6));
});

test('the export includes the church category', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    Registration::factory()->create(['church_group' => Registration::GROUP_HOST]);

    $csv = $this->actingAs($admin)
        ->get(route('registrations.export', $admin->currentTeam))
        ->streamedContent();

    expect($csv)->toContain('Catégorie')->toContain('Foursquare Révélation');
});

test('admins see registrations split by role', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    Registration::factory()->count(2)->create(['role' => 'Chantre']);
    Registration::factory()->create(['role' => 'Protocole']);
    Registration::factory()->create(['role' => null]);

    $this->actingAs($admin)
        ->get(route('registrations.index', $admin->currentTeam))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.roles.0', ['label' => 'Chantre', 'count' => 2])
            ->where('stats.roles.4', ['label' => 'Autre', 'count' => 1]));
});

test('the export neutralises spreadsheet formulas typed by visitors', function () {
    $admin = User::factory()->create(['email' => 'admin@example.com']);
    Registration::factory()->create([
        'church' => '=HYPERLINK("https://piege.example";"Clique")',
        'role' => '@SUM(1+1)',
        'phone' => '+2250701020304',
    ]);

    $csv = $this->actingAs($admin)
        ->get(route('registrations.export', $admin->currentTeam))
        ->streamedContent();

    expect($csv)
        ->toContain("'=HYPERLINK")
        ->toContain("'@SUM")
        ->toContain(';+2250701020304;');
});
