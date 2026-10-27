<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Inscription {{ $registration->reference }}</title>
    <style>
        @page { margin: 48px; }
        body { font-family: DejaVu Sans, sans-serif; color: #1c1917; font-size: 12px; }
        .brand { font-size: 14px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #ea580c; }
        h1 { font-size: 24px; margin: 32px 0 6px; }
        .muted { color: #78716c; }
        .code { margin: 28px 0; padding: 18px; border: 2px dashed #f97316; text-align: center; }
        .code-label { font-size: 10px; letter-spacing: 3px; color: #78716c; text-transform: uppercase; }
        .code-value { font-family: DejaVu Sans Mono, monospace; font-size: 30px; font-weight: bold; letter-spacing: 4px; margin-top: 6px; }
        .qr { width: 150px; height: 150px; margin-top: 14px; }
        .qr-hint { font-size: 10px; color: #78716c; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; border-bottom: 1px solid #e7e5e4; }
        td.label { width: 35%; color: #78716c; }
        .footer { margin-top: 36px; text-align: center; font-weight: bold; }
        .help { margin-top: 28px; padding: 14px 18px; background: #fbf7f3; border-left: 4px solid #f97316; }
        .help-title { font-weight: bold; margin-bottom: 6px; }
        .help-list td { padding: 4px 0; border-bottom: none; }
        .help-phone { text-align: right; font-weight: bold; }
    </style>
</head>
<body>
    <div style="text-align:center;margin-bottom:24px;"><img src="data:image/jpeg;base64,{{ base64_encode(file_get_contents(public_path('image/logo-pdf.jpg'))) }}" alt="{{ $eventName }}" style="width:240px;"></div>

    <h1>Inscription confirmée</h1>
    <p class="muted">{{ $eventName }}@if ($startsAt) · {{ $startsAt }}@endif @if ($place) · {{ $place }}@endif</p>

    <div class="code">
        <div class="code-label">Code d’inscription</div>
        <div class="code-value">{{ $registration->reference }}</div>
        <img src="{{ $qrCode }}" alt="QR code {{ $registration->reference }}" class="qr">
        <div class="qr-hint">À présenter à l’accueil le jour du programme</div>
    </div>

    <table>
        <tr><td class="label">Nom</td><td>{{ $registration->first_name }} {{ $registration->last_name }}</td></tr>
        <tr><td class="label">Téléphone</td><td>{{ $registration->phone }}</td></tr>
        @if ($registration->email)
            <tr><td class="label">E-mail</td><td>{{ $registration->email }}</td></tr>
        @endif
        @if ($registration->role)
        <tr><td class="label">Fonction / rôle</td><td>{{ $registration->role }}</td></tr>
        @endif
        @if ($registration->church)
            <tr><td class="label">Église</td><td>{{ $registration->church }}</td></tr>
        @endif
        <tr><td class="label">Inscrit le</td><td>{{ $registration->created_at->locale('fr')->translatedFormat('j F Y') }}</td></tr>
    </table>

    @if (count(config('event.contacts')))
        <div class="help">
            <div class="help-title">Un souci ? Besoin de plus d’informations ? Contactez :</div>
            <table class="help-list">
                @foreach (config('event.contacts') as $contact)
                    <tr><td>{{ $contact['name'] }}</td><td class="help-phone">{{ $contact['phone'] }}</td></tr>
                @endforeach
            </table>
        </div>
    @endif

    <p class="footer">Que Dieu te bénisse abondamment et à très bientôt.</p>
</body>
</html>
