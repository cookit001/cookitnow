import React, { useState, useRef, useEffect } from 'react';
import type { MealPlan, SavedMealPlans, UserProfile, ShoppingListItem } from '../types';
import { translations } from '../translations.ts';
import type { Language } from '../types.ts';
import { useToast } from '../components/ToastProvider.tsx';
import * as geminiService from '../services/geminiService.ts';

interface MealPlannerPageProps {
    onBack: () => void;
    userProfile: UserProfile;
    savedPlans: SavedMealPlans;
    setSavedPlans: React.Dispatch<React.SetStateAction<SavedMealPlans>>;
    activePlanName: string;
    setActivePlanName: (name: string) => void;
    canPerformAction: () => boolean;
    recordAction: () => void;
    language: Language;
    items: ShoppingListItem[];
    onUpdateItems: (items: ShoppingListItem[]) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS: (keyof MealPlan[string])[] = ["breakfast", "lunch", "dinner"];

const OptimizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>;
const ShoppingListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h4a1 1 0 100-2H7zm0 4a1 1 0 100 2h4a1 1 0 100-2H7z" clipRule="evenodd" /></svg>

const MealPlannerPage: React.FC<MealPlannerPageProps> = ({ 
    onBack, userProfile, savedPlans, setSavedPlans, activePlanName, 
    setActivePlanName, canPerformAction, recordAction, language, items, onUpdateItems
}) => {
    const [conversationalInput, setConversationalInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [editingCell, setEditingCell] = useState<{ day: string; meal: keyof MealPlan[string] } | null>(null);
    const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
    const [newPlanName, setNewPlanName] = useState('');
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
    
    // Ensure active plan exists, if not, reset to first available plan
    useEffect(() => {
        if (!savedPlans[activePlanName]) {
            const firstPlan = Object.keys(savedPlans)[0];
            if (firstPlan) {
                setActivePlanName(firstPlan);
            }
        }
    }, [activePlanName, savedPlans, setActivePlanName]);


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
            toast.addToast("New plan generated and optimized!", 'success');
            setConversationalInput('');
        } catch (error: any) {
            toast.addToast(error.message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateShoppingList = async () => {
        if (Object.keys(activePlan).length === 0) {
            toast.addToast('Your current plan is empty. Generate a plan first.', 'info');
            return;
        }
        if (!canPerformAction()) return;
        
        setIsProcessing(true);
        try {
            const ingredients = await geminiService.generateShoppingListFromPlan(activePlan, userProfile);
            recordAction();
            const existingItemsLower = new Set(items.map(i => i.text.toLowerCase()));
            const newItems = ingredients
                .filter(text => text && !existingItemsLower.has(text.toLowerCase()))
                .map(text => ({
                    id: Date.now() + Math.random(),
                    text,
                    completed: false,
                    category: 'General',
                }));
            
            if (newItems.length > 0) {
                onUpdateItems([...items, ...newItems]);
                toast.addToast(`${newItems.length} new item(s) added to your shopping list.`, 'success');
            } else {
                 toast.addToast('All required ingredients are already on your list.', 'info');
            }

        } catch (error: any) {
            toast.addToast(error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveAs = () => {
        setNewPlanName(`${activePlanName} - Copy`); // Pre-fill with a suggestion
        setIsSaveAsModalOpen(true);
    };
    
    const handleConfirmSaveAs = () => {
        if (newPlanName && newPlanName.trim()) {
            const planNameToSave = newPlanName.trim();
            if (savedPlans[planNameToSave]) {
                toast.addToast(t.planExistsError, 'error');
            } else {
                setSavedPlans(prev => ({ ...prev, [planNameToSave]: activePlan }));
                setActivePlanName(planNameToSave);
                toast.addToast(`Plan saved as "${planNameToSave}"`, 'success');
                setIsSaveAsModalOpen(false);
                setNewPlanName('');
            }
        } else {
            toast.addToast('Please enter a valid plan name.', 'info');
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
            const oldPlanName = activePlanName;
            const newPlans = { ...savedPlans };
            delete newPlans[oldPlanName];
            setSavedPlans(newPlans);
            // setActivePlanName is handled by useEffect which will select the first available plan
            toast.addToast(`Plan "${oldPlanName}" deleted.`, 'success');
        }
    }


    return (
        <div className="w-full h-full flex flex-col text-gray-200">
             <header className="p-4 flex items-center gap-4 flex-shrink-0 border-b border-gray-700/80">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Back to chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">{t.title}</h1>
            </header>
            
            <div className="p-4 flex items-center gap-3 flex-shrink-0 border-b border-gray-700/80 bg-gray-800/30">
                <select value={activePlanName} onChange={e => setActivePlanName(e.target.value)} className="p-2 bg-gray-900 border border-gray-600 rounded-lg text-white font-semibold">
                    {Object.keys(savedPlans).map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <button onClick={handleSaveAs} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-md">Save As...</button>
                <button onClick={handleDeletePlan} className="px-4 py-2 text-sm font-semibold bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md">Delete Plan</button>
            </div>

            <main className="flex-grow p-4 overflow-y-auto">
                <div className="flex flex-col items-center space-y-4 pb-4">
                    {DAYS.map((day, index) => (
                        <div key={day} className="w-full max-w-xl bg-gray-900/80 rounded-xl flex flex-col shadow-lg animate-slide-in-up-stagger" style={{ animationDelay: `${index * 100}ms` }}>
                            <h3 className="text-center font-bold p-3 text-lg border-b border-gray-700/50">{t[day.toLowerCase()]}</h3>
                            <div className="flex-grow p-4 space-y-6">
                                {MEALS.map(meal => {
                                    const mealName = activePlan[day]?.[meal] || '';
                                    const isEditing = editingCell?.day === day && editingCell?.meal === meal;
                                    return (
                                        <div key={meal}>
                                            <h4 className="text-sm font-bold uppercase text-green-400 mb-2">{t[meal]}</h4>
                                            {isEditing ? (
                                                 <input
                                                    ref={inputRef}
                                                    type="text"
                                                    value={mealName}
                                                    onChange={(e) => handleCellChange(day, meal, e.target.value)}
                                                    onBlur={handleStopEditing}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleStopEditing()}
                                                    className="w-full bg-transparent text-base text-white outline-none p-1"
                                                />
                                            ) : (
                                                <button onClick={() => setEditingCell({ day, meal })} className="w-full text-left text-base text-gray-200 hover:bg-gray-700/50 rounded p-1 transition-colors min-h-[28px]">
                                                    {mealName || (
                                                        <span className="text-gray-400">
                                                            + Add {t[meal]}
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

            <footer className="p-4 flex-shrink-0 border-t border-gray-700/80 space-y-4 bg-gray-800/50">
                <form onSubmit={handleGeneratePlan} className="flex gap-2">
                     <input
                        type="text"
                        value={conversationalInput}
                        onChange={(e) => setConversationalInput(e.target.value)}
                        placeholder="e.g., A high-protein plan for next week using chicken and fish..."
                        className="flex-grow p-2 bg-gray-900 border border-gray-700 rounded-lg transition-colors focus:border-purple-500 focus:ring-0"
                        disabled={isLoading}
                    />
                    <button type="submit" className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-500 disabled:bg-gray-600 transition shadow-md" disabled={isLoading}>
                        {isLoading ? t.generating : "Generate Plan"}
                    </button>
                </form>
                 <div className="flex flex-wrap justify-between items-center gap-2">
                    <div className="flex gap-2">
                        <button onClick={handleGenerateShoppingList} disabled={isProcessing} className="px-4 py-2 bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-500 transition flex items-center disabled:bg-gray-600">
                           <ShoppingListIcon />
                           {isProcessing ? 'Generating...' : 'Generate Shopping List'}
                        </button>
                         <button onClick={handleClearPlan} className="px-4 py-2 text-sm bg-gray-700 rounded-lg hover:bg-gray-600">{t.clearPlan}</button>
                    </div>
                </div>
            </footer>
            {isSaveAsModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold">Save Plan As</h2>
                        <input
                            type="text"
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirmSaveAs()}
                            placeholder="Enter a new plan name"
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
                            autoFocus
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setIsSaveAsModalOpen(false)} className="w-full py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition">
                                Cancel
                            </button>
                            <button onClick={handleConfirmSaveAs} className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(MealPlannerPage);