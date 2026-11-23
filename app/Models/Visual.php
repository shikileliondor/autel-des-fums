<?php

namespace App\Models;

use Database\Factories\VisualFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * A "J'y serai !" visual shown on the participants wall, sent when its author saved or shared it.
 *
 * Only the finished visual is kept (full size and thumbnail), never the original photo.
 *
 * @property int $id
 * @property string|null $first_name
 * @property string $image_path
 * @property string $thumb_path
 * @property string $token_hash
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['first_name', 'image_path', 'thumb_path', 'token_hash'])]
#[Hidden(['token_hash'])]
class Visual extends Model
{
    /** @use HasFactory<VisualFactory> */
    use HasFactory;

    /** Visuals per page on the wall. */
    public const PER_PAGE = 24;

    /** Files are kept on the private disk and served by the app (no storage link on the hosting). */
    public const DISK = 'local';

    /**
     * Bootstrap the model and its traits.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::deleted(function (Visual $visual) {
            Storage::disk(self::DISK)->delete([$visual->image_path, $visual->thumb_path]);
        });
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public function tokenMatches(?string $token): bool
    {
        return $token !== null && $token !== '' && hash_equals($this->token_hash, self::hashToken($token));
    }

    /**
     * One page of the wall, newest first; `next` is the id to pass as `avant` for the following page.
     *
     * @return array{items: list<array{id: int, name: string|null, thumb: string, image: string}>, next: int|null, total: int}
     */
    public static function wall(?int $before = null): array
    {
        $visuals = static::query()
            ->when($before, fn ($query) => $query->where('id', '<', $before))
            ->orderByDesc('id')
            ->limit(self::PER_PAGE + 1)
            ->get();

        $hasMore = $visuals->count() > self::PER_PAGE;
        $visuals = $visuals->take(self::PER_PAGE);

        return [
            'items' => array_values($visuals->map(fn (Visual $visual) => $visual->toWallItem())->all()),
            'next' => $hasMore ? $visuals->last()?->id : null,
            'total' => static::count(),
        ];
    }

    /**
     * Every visual of the wall for the slideshow, newest first (capped so the list stays light).
     *
     * @return list<array{id: int, name: string|null, thumb: string, image: string}>
     */
    public static function reel(int $limit = 500): array
    {
        return array_values(static::query()
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (Visual $visual) => $visual->toWallItem())
            ->all());
    }

    /**
     * @return array{id: int, name: string|null, thumb: string, image: string}
     */
    public function toWallItem(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->first_name,
            'thumb' => route('visuals.image', ['visual' => $this->id, 'size' => 'petit']),
            'image' => route('visuals.image', ['visual' => $this->id, 'size' => 'grand']),
        ];
    }
}
