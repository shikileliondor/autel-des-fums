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
 * @property string|null $city
 * @property string|null $church
 * @property string $church_group
 * @property string|null $role
 * @property Carbon|null $checked_in_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['first_name', 'last_name', 'gender', 'phone', 'email', 'city', 'church', 'church_group', 'role'])]
class Registration extends Model
{
    /** @use HasFactory<RegistrationFactory> */
    use HasFactory;

    public const GENDERS = ['homme', 'femme'];

    public const HOST_CHURCH = 'Église Foursquare Niangon Révélation';

    /** Members of the host church. */
    public const GROUP_HOST = 'revelation';

    /** Members of another Foursquare assembly. */
    public const GROUP_FOURSQUARE = 'foursquare';

    /** Everyone else (other churches or none). */
    public const GROUP_GUEST = 'invite';

    /**
     * Category of a registrant: host church members tick a box, the others type their
     * church, and a name mentioning Foursquare counts as another Foursquare assembly.
     */
    public static function churchGroupFor(bool $isHostMember, ?string $church): string
    {
        return match (true) {
            $isHostMember => self::GROUP_HOST,
            str_contains(mb_strtolower((string) $church), 'foursquare') => self::GROUP_FOURSQUARE,
            default => self::GROUP_GUEST,
        };
    }

    /** Roles offered on the form; anything else typed under "Autre" is kept as is. */
    public const ROLES = ['Chantre', 'Commando', 'Service d’ordre', 'Intercession', 'Communication', 'Comité d’organisation', 'Pasteur'];

    /** @var array<string, string> Church groups and their labels, in display order. */
    public const CHURCH_GROUPS = [
        self::GROUP_HOST => 'Foursquare Révélation',
        self::GROUP_FOURSQUARE => 'Autre Foursquare',
        self::GROUP_GUEST => 'Autres églises',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
        ];
    }

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
     * @return array{total: int, today: int, men: int, women: int, groups: list<array{key: string, label: string, count: int}>, roles: list<array{label: string, count: int}>}
     */
    public static function stats(): array
    {
        $byGroup = static::query()
            ->selectRaw('church_group, COUNT(*) as aggregate')
            ->groupBy('church_group')
            ->pluck('aggregate', 'church_group');

        $byRole = static::query()
            ->whereNotNull('role')
            ->selectRaw('role, COUNT(*) as aggregate')
            ->groupBy('role')
            ->pluck('aggregate', 'role');

        $roles = array_map(fn (string $role) => [
            'label' => $role,
            'count' => (int) ($byRole[$role] ?? 0),
        ], self::ROLES);

        // Roles typed under "Autre" are grouped together; their names are in the list and export.
        $roles[] = [
            'label' => 'Autre',
            'count' => (int) $byRole->except(self::ROLES)->sum(),
        ];

        return [
            'total' => static::count(),
            'today' => static::whereDate('created_at', today())->count(),
            'men' => static::where('gender', 'homme')->count(),
            'women' => static::where('gender', 'femme')->count(),
            'groups' => array_map(fn (string $key) => [
                'key' => $key,
                'label' => self::CHURCH_GROUPS[$key],
                'count' => (int) ($byGroup[$key] ?? 0),
            ], array_keys(self::CHURCH_GROUPS)),
            'roles' => $roles,
        ];
    }

    /**
     * Filter registrations by name, phone, email, city, church, role or reference.
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
            ->orWhere('role', 'like', $like)
            ->orWhere('church', 'like', $like));
    }
}
