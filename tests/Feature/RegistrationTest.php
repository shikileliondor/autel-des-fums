<?php

use App\Mail\RegistrationConfirmed;
use App\Models\Registration;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function validRegistration(array $overrides = []): array
{
    return [
        'first_name' => 'Ange',
        'last_name' => 'Kouassi',
        'gender' => 'homme',
        'phone' => '+225 07 01 02 03 04',
        'email' => 'Ange@Example.com',
        'city' => 'Cocody',
        'church' => null,
        ...$overrides,
    ];
}

test('the home page shows the event', function () {
    config(['event.name' => "L'Autel des Parfums"]);

    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('welcome')
            ->where('event.name', "L'Autel des Parfums"));
});

test('the registration form can be displayed', function () {
    $this->get(route('registration.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('registration/create'));
});

test('a visitor can register', function () {
    $this->post(route('registration.store'), validRegistration())
        ->assertRedirect(route('registration.confirmed'));

    $registration = Registration::sole();

    expect($registration)
        ->phone->toBe('+2250701020304')
        ->email->toBe('ange@example.com')
        ->reference->toStartWith('ADP-');
});

test('a confirmation email is sent when an email is given', function () {
    Mail::fake();

    $this->post(route('registration.store'), validRegistration());

    Mail::assertSent(RegistrationConfirmed::class, fn (RegistrationConfirmed $mail) => $mail->hasTo('ange@example.com')
        && $mail->registration->is(Registration::sole()));
});

test('no email is sent when none is given', function () {
    Mail::fake();

    $this->post(route('registration.store'), validRegistration(['email' => '']));

    Mail::assertNothingSent();
    expect(Registration::sole()->email)->toBeNull();
});

test('the confirmation email contains the reference', function () {
    $registration = Registration::factory()->create();

    (new RegistrationConfirmed($registration))->assertSeeInHtml($registration->reference);
});

test('the confirmation page shows the reference of the registration just made', function () {
    $this->post(route('registration.store'), validRegistration());

    $this->get(route('registration.confirmed'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registration/confirmed')
            ->where('registration.reference', Registration::sole()->reference)
            ->where('registration.firstName', 'Ange'));
});

test('the pdf downloads automatically right after registering, not on reload', function () {
    $this->post(route('registration.store'), validRegistration());

    $this->get(route('registration.confirmed'))
        ->assertInertia(fn (Assert $page) => $page->where('autoDownload', true));

    $this->get(route('registration.confirmed'))
        ->assertInertia(fn (Assert $page) => $page->where('autoDownload', false));
});

test('the confirmation can be downloaded as a pdf', function () {
    Storage::fake('local');
    $this->post(route('registration.store'), validRegistration());

    $reference = Registration::sole()->reference;

    $this->get(route('registration.pdf'))
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertDownload("inscription-{$reference}.pdf");
});

test('the pdf redirects to the form without a registration', function () {
    $this->get(route('registration.pdf'))
        ->assertRedirect(route('registration.create'));
});

test('the confirmation page redirects to the form without a registration', function () {
    $this->get(route('registration.confirmed'))
        ->assertRedirect(route('registration.create'));
});

test('a phone number can only be registered once', function () {
    Registration::factory()->create(['phone' => '+2250701020304']);

    $this->post(route('registration.store'), validRegistration())
        ->assertSessionHasErrors(['phone' => 'Ce numéro de téléphone est déjà inscrit.']);

    expect(Registration::count())->toBe(1);
});

test('required fields are validated', function () {
    $this->post(route('registration.store'), [])
        ->assertSessionHasErrors(['first_name', 'last_name', 'gender', 'phone', 'city']);
});

test('the gender must be homme or femme', function () {
    $this->post(route('registration.store'), validRegistration(['gender' => 'autre']))
        ->assertSessionHasErrors('gender');
});

test('ticking the Foursquare box fills in the host church', function () {
    $this->post(route('registration.store'), validRegistration([
        'is_foursquare' => '1',
        'church' => 'Autre église',
    ]));

    expect(Registration::sole()->church)->toBe(Registration::HOST_CHURCH);
});

test('a visitor from another church keeps the name they typed', function () {
    $this->post(route('registration.store'), validRegistration(['church' => 'Église Baptiste']));

    expect(Registration::sole()->church)->toBe('Église Baptiste');
});

test('the privacy page shows the contact details', function () {
    config(['event.contact_email' => 'auteldesparfums@studiobeyam.net', 'event.contact_phone' => '07 00 00 00 00']);

    $this->get(route('privacy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('privacy')
            ->where('event.contactEmail', 'auteldesparfums@studiobeyam.net')
            ->where('event.contactPhone', '07 00 00 00 00'));
});

test('the boutique page can be displayed', function () {
    $this->get(route('boutique'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('boutique'));
});

test('the pdf is generated once then served from disk', function () {
    Storage::fake('local');
    $this->post(route('registration.store'), validRegistration());
    $path = 'pdf/inscription-'.Registration::sole()->reference.'.pdf';

    $this->get(route('registration.pdf'))->assertOk();
    Storage::disk('local')->assertExists($path);

    Storage::disk('local')->put($path, 'cached');
    expect($this->get(route('registration.pdf'))->streamedContent())->toBe('cached');
});

test('many people on the same network can register in the same minute', function () {
    foreach (range(1, 15) as $i) {
        $this->post(route('registration.store'), validRegistration([
            'phone' => '+22507000000'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
        ]))->assertRedirect(route('registration.confirmed'));
    }

    expect(Registration::count())->toBe(15);
});

test('the same phone is limited to a few attempts per minute', function () {
    foreach (range(1, 5) as $i) {
        $this->post(route('registration.store'), validRegistration(['first_name' => '']));
    }

    $this->post(route('registration.store'), validRegistration())
        ->assertSessionHasErrors(['phone' => 'Trop de tentatives. Patiente une minute puis réessaie.']);
});
