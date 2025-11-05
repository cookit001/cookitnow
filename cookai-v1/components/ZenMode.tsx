import React, { useState, useEffect, useRef } from 'react';
import type { Recipe } from '../types';

interface ZenModeProps {
    recipe: Recipe;
    initialStep?: number;
    onClose: () => void;
}

const SOUNDS = {
    chop: new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_2499cbf018.mp3'),
    sizzle: new Audio('https://cdn.pixabay.com/audio/2021/10/05/audio_165a25b290.mp3'),
    boil: new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_a21a59cc86.mp3'),
};

Object.values(SOUNDS).forEach(sound => {
    sound.loop = true;
    sound.volume = 0; // Start muted, will fade in
});

const KEYWORDS: Record<keyof typeof SOUNDS, string[]> = {
    chop: ['chop', 'slice', 'dice', 'mince', 'cut'],
    sizzle: ['sauté', 'fry', 'sear', 'pan-fry', 'brown'],
    boil: ['boil', 'simmer', 'poach', 'blanch', 'stew'],
};

const ZenMode: React.FC<ZenModeProps> = ({ recipe, initialStep = 0, onClose }) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const touchStartRef = useRef<number | null>(null);
    const activeSoundRef = useRef<HTMLAudioElement | null>(null);

    // Audio fade utility
    const fadeAudio = (audio: HTMLAudioElement, targetVolume: number, duration: number = 500) => {
        const startVolume = audio.volume;
        const startTime = Date.now();

        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            audio.volume = startVolume + (targetVolume - startVolume) * progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (targetVolume === 0) {
                audio.pause();
            }
        };
        
        if (targetVolume > 0 && audio.paused) {
            audio.play().catch(e => console.error("Audio play failed:", e));
        }
        animate();
    };

    useEffect(() => {
        localStorage.setItem(`cooking_step_${recipe.title}`, currentStep.toString());

        const instruction = recipe.instructions[currentStep].toLowerCase();
        let soundToPlay: HTMLAudioElement | null = null;

        for (const [soundKey, keywords] of Object.entries(KEYWORDS)) {
            if (keywords.some(keyword => instruction.includes(keyword))) {
                soundToPlay = SOUNDS[soundKey as keyof typeof SOUNDS];
                break;
            }
        }

        if (activeSoundRef.current && activeSoundRef.current !== soundToPlay) {
            fadeAudio(activeSoundRef.current, 0);
        }

        if (soundToPlay && soundToPlay !== activeSoundRef.current) {
            fadeAudio(soundToPlay, 0.3); // Fade in to a subtle volume
        }
        
        activeSoundRef.current = soundToPlay;

    }, [currentStep, recipe.title, recipe.instructions]);

    // Cleanup audio on component unmount
    useEffect(() => {
        return () => {
            Object.values(SOUNDS).forEach(sound => {
                sound.pause();
                sound.currentTime = 0;
            });
        };
    }, []);

    const handleNext = () => {
        if (currentStep < recipe.instructions.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };
    
    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    // Swipe gesture handling
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartRef.current = e.targetTouches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (touchStartRef.current === null) return;
        const touchEnd = e.targetTouches[0].clientX;
        const distance = touchStartRef.current - touchEnd;
        const isLeftSwipe = distance > 50;  // min swipe distance
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            handleNext();
            touchStartRef.current = null; // reset after swipe
        }
        if (isRightSwipe) {
            handlePrev();
            touchStartRef.current = null; // reset after swipe
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-900 z-50 flex flex-col p-4 sm:p-8 animate-bg-pulse" 
            role="dialog" 
            aria-modal="true"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
        >
            <header className="flex-shrink-0 flex items-center justify-between text-white pb-4">
                <h2 className="text-lg font-bold truncate">{recipe.title}</h2>
                <button onClick={onClose} className="text-3xl font-light hover:text-gray-400">&times;</button>
            </header>

            <main className="flex-grow flex flex-col justify-center items-center text-center text-white relative">
                <p className="text-3xl sm:text-5xl font-light max-w-4xl leading-relaxed animate-fade-in" key={currentStep}>
                    {recipe.instructions[currentStep]}
                </p>
                {/* Navigation hints for desktop */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:block">
                     <button onClick={handlePrev} disabled={currentStep === 0} className="p-4 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                     </button>
                </div>
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:block">
                     <button onClick={handleNext} disabled={currentStep >= recipe.instructions.length - 1} className="p-4 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </main>

            <footer className="flex-shrink-0 flex items-center justify-center gap-4 text-white">
                 <p className="text-base font-semibold text-gray-400">
                    Step {currentStep + 1} / {recipe.instructions.length}
                </p>
            </footer>
        </div>
    );
};

export default ZenMode;