import React from 'react';

export const COOK_LOGO_ICON_URL = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIHN0cm9rZT0ibm9uZSIgZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0xMCAxNi41bC01IC0zbDUgLTNsNSAzdjUuNWwtNSAzWiIgLz48cGF0aCBkPSJNMT AgOGwtNSAtM2w1IC0zbDUgM2wtNSAzIiAvPjxwYXRoIGQ9Ik0xNSAxMy41djUuNWw1IDMiIC8+PHBhdGggZD0iTTIwIDhsLTUgLTMiIC8+PC9zdmc+`;

const CookLogo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
             <style>
                {`
                    @keyframes bubble-rise {
                        0% {
                            opacity: 0;
                            transform: translateY(0) scale(0.5);
                        }
                        50% {
                            opacity: 0.7;
                        }
                        100% {
                            opacity: 0;
                            transform: translateY(-20px) scale(1);
                        }
                    }
                    .bubble {
                        animation-name: bubble-rise;
                        animation-iteration-count: infinite;
                        animation-timing-function: ease-in-out;
                    }
                `}
            </style>
            <svg className="w-full h-full" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                {/* Bubbles */}
                <g className="text-green-400/50">
                    <circle cx="12" cy="7" r="0.5" className="bubble" style={{ animationDuration: '4s', animationDelay: '0s' }} />
                    <circle cx="11" cy="7" r="0.5" className="bubble" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                    <circle cx="13" cy="7" r="0.5" className="bubble" style={{ animationDuration: '3.5s', animationDelay: '2s' }} />
                </g>
                {/* Logo Paths */}
                <g className="text-green-400">
                    <path d="M10 16.5l-5 -3l5 -3l5 3v5.5l-5 3z" />
                    <path d="M10 8l-5 -3l5 -3l5 3l-5 3" />
                    <path d="M15 13.5v5.5l5 3" />
                    <path d="M20 8l-5 -3" />
                </g>
            </svg>
        </div>
    );
};

export default CookLogo;