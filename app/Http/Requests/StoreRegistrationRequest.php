<?php

namespace App\Http\Requests;

use App\Models\Registration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegistrationRequest extends FormRequest
{
    /**
     * Normalize the input before validation. Host church members only tick a box:
     * their church is filled in, and the category is always derived here, never
     * taken from the visitor.
     */
    protected function prepareForValidation(): void
    {
        $isHostMember = $this->boolean('is_member');
        $church = $isHostMember ? Registration::HOST_CHURCH : (trim((string) $this->input('church')) ?: null);

        $phone = preg_replace('/[\s.\-()]/', '', (string) $this->input('phone'));

        $this->merge([
            // The form is prefilled with "+225": that alone means no phone was given.
            'phone' => in_array($phone, ['+225', '225', '+'], true) ? '' : $phone,
            'email' => $this->filled('email') ? strtolower(trim((string) $this->input('email'))) : null,
            'church' => $church,
            'church_group' => Registration::churchGroupFor($isHostMember, $church),
            'role' => trim((string) $this->input('role')) ?: null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'gender' => ['required', Rule::in(Registration::GENDERS)],
            'phone' => ['required', 'regex:/^\+?[0-9]{8,15}$/', 'unique:registrations,phone'],
            'email' => ['nullable', 'email', 'max:255'],
            'church' => ['nullable', 'string', 'max:150'],
            'church_group' => ['required', Rule::in(array_keys(Registration::CHURCH_GROUPS))],
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
            'gender.in' => 'Veuillez choisir Homme ou Femme.',
            'phone.required' => 'Le numéro de téléphone est obligatoire.',
            'phone.regex' => 'Le numéro de téléphone n’est pas valide.',
            'phone.unique' => 'Ce numéro de téléphone est déjà inscrit.',
            'email.email' => 'L’adresse e-mail n’est pas valide.',
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
