<?php

namespace App\Mail;

use App\Models\Registration;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class RegistrationConfirmed extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(public Registration $registration)
    {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address(config('mail.from.address'), config('mail.from.name'))],
            subject: 'Ton inscription à '.config('event.name').' est confirmée',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'mail.registration-confirmed',
            with: [
                'eventName' => config('event.name'),
                'startsAt' => config('event.starts_at')
                    ? Str::ucfirst(Carbon::parse(config('event.starts_at'))->settings(['locale' => 'fr'])->translatedFormat(
                        str_contains(config('event.starts_at'), ':') ? 'l j F Y \à H\hi' : 'l j F Y'
                    ))
                    : null,
                'place' => collect([config('event.venue'), config('event.city')])->filter()->implode(', '),
            ],
        );
    }
}
