@php
    // Site public de l'événement (pas l'espace organisateurs) : écran de chargement.
    $isPublicPage = in_array($page['component'], ['welcome', 'privacy', 'boutique'], true)
        || str_starts_with($page['component'], 'registration/');
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico?v=2" sizes="any">
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml">
        <link rel="icon" href="/icon-192.png?v=2" type="image/png" sizes="192x192">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
        <meta name="theme-color" content="#0c0907">

        @fonts

        @if ($isPublicPage)
            <link rel="preload" as="image" href="/image/logo-autel-des-parfums-dark.png">
        @endif

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        @if ($isPublicPage)
            {{-- Écran de chargement : logo au centre, barre qui s'étire du centre vers les côtés. --}}
            <div id="splash" aria-hidden="true">
                <img src="/image/logo-autel-des-parfums-dark.png" alt="" width="600" height="230">
                <div class="splash-track"><div class="splash-bar"></div></div>
            </div>
            <style>
                #splash {
                    position: fixed;
                    inset: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #ffffff;
                    transition: opacity 0.4s ease, visibility 0.4s ease;
                }

                #splash.is-hidden {
                    opacity: 0;
                    visibility: hidden;
                }

                #splash img {
                    width: min(220px, 55vw);
                    height: auto;
                }

                #splash .splash-track {
                    position: absolute;
                    bottom: 56px;
                    left: 50%;
                    width: min(240px, 60vw);
                    height: 3px;
                    overflow: hidden;
                    border-radius: 9999px;
                    background: #eee5dc;
                    transform: translateX(-50%);
                }

                #splash .splash-bar {
                    height: 100%;
                    border-radius: inherit;
                    background: #f9731a;
                    transform-origin: center;
                    animation: splash-spread 1.2s ease-in-out infinite;
                }

                @keyframes splash-spread {
                    0% { transform: scaleX(0); opacity: 1; }
                    70% { transform: scaleX(1); opacity: 1; }
                    100% { transform: scaleX(1); opacity: 0; }
                }

                @media (prefers-reduced-motion: reduce) {
                    #splash .splash-bar { animation: none; opacity: 0.6; }
                }
            </style>
            <script>
                (function () {
                    var shownAt = Date.now();
                    var splash = document.getElementById('splash');

                    function hide() {
                        // Reste visible au moins 600 ms pour ne pas clignoter.
                        setTimeout(function () {
                            splash.classList.add('is-hidden');
                            setTimeout(function () { splash.remove(); }, 500);
                        }, Math.max(0, 600 - (Date.now() - shownAt)));
                    }

                    if (document.readyState === 'complete') {
                        hide();
                    } else {
                        window.addEventListener('load', hide, { once: true });
                        // Filet de sécurité si une ressource ne finit jamais de charger.
                        setTimeout(hide, 8000);
                    }
                })();
            </script>
        @endif
        <x-inertia::app />
    </body>
</html>
