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
        'church' => null,
        'role' => null,
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
            ->where('registration.firstName', 'Ange')
            ->where('registration.rank', 1));
});

test('the confirmation tells registrants their rank', function () {
    Registration::factory()->count(151)->create();

    $this->post(route('registration.store'), validRegistration());

    $this->get(route('registration.confirmed'))
        ->assertInertia(fn (Assert $page) => $page->where('registration.rank', 152));
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
        ->assertSessionHasErrors(['first_name', 'last_name', 'gender', 'phone']);
});

test('the gender must be homme or femme', function () {
    $this->post(route('registration.store'), validRegistration(['gender' => 'autre']))
        ->assertSessionHasErrors('gender');
});

test('a member of the host church only ticks the box', function () {
    $this->post(route('registration.store'), validRegistration([
        'is_member' => '1',
        'church' => 'Autre église',
    ]));

    expect(Registration::sole())
        ->church_group->toBe(Registration::GROUP_HOST)
        ->church->toBe(Registration::HOST_CHURCH);
});

test('another Foursquare assembly is recognised from the church name', function () {
    $this->post(route('registration.store'), validRegistration(['church' => 'Foursquare Sideci']));

    expect(Registration::sole())
        ->church_group->toBe(Registration::GROUP_FOURSQUARE)
        ->church->toBe('Foursquare Sideci');
});

test('other visitors keep the church they typed, or none', function () {
    $this->post(route('registration.store'), validRegistration(['church' => 'Église Baptiste']));
    $this->post(route('registration.store'), validRegistration(['phone' => '+2250102030405']));

    expect(Registration::pluck('church_group')->unique()->all())->toBe([Registration::GROUP_GUEST])
        ->and(Registration::pluck('church')->all())->toContain('Église Baptiste', null);
});

test('the category cannot be forced by the visitor', function () {
    $this->post(route('registration.store'), validRegistration([
        'church_group' => Registration::GROUP_HOST,
        'church' => 'Église Baptiste',
    ]));

    expect(Registration::sole()->church_group)->toBe(Registration::GROUP_GUEST);
});

test('the role is picked from the list, and is optional', function () {
    $this->post(route('registration.store'), validRegistration(['role_choice' => 'Chantre']));
    $this->post(route('registration.store'), validRegistration(['phone' => '+2250102030405']));

    expect(Registration::pluck('role')->all())->toBe(['Chantre', null]);
});

test('another role is typed under Autre', function () {
    $this->post(route('registration.store'), validRegistration(['role_choice' => 'autre', 'role_other' => '']))
        ->assertSessionHasErrors(['role_other' => 'Précise ta fonction.']);

    $this->post(route('registration.store'), validRegistration(['role_choice' => 'autre', 'role_other' => '  Protocole ']));

    expect(Registration::sole()->role)->toBe('Protocole');
});

test('a role outside the list is refused', function () {
    $this->post(route('registration.store'), validRegistration(['role_choice' => 'Pasteur principal']))
        ->assertSessionHasErrors(['role_choice' => 'Choisis une fonction dans la liste.']);
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
    $path = 'pdf/v3/inscription-'.Registration::sole()->reference.'.pdf';

    $this->get(route('registration.pdf'))->assertOk();
    Storage::disk('local')->assertExists($path);

    Storage::disk('local')->put($path, 'cached');
    expect($this->get(route('registration.pdf'))->streamedContent())->toBe('cached');
});

test('many people on the same network can register in the same minute', function () {
    foreach (range(1, 15) as $i) {
        $this->post(route('registration.store'), validRegistration([
            'phone' => '+22507000000'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
            'email' => "personne{$i}@example.com",
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

test('the phone is required, the +225 prefix alone does not count', function () {
    foreach (['', '+225', '+225 '] as $phone) {
        $this->post(route('registration.store'), validRegistration(['phone' => $phone]))
            ->assertSessionHasErrors(['phone' => 'Le numéro de téléphone est obligatoire.']);
    }

    expect(Registration::count())->toBe(0);
});

test('names cannot carry markdown or html into the confirmation email', function (string $name) {
    $this->post(route('registration.store'), validRegistration(['first_name' => $name]))
        ->assertSessionHasErrors(['first_name' => 'Le prénom ne doit contenir que des lettres.']);

    expect(Registration::count())->toBe(0);
})->with([
    'markdown link' => '[Gagne un prix](https://piege.example)',
    'html' => '<script>alert(1)</script>',
    'formula' => '=HYPERLINK("https://piege.example")',
    'heading' => '# Urgent',
]);

test('real names with accents, hyphens and apostrophes are accepted', function () {
    $this->post(route('registration.store'), validRegistration([
        'first_name' => 'Marie-Ève',
        'last_name' => 'N’Guessan Koffi',
    ]))->assertRedirect(route('registration.confirmed'));
});

test('one email address cannot be used to flood a mailbox', function () {
    foreach (range(1, 10) as $i) {
        $this->post(route('registration.store'), validRegistration([
            'phone' => '+22507000001'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
            'email' => 'victime@example.com',
        ]));
    }

    $this->post(route('registration.store'), validRegistration([
        'phone' => '+2250700000199',
        'email' => 'victime@example.com',
    ]))->assertSessionHasErrors('email');

    expect(Registration::where('email', 'victime@example.com')->count())->toBe(10);
});

test('the phone must have exactly 10 digits after +225', function (string $phone) {
    $this->post(route('registration.store'), validRegistration(['phone' => $phone]))
        ->assertSessionHasErrors(['phone' => 'Le numéro doit avoir 10 chiffres après +225 (ex. +225 07 01 02 03 04).']);
})->with([
    '9 digits' => '+225 07 01 02 03 0',
    '11 digits' => '+225 07 01 02 03 04 5',
    'letters' => '+225 07 AB CD EF GH',
]);

test('every way of writing a number is stored the same way', function (string $phone) {
    $this->post(route('registration.store'), validRegistration(['phone' => $phone]));

    expect(Registration::sole()->phone)->toBe('+2250701020304');
})->with(['+225 07 01 02 03 04', '0701020304', '07.01.02.03.04', '00225 07 01 02 03 04', '225 0701020304']);

test('the same number written differently is still a duplicate', function () {
    $this->post(route('registration.store'), validRegistration(['phone' => '+225 07 01 02 03 04']));

    $this->post(route('registration.store'), validRegistration(['phone' => '07.01.02.03.04', 'email' => 'autre@example.com']))
        ->assertSessionHasErrors(['phone' => 'Ce numéro de téléphone est déjà inscrit.']);

    expect(Registration::count())->toBe(1);
});

test('the qr code page shows the registrant without private details', function () {
    $registration = Registration::factory()->create([
        'first_name' => 'Ange',
        'last_name' => 'Kouassi',
        'phone' => '+2250701020304',
        'email' => 'ange@example.com',
    ]);

    $this->get(route('registration.show', $registration))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('registration/show')
            ->where('registration.reference', $registration->reference)
            ->where('registration.name', 'Ange Kouassi')
            ->where('registration.checkedIn', false)
            ->missing('registration.phone')
            ->missing('registration.email'));
});

test('the qr code page is a 404 for an unknown code', function () {
    $this->get('/inscrit/ADP-ZZZZZZ')->assertNotFound();
});
