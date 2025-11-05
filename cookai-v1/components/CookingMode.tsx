import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Recipe } from '../types';

const SpeakerIcon: React.FC<{isSpeaking: boolean}> = ({ isSpeaking }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isSpeaking ? 'scale-110' : 'scale-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        {isSpeaking && <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728" />}
    </svg>
);

const Timer: React.FC<{ initialSeconds: number; onFinish: () => void }> = ({ initialSeconds, onFinish }) => {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        let interval: number | null = null;
        if (isActive && seconds > 0) {
            interval = window.setInterval(() => {
                setSeconds(s => s - 1);
            }, 1000);
        } else if (seconds === 0) {
            onFinish();
            setIsActive(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, seconds, onFinish]);

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const secs = time % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-full shadow-lg font-mono text-lg animate-fade-in">
            {formatTime(seconds)}
        </div>
    );
};


interface CookingModeProps {
    recipe: Recipe;
    initialStep?: number;
    onClose: () => void;
}

const CookingMode: React.FC<CookingModeProps> = ({ recipe, initialStep = 0, onClose }) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [checkedSteps, setCheckedSteps] = useState<boolean[]>(() => Array(recipe.instructions.length).fill(false));
    const [showIngredients, setShowIngredients] = useState(false);
    const [activeTimer, setActiveTimer] = useState<number | null>(null);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const stepListRef = useRef<HTMLUListElement>(null);

    const speak = (text: string, isContinuation = false) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel(); 
        
        const intro = currentStep === 0 && !isContinuation ? `Let's cook ${recipe.title}. ` : isContinuation ? '' : 'Next, ';
        const fullText = `${intro}Step ${currentStep + 1}. ${text}`;

        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        speak(recipe.instructions[currentStep]);
        localStorage.setItem(`cooking_step_${recipe.title}`, currentStep.toString());
        
        const currentStepElement = stepListRef.current?.children[currentStep] as HTMLLIElement;
        currentStepElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        return () => window.speechSynthesis.cancel();
    }, [currentStep]);

    const handleNext = () => {
        setCheckedSteps(prev => {
            const newChecked = [...prev];
            newChecked[currentStep] = true;
            return newChecked;
        });
        if (currentStep < recipe.instructions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
             speak("You're all done! Enjoy your meal.", true);
        }
    };
    
    const handlePrev = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1);
    };

    const handleStepSelect = (index: number) => {
        setCurrentStep(index);
    };
    
    const toggleChecked = (index: number) => {
        setCheckedSteps(prev => {
            const newChecked = [...prev];
            newChecked[index] = !newChecked[index];
            return newChecked;
        });
    };

    const handleTimerClick = (minutes: number) => {
        setActiveTimer(Date.now() + minutes * 60);
    };

    const renderInstruction = (text: string) => {
        const timerRegex = /(\d+)\s*minutes?/gi;
        const parts = text.split(timerRegex);
        return (
            <span>
                {parts.map((part, index) => {
                    if (index % 2 === 1) { // This is the number part
                        const minutes = parseInt(part, 10);
                        return (
                            <button key={index} onClick={() => handleTimerClick(minutes)} className="bg-green-800/50 text-green-300 font-bold px-2 py-1 rounded-md mx-1 hover:bg-green-700 transition">
                                {`${part} minutes`}
                            </button>
                        );
                    }
                    return part;
                })}
            </span>
        );
    };

    const progressPercentage = useMemo(() => {
        const completed = checkedSteps.filter(Boolean).length;
        return (completed / recipe.instructions.length) * 100;
    }, [checkedSteps, recipe.instructions.length]);

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col" role="dialog" aria-modal="true">
            <div className="w-full h-1.5 bg-gray-700">
                <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <header className="flex-shrink-0 flex items-center justify-between text-white p-4 border-b border-gray-700">
                <div>
                    <h2 className="text-xl font-bold truncate">{recipe.title}</h2>
                    <p className="text-sm text-gray-400">Guided Cooking</p>
                </div>
                <button onClick={onClose} className="text-3xl font-light hover:text-gray-400">&times;</button>
            </header>

            <div className="flex-grow flex flex-col md:flex-row min-h-0">
                {/* Main Instruction Panel */}
                <main className="flex-grow flex flex-col justify-center items-center text-center text-white p-6 md:w-2/3">
                    <p className="text-lg font-semibold text-gray-400 mb-4">
                        Step {currentStep + 1} of {recipe.instructions.length}
                    </p>
                    <p className="text-2xl sm:text-3xl font-medium max-w-2xl leading-relaxed">
                        {renderInstruction(recipe.instructions[currentStep])}
                    </p>
                </main>

                {/* Sidebar Panel */}
                <aside className="w-full md:w-1/3 bg-gray-800/50 border-t md:border-t-0 md:border-l border-gray-700 flex flex-col">
                    <div className="flex border-b border-gray-700">
                        <button onClick={() => setShowIngredients(false)} className={`flex-1 p-3 text-center font-semibold ${!showIngredients ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>Steps</button>
                        <button onClick={() => setShowIngredients(true)} className={`flex-1 p-3 text-center font-semibold ${showIngredients ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}>Ingredients</button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-4">
                        {showIngredients ? (
                            <ul className="space-y-2">
                                {recipe.ingredients.map((ing, i) => <li key={i} className="text-gray-300">{ing}</li>)}
                            </ul>
                        ) : (
                            <ul ref={stepListRef} className="space-y-2">
                                {recipe.instructions.map((step, index) => (
                                    <li key={index}>
                                        <button onClick={() => handleStepSelect(index)} className={`w-full text-left p-3 rounded-lg transition-colors ${currentStep === index ? 'bg-green-900/50' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                                            <div className="flex items-start gap-3">
                                                <input type="checkbox" checked={checkedSteps[index]} onChange={() => toggleChecked(index)} className="mt-1 form-checkbox h-5 w-5 bg-gray-600 border-gray-500 rounded text-green-500 focus:ring-green-500" />
                                                <div className="flex-1">
                                                    <span className={`font-semibold ${currentStep === index ? 'text-green-300' : 'text-gray-400'}`}>Step {index + 1}</span>
                                                    <p className={`text-sm ${checkedSteps[index] ? 'line-through text-gray-500' : 'text-gray-200'}`}>{step}</p>
                                                </div>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>

            <footer className="flex-shrink-0 flex items-center justify-center gap-4 text-white p-4 border-t border-gray-700 bg-gray-900">
                <button onClick={handlePrev} disabled={currentStep === 0} className="px-5 py-2.5 rounded-lg bg-gray-700 disabled:opacity-50 hover:bg-gray-600 transition">Previous</button>
                <button onClick={() => speak(recipe.instructions[currentStep], true)} disabled={isSpeaking} className="px-5 py-2.5 rounded-lg bg-gray-700 disabled:opacity-50 hover:bg-gray-600 transition flex items-center gap-2">
                    <SpeakerIcon isSpeaking={isSpeaking} /> Repeat
                </button>
                <button onClick={handleNext} className="px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 transition font-bold">
                    {currentStep === recipe.instructions.length - 1 ? 'Finish' : 'Next Step'}
                </button>
            </footer>
            {activeTimer && <Timer initialSeconds={Math.round((activeTimer - Date.now()) / 1000)} onFinish={() => { setActiveTimer(null); alert('Timer finished!'); }} />}
        </div>
    );
};

export default CookingMode;