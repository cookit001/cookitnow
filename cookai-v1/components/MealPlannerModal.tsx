import React, { useState, useRef, useEffect } from 'react';
import type { MealPlan, SavedMealPlans, UserProfile } from '../types';
import { translations } from '../translations.ts';
import type { Language } from '../types.ts';
import { useToast } from './ToastProvider.tsx';
import * as geminiService from '../services/geminiService.ts';

interface MealPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    savedPlans: SavedMealPlans;
    setSavedPlans: React.Dispatch<React.SetStateAction<SavedMealPlans>>;
    activePlanName: string;
    setActivePlanName: (name: string) => void;
    canPerformAction: () => boolean;
    recordAction: () => void;
    language: Language;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS: (keyof MealPlan[string])[] = ["breakfast", "lunch", "dinner"];

const OptimizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>;
const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>;

const MealPlannerModal: React.FC<MealPlannerModalProps> = ({ 
    isOpen, onClose, userProfile, savedPlans, setSavedPlans, activePlanName, 
    setActivePlanName, canPerformAction, recordAction, language
}) => {
    const [conversationalInput, setConversationalInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [editingCell, setEditingCell] = useState<{ day: string; meal: keyof MealPlan[string] } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    const activePlan = savedPlans[activePlanName] || {};
    // Fix: Cast translation object to a more specific type to avoid property access errors.
    const t = translations[language].mealPlannerModal as Record<string, string>;
    const toast = useToast();

    useEffect(() => {
        if (editingCell && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingCell]);

    const handleCellChange = (day: string, meal: keyof MealPlan[string], value: string) => {
        const updatedPlan: MealPlan = {
            ...activePlan,
            [day]: { ...(activePlan[day] || {}), [meal]: value }
        };
        setSavedPlans(prev => ({ ...prev, [activePlanName]: updatedPlan }));
    };

    const handleStopEditing = () => {
        setEditingCell(null);
    };

    const handleGeneratePlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conversationalInput.trim()) {
            toast.addToast('Please describe the meal plan you want.', 'info');
            return;
        }
        if (!canPerformAction()) return;
        
        setIsLoading(true);
        try {
            const plan = await geminiService.generateMealPlanFromPrompt(conversationalInput, userProfile);
            setSavedPlans(prev => ({ ...prev, [activePlanName]: plan }));
            recordAction();
            setConversationalInput('');
        } catch (error: any) {
            toast.addToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOptimizePlan = async () => {
        if (!canPerformAction()) return;
        
        setIsOptimizing(true);
        try {
            const plan = await geminiService.optimizeMealPlan(activePlan, userProfile);
            setSavedPlans(prev => ({ ...prev, [activePlanName]: plan }));
            recordAction();
            toast.addToast("Your meal plan has been optimized!", 'success');
        } catch (error: any) {
            toast.addToast(error.message, 'error');
        } finally {
            setIsOptimizing(false);
        }
    }

    const handleSaveAs = () => {
        const newName = prompt(t.saveAsPrompt, `${activePlanName} - Copy`);
        if (newName && !savedPlans[newName]) {
            setSavedPlans(prev => ({ ...prev, [newName]: activePlan }));
            setActivePlanName(newName);
        } else if (newName) {
            toast.addToast(t.planExistsError, 'error');
        }
    };
    
    const handleClearPlan = () => {
        if (window.confirm(t.clearConfirmation)) {
            setSavedPlans(prev => ({ ...prev, [activePlanName]: {} }));
        }
    };
    
    const handleDeletePlan = () => {
        if(Object.keys(savedPlans).length <= 1) {
            toast.addToast(t.deleteLastError, 'error');
            return;
        }
        if (window.confirm(`${t.deleteConfirmation} "${activePlanName}"?`)) {
            const newPlans = { ...savedPlans };
            delete newPlans[activePlanName];
            setSavedPlans(newPlans);
            setActivePlanName(Object.keys(newPlans)[0]);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-slide-in-up-fade" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 grid grid-cols-3 items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">{t.title}</h2>
                    <div className="flex justify-center items-center gap-4">
                        <select value={activePlanName} onChange={e => setActivePlanName(e.target.value)} className="p-2 bg-gray-800 border border-gray-600 rounded-lg">
                            {Object.keys(savedPlans).map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                         <button onClick={handleSaveAs} className="px-3 py-2 text-sm bg-blue-600 rounded-lg hover:bg-blue-500">{t.saveAs}</button>
                         <button onClick={handleDeletePlan} className="px-3 py-2 text-sm bg-red-700 rounded-lg hover:bg-red-600">{t.deletePlan}</button>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                    </div>
                </header>

                <main className="flex-grow overflow-hidden p-4">
                    <div className="flex overflow-x-auto space-x-4 pb-4 h-full">
                        {DAYS.map(day => (
                            <div key={day} className="flex-shrink-0 w-64 bg-gray-800 rounded-xl flex flex-col transition-all duration-200 hover:bg-gray-700/50 hover:-translate-y-1">
                                <h3 className="text-center font-bold p-3 border-b border-gray-700">{t[day.toLowerCase()]}</h3>
                                <div className="flex-grow p-2 space-y-2">
                                    {MEALS.map(meal => {
                                        const mealName = activePlan[day]?.[meal] || '';
                                        const isEditing = editingCell?.day === day && editingCell?.meal === meal;
                                        return (
                                            <div key={meal} className="bg-gray-700/50 rounded-lg p-2 min-h-[80px]">
                                                <h4 className="text-xs font-semibold uppercase text-green-400 mb-1">{t[meal]}</h4>
                                                {isEditing ? (
                                                     <input
                                                        ref={inputRef}
                                                        type="text"
                                                        value={mealName}
                                                        onChange={(e) => handleCellChange(day, meal, e.target.value)}
                                                        onBlur={handleStopEditing}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleStopEditing()}
                                                        className="w-full bg-transparent text-sm text-white outline-none"
                                                    />
                                                ) : (
                                                    <button onClick={() => setEditingCell({ day, meal })} className="w-full text-left text-sm text-gray-200 hover:bg-gray-600/50 rounded p-1 transition-colors">
                                                        {mealName || (
                                                            <span className="flex items-center gap-1 text-gray-500 italic">
                                                                <AddIcon /> Add {t[meal]}
                                                            </span>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>

                <footer className="p-4 flex-shrink-0 border-t border-gray-700 space-y-3">
                    <form onSubmit={handleGeneratePlan} className="flex gap-2">
                         <input
                            type="text"
                            value={conversationalInput}
                            onChange={(e) => setConversationalInput(e.target.value)}
                            placeholder="e.g., A high-protein plan for next week using chicken and fish..."
                            className="flex-grow p-2 bg-gray-800 border border-gray-600 rounded-lg transition-colors focus:border-green-500 focus:ring-0"
                            disabled={isLoading}
                        />
                        <button type="submit" className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 disabled:bg-gray-500" disabled={isLoading}>
                            {isLoading ? t.generating : "Generate"}
                        </button>
                    </form>
                     <div className="flex flex-wrap justify-between items-center gap-2">
                        <button onClick={handleOptimizePlan} disabled={isOptimizing} className="px-4 py-2 bg-purple-600 text-white font-semibold text-sm rounded-lg hover:bg-purple-500 transition flex items-center disabled:bg-gray-600">
                           <OptimizeIcon />
                           {isOptimizing ? 'Optimizing...' : 'Optimize Plan'}
                        </button>
                        <div className="flex gap-2">
                             <button onClick={handleClearPlan} className="px-3 py-2 text-xs bg-gray-700 rounded-lg hover:bg-gray-600">{t.clearPlan}</button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default React.memo(MealPlannerModal);