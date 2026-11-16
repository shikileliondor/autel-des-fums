<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVisualRequest extends FormRequest
{
    /** Sizes the page exports: anything else did not come from the visual maker. */
    public const IMAGE_SIZE = [720, 1280];

    public const THUMB_SIZE = [360, 640];

    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => trim((string) $this->input('first_name')) ?: null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        [$width, $height] = self::IMAGE_SIZE;
        [$thumbWidth, $thumbHeight] = self::THUMB_SIZE;

        return [
            'image' => ['required', 'file', 'mimes:jpg,jpeg', 'max:1024', "dimensions:width={$width},height={$height}"],
            'thumb' => ['required', 'file', 'mimes:jpg,jpeg', 'max:300', "dimensions:width={$thumbWidth},height={$thumbHeight}"],
            'first_name' => ['nullable', 'string', 'max:20'],
            // Publishing again from the same device replaces the previous visual.
            'replaces' => ['nullable', 'integer'],
            'replaces_token' => ['nullable', 'string', 'max:100'],
        ];
    }
}
