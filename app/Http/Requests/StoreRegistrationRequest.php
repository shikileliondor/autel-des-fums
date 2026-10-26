<?php

namespace App\Http\Requests;

use App\Models\Registration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegistrationRequest extends FormRequest
{
    /**
     * Normalize the phone number before validation, and fill in the host
     * church when the visitor ticked "Je suis de l'Église Foursquare".
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'phone' => preg_replace('/[\s.\-()]/', '', (string) $this->input('phone')),
            'email' => $this->filled('email') ? strtolower(trim((string) $this->input('email'))) : null,
            'church' => $this->boolean('is_foursquare') ? Registration::HOST_CHURCH : $this->input('church'),
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
            'city' => ['required', 'string', 'max:100'],
            'church' => ['nullable', 'string', 'max:150'],
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
            'city' => 'ville / commune',
            'church' => 'église',
        ];
    }
}
