<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Programme d'adoration
    |--------------------------------------------------------------------------
    |
    | Informations publiques de l'événement affichées sur le site. Elles sont
    | partagées avec toutes les pages Inertia via HandleInertiaRequests.
    |
    */

    'name' => env('EVENT_NAME', "L'Autel des Parfums"),

    'tagline' => env('EVENT_TAGLINE', "Un programme d'adoration"),

    'theme' => env('EVENT_THEME', "Saint, saint, saint est l'Éternel"),

    'theme_reference' => env('EVENT_THEME_REFERENCE'),

    'starts_at' => env('EVENT_STARTS_AT', '2026-11-29'),

    'city' => env('EVENT_CITY', 'Abidjan'),

    'venue' => env('EVENT_VENUE', 'Yopougon Maroc, rue S2'),

    // Affichés sur la page Confidentialité pour l'exercice des droits.
    'contact_email' => env('EVENT_CONTACT_EMAIL', env('MAIL_FROM_ADDRESS')),

    // Single number for WhatsApp and calls. WhatsApp knows it by its old 8-digit form
    // (before the 2021 switch to 10 digits). "?:" also covers an empty value in .env.
    'contact_phone' => env('EVENT_CONTACT_PHONE') ?: '+225 79 17 79 48',

    /*
    | People to contact in case of need, shown on the site and in the PDF.
    | "phone" is displayed and called; "whatsapp" is the number as WhatsApp knows
    | it: an account created before 2021 may still use the old 8-digit form
    | (the 10-digit number without its first 2 digits). This can't be detected
    | automatically: check each one by opening its wa.me link.
    */
    'contacts' => [
        ['name' => 'Ephraim Yessoh', 'phone' => '+225 07 79 17 79 48', 'whatsapp' => '+225 79 17 79 48'],
        ['name' => 'Morel Effobi', 'phone' => '+225 01 43 09 99 59', 'whatsapp' => '+225 01 43 09 99 59'],
        ['name' => 'Brice Dje', 'phone' => '+225 05 96 51 79 82', 'whatsapp' => '+225 05 96 51 79 82'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Administrateurs
    |--------------------------------------------------------------------------
    |
    | Adresses e-mail (séparées par des virgules) des comptes autorisés à
    | consulter et exporter la liste des inscrits.
    |
    */

    'admin_emails' => array_filter(array_map(
        fn (string $email) => strtolower(trim($email)),
        explode(',', (string) env('EVENT_ADMIN_EMAILS', '')),
    )),

];
