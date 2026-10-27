<?php

namespace App\Http\Requests;

use App\Models\Registration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegistrationRequest extends FormRequest
{
    /** Letters (any language, with accents), spaces, apostrophes, hyphens and dots. */
    private const NAME_PATTERN = "regex:/^[\\pL\\pM][\\pL\\pM\\s'’.-]*$/u";

    /**
     * Normalize the input before validation. Host church members only tick a box:
     * their church is filled in, and the category is always derived here, never
     * taken from the visitor.
     */
    protected function prepareForValidation(): void
    {
        $isHostMember = $this->boolean('is_member');
        $church = $isHostMember ? Registration::HOST_CHURCH : (trim((string) $this->input('church')) ?: null);

        $this->merge([
            'phone' => self::normalizePhone((string) $this->input('phone')),
            'email' => $this->filled('email') ? strtolower(trim((string) $this->input('email'))) : null,
            'church' => $church,
            'church_group' => Registration::churchGroupFor($isHostMember, $church),
            'role' => $this->input('role_choice') === 'autre'
                ? (trim((string) $this->input('role_other')) ?: null)
                : ($this->input('role_choice') ?: null),
        ]);
    }

    /**
     * One storage format for every Ivorian number (+225 followed by its 10 digits),
     * so "07 01 02 03 04", "+225 0701020304" and "002250701020304" are the same
     * number for the duplicate check. The form is prefilled with "+225": that alone
     * means no phone was given.
     */
    public static function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D/', '', $phone) ?? '';

        $local = match (true) {
            str_starts_with($digits, '00225') => substr($digits, 5),
            str_starts_with($digits, '225') && strlen($digits) > 10 => substr($digits, 3),
            default => $digits,
        };

        return $local === '' || $local === '225' ? '' : '+225'.$local;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // Letters only: the first name is shown in the confirmation email (Markdown),
            // so symbols like [ ] ( ) * # could otherwise inject links or formatting.
            'first_name' => ['required', 'string', 'max:100', self::NAME_PATTERN],
            'last_name' => ['required', 'string', 'max:100', self::NAME_PATTERN],
            'gender' => ['required', Rule::in(Registration::GENDERS)],
            'phone' => ['required', 'regex:/^\+225[0-9]{10}$/', 'unique:registrations,phone'],
            'email' => ['nullable', 'email', 'max:255'],
            'church' => ['nullable', 'string', 'max:150'],
            'church_group' => ['required', Rule::in(array_keys(Registration::CHURCH_GROUPS))],
            'role_choice' => ['nullable', Rule::in([...Registration::ROLES, 'autre'])],
            'role_other' => ['required_if:role_choice,autre', 'nullable', 'string', 'max:100'],
            'role' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'required' => 'Le champ :attribute est obligatoire.',
            'max' => 'Le champ :attribute ne doit pas dépasser :max caractères.',
            'first_name.regex' => 'Le prénom ne doit contenir que des lettres.',
            'last_name.regex' => 'Le nom ne doit contenir que des lettres.',
            'gender.in' => 'Veuillez choisir Homme ou Femme.',
            'phone.required' => 'Le numéro de téléphone est obligatoire.',
            'phone.regex' => 'Le numéro doit avoir 10 chiffres après +225 (ex. +225 07 01 02 03 04).',
            'phone.unique' => 'Ce numéro de téléphone est déjà inscrit.',
            'email.email' => 'L’adresse e-mail n’est pas valide.',
            'role_choice.in' => 'Choisis une fonction dans la liste.',
            'role_other.required_if' => 'Précise ta fonction.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'first_name' => 'prénom',
            'last_name' => 'nom',
            'gender' => 'sexe',
            'phone' => 'téléphone',
            'email' => 'e-mail',
            'church' => 'église',
            'role' => 'fonction / rôle',
        ];
    }
}
