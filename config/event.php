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

    'theme_reference' => env('EVENT_THEME_REFERENCE', 'Ésaïe 6:3'),

    'starts_at' => env('EVENT_STARTS_AT'),

    'city' => env('EVENT_CITY', 'Abidjan'),

    'venue' => env('EVENT_VENUE'),

    // Affichés sur la page Confidentialité pour l'exercice des droits.
    'contact_email' => env('EVENT_CONTACT_EMAIL', env('MAIL_FROM_ADDRESS')),

    'contact_phone' => env('EVENT_CONTACT_PHONE'),

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
