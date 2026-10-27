import { usePage } from '@inertiajs/react';
import { MessageCircle, Phone } from 'lucide-react';
import { whatsappNumber } from '@/components/event/whatsapp-button';
import { cn } from '@/lib/utils';

/**
 * Personnes à contacter en cas de besoin. La liste (numéro d'appel et numéro
 * WhatsApp de chacun) est dans config/event.php, partagée avec le PDF.
 */
export default function ContactPeople({ className }: { className?: string }) {
    const { contacts } = usePage().props.event;

    if (contacts.length === 0) {
        return null;
    }

    return (
        <section
            data-reveal
            className={cn(
                '@container rounded-3xl border border-event-border bg-event-surface/60 p-5 sm:p-8',
                className,
            )}
        >
            <h2 className="text-center text-xl font-extrabold tracking-tight text-event-fg sm:text-2xl">
                En cas de besoin, vous pouvez contacter
            </h2>

            <ul className="mt-6 grid gap-3 @2xl:grid-cols-3">
                {contacts.map((contact) => {
                    const callNumber = whatsappNumber(contact.phone);
                    const chatNumber = whatsappNumber(contact.whatsapp);

                    return (
                        <li
                            key={contact.name}
                            className="rounded-2xl border border-event-border bg-white p-4 text-center"
                        >
                            <p className="font-bold text-event-fg">
                                {contact.name}
                            </p>
                            <p className="mt-1 text-sm text-event-muted tabular-nums">
                                {contact.phone}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <a
                                    href={`tel:+${callNumber}`}
                                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-event-border text-sm font-semibold text-event-fg transition hover:border-event-accent hover:text-event-accent-ink"
                                >
                                    <Phone className="size-4" />
                                    Appeler
                                </a>
                                <a
                                    href={`https://wa.me/${chatNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#25d366] text-sm font-semibold text-white transition hover:brightness-105"
                                >
                                    <MessageCircle className="size-4" />
                                    WhatsApp
                                </a>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
