import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function AppLogoIcon({
    className,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/icon-192.png?v=2"
            alt="L’Autel des Parfums"
            {...props}
            className={cn('rounded-md object-contain', className)}
        />
    );
}
