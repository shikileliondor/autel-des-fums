<?php

use App\Models\User;
use App\Models\Visual;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Storage::fake(Visual::DISK);
});

/**
 * @return array<string, mixed>
 */
function wallUpload(array $overrides = []): array
{
    return [
        'image' => UploadedFile::fake()->image('visuel.jpg', 720, 1280),
        'thumb' => UploadedFile::fake()->image('visuel-petit.jpg', 360, 640),
        'first_name' => 'Ange',
        ...$overrides,
    ];
}

test('the visual page shows the newest visuals of the wall', function () {
    $visuals = Visual::factory()->count(3)->create();

    $this->get(route('visual'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('visual')
            ->where('wall.total', 3)
            ->where('wall.next', null)
            ->where('wall.items.0.id', $visuals->last()->id)
            ->missing('wall.items.0.token_hash'));
});

test('the wall is paginated', function () {
    $visuals = Visual::factory()->count(Visual::PER_PAGE + 2)->create();

    $first = $this->get(route('visual'))->inertiaProps('wall');

    expect($first['items'])->toHaveCount(Visual::PER_PAGE)
        ->and($first['next'])->toBe($visuals[2]->id);

    $this->getJson(route('visuals.index', ['avant' => $first['next']]))
        ->assertOk()
        ->assertJsonCount(2, 'items')
        ->assertJsonPath('items.0.id', $visuals[1]->id)
        ->assertJsonPath('next', null);
});

test('a visitor can put their visual on the wall', function () {
    $response = $this->postJson(route('visuals.store'), wallUpload())
        ->assertCreated()
        ->assertJsonPath('visual.name', 'Ange');

    $visual = Visual::sole();

    expect($response->json('visual.id'))->toBe($visual->id)
        ->and($visual->tokenMatches($response->json('token')))->toBeTrue();

    Storage::disk(Visual::DISK)->assertExists([$visual->image_path, $visual->thumb_path]);
});

test('only visuals from the maker are accepted', function (array $overrides, string $field) {
    $this->postJson(route('visuals.store'), wallUpload($overrides))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);

    expect(Visual::count())->toBe(0);
})->with([
    'missing image' => [['image' => null], 'image'],
    'wrong size' => [['image' => UploadedFile::fake()->image('visuel.jpg', 1080, 1920)], 'image'],
    'not a jpeg' => [['image' => UploadedFile::fake()->image('visuel.png', 720, 1280)], 'image'],
    'not an image' => [['thumb' => UploadedFile::fake()->create('visuel.jpg', 10, 'text/plain')], 'thumb'],
    'name too long' => [['first_name' => str_repeat('a', 21)], 'first_name'],
]);

test('publishing again from the same device replaces the previous visual', function () {
    $first = $this->postJson(route('visuals.store'), wallUpload());
    $old = Visual::sole();

    $this->postJson(route('visuals.store'), wallUpload([
        'replaces' => $first->json('visual.id'),
        'replaces_token' => $first->json('token'),
    ]))
        ->assertCreated()
        ->assertJsonPath('replaced', $old->id);

    expect(Visual::count())->toBe(1)
        ->and(Visual::sole()->id)->not->toBe($old->id);

    Storage::disk(Visual::DISK)->assertMissing([$old->image_path, $old->thumb_path]);
});

test('another visual cannot be replaced without its removal code', function () {
    $other = Visual::factory()->create();

    $this->postJson(route('visuals.store'), wallUpload([
        'replaces' => $other->id,
        'replaces_token' => 'wrong',
    ]))
        ->assertCreated()
        ->assertJsonPath('replaced', null);

    expect(Visual::count())->toBe(2);
});

test('the wall images are served', function () {
    $this->postJson(route('visuals.store'), wallUpload());
    $visual = Visual::sole();

    $this->get(route('visuals.image', ['visual' => $visual, 'size' => 'petit']))
        ->assertOk()
        ->assertHeader('Content-Type', 'image/jpeg');

    $this->get(route('visuals.image', ['visual' => $visual, 'size' => 'grand']))
        ->assertOk();
});

test('the author can remove their visual with its removal code', function () {
    $response = $this->postJson(route('visuals.store'), wallUpload());
    $visual = Visual::sole();

    $this->deleteJson(route('visuals.destroy', $visual), ['token' => 'wrong'])
        ->assertForbidden();

    $this->deleteJson(route('visuals.destroy', $visual), ['token' => $response->json('token')])
        ->assertNoContent();

    expect(Visual::count())->toBe(0);
    Storage::disk(Visual::DISK)->assertMissing([$visual->image_path, $visual->thumb_path]);
});

test('admins can remove any visual, other users cannot', function () {
    config(['event.admin_emails' => ['admin@example.com']]);
    $visual = Visual::factory()->create();

    $this->actingAs(User::factory()->create())
        ->deleteJson(route('visuals.destroy', $visual))
        ->assertForbidden();

    $this->actingAs(User::factory()->create(['email' => 'admin@example.com']))
        ->deleteJson(route('visuals.destroy', $visual))
        ->assertNoContent();

    expect(Visual::count())->toBe(0);
});
