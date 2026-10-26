<x-mail::message>
<div style="text-align:center;margin-bottom:24px;">
<img src="{{ isset($message) ? $message->embed(public_path('image/logo-email.png')) : asset('image/logo-email.png') }}" alt="{{ $eventName }}" width="280" style="max-width:100%;height:auto;">
</div>

# Inscription confirmée

Bonjour {{ $registration->first_name }},

Ton inscription à **{{ $eventName }}** est bien enregistrée. Garde précieusement ton code d’inscription :

<x-mail::panel>
<div style="text-align:center;font-size:24px;font-weight:bold;letter-spacing:3px;">{{ $registration->reference }}</div>
</x-mail::panel>

@if ($startsAt)
**Quand :** {{ ucfirst($startsAt) }}<br>
@endif
**Où :** {{ $place }}

<x-mail::button :url="url('/')">
Voir le programme
</x-mail::button>

Que Dieu te bénisse abondamment et à très bientôt.

{{ $eventName }}
</x-mail::message>
