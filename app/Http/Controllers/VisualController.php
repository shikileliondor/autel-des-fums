<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVisualRequest;
use App\Models\Visual;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * "J'y serai !" page and its participants wall.
 *
 * The visual is drawn in the browser. When its author saves or shares it, the
 * finished visual is sent to show on the participants wall, never the photo.
 */
class VisualController extends Controller
{
    /**
     * Show the visual maker, with the first page of the wall.
     */
    public function show(): Response
    {
        return Inertia::render('visual', [
            'wall' => Visual::wall(),
        ]);
    }

    /**
     * Next page of the wall ("Voir plus").
     */
    public function index(Request $request): JsonResponse
    {
        $before = $request->integer('avant') ?: null;

        return response()->json(Visual::wall($before));
    }

    /**
     * All the visuals of the wall, for the slideshow played above it.
     */
    public function reel(): JsonResponse
    {
        return response()->json(['items' => Visual::reel()]);
    }

    /**
     * Put a visual on the wall. The removal code is returned once and only its hash is kept.
     */
    public function store(StoreVisualRequest $request): JsonResponse
    {
        $name = Str::uuid()->toString();
        $disk = Storage::disk(Visual::DISK);
        $imagePath = "visuels/{$name}.jpg";
        $thumbPath = "visuels/{$name}-petit.jpg";

        $disk->putFileAs('visuels', $request->file('image'), "{$name}.jpg");
        $disk->putFileAs('visuels', $request->file('thumb'), "{$name}-petit.jpg");

        $token = Str::random(40);

        $visual = Visual::create([
            'first_name' => $request->validated('first_name'),
            'image_path' => $imagePath,
            'thumb_path' => $thumbPath,
            'token_hash' => Visual::hashToken($token),
        ]);

        // Changed their visual and published it again: the new one takes the old one's place.
        $previous = Visual::find($request->integer('replaces'));
        $replaced = null;

        if ($previous?->tokenMatches($request->string('replaces_token')->value())) {
            $replaced = $previous->id;
            $previous->delete();
        }

        return response()->json([
            'visual' => $visual->toWallItem(),
            'token' => $token,
            'replaced' => $replaced,
        ], 201);
    }

    /**
     * Serve a wall image. The files never change, so browsers can keep them.
     */
    public function image(Visual $visual, string $size): StreamedResponse
    {
        $path = $size === 'petit' ? $visual->thumb_path : $visual->image_path;

        abort_unless(Storage::disk(Visual::DISK)->exists($path), 404);

        return Storage::disk(Visual::DISK)->response($path, null, [
            'Content-Type' => 'image/jpeg',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Remove a visual: by its author (with the removal code kept on their device) or by an admin.
     */
    public function destroy(Request $request, Visual $visual): HttpResponse
    {
        abort_unless(
            $visual->tokenMatches($request->string('token')->value())
                || $request->user()?->can('manage-registrations'),
            403,
        );

        $visual->delete();

        return response()->noContent();
    }
}
