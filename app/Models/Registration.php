<?php

namespace App\Models;

use Database\Factories\RegistrationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $reference
 * @property string $first_name
 * @property string $last_name
 * @property string $gender
 * @property string $phone
 * @property string|null $email
 * @property string $city
 * @property string|null $church
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['first_name', 'last_name', 'gender', 'phone', 'email', 'city', 'church'])]
class Registration extends Model
{
    /** @use HasFactory<RegistrationFactory> */
    use HasFactory;

    public const GENDERS = ['homme', 'femme'];

    public const HOST_CHURCH = 'Église Foursquare Niangon Révélation';

    /**
     * Bootstrap the model and its traits.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Registration $registration) {
            if (empty($registration->reference)) {
                $registration->reference = static::generateReference();
            }
        });
    }

    /**
     * Generate a unique, human-friendly registration reference.
     */
    public static function generateReference(): string
    {
        do {
            $reference = 'ADP-'.Str::upper(Str::random(6));
        } while (static::where('reference', $reference)->exists());

        return $reference;
    }

    /**
     * Summary counts shown on the dashboard and the registrations list.
     *
     * @return array{total: int, today: int, men: int, women: int}
     */
    public static function stats(): array
    {
        return [
            'total' => static::count(),
            'today' => static::whereDate('created_at', today())->count(),
            'men' => static::where('gender', 'homme')->count(),
            'women' => static::where('gender', 'femme')->count(),
        ];
    }

    /**
     * Filter registrations by name, phone, email, city, church or reference.
     *
     * @param  Builder<Registration>  $query
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        if (blank($term)) {
            return;
        }

        $like = '%'.$term.'%';

        $query->where(fn (Builder $query) => $query
            ->where('reference', 'like', $like)
            ->orWhere('first_name', 'like', $like)
            ->orWhere('last_name', 'like', $like)
            ->orWhere('phone', 'like', $like)
            ->orWhere('email', 'like', $like)
            ->orWhere('city', 'like', $like)
            ->orWhere('church', 'like', $like));
    }
}
