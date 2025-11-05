import React, { useState } from 'react';

interface AddToMealPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipeTitle: string, day: string, meal: 'breakfast' | 'lunch' | 'dinner') => void;
    recipeTitle: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEALS = ['breakfast', 'lunch', 'dinner'] as const;

const AddToMealPlanModal: React.FC<AddToMealPlanModalProps> = ({ isOpen, onClose, onSave, recipeTitle }) => {
    const today = new Date();
    const currentDay = DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1]; // Monday is 0 for logic
    const currentHour = today.getHours();

    const getDefaultMeal = () => {
        if (currentHour < 11) return 'breakfast';
        if (currentHour < 16) return 'lunch';
        return 'dinner';
    };
    
    const [day, setDay] = useState(currentDay);
    const [meal, setMeal] = useState<'breakfast' | 'lunch' | 'dinner'>(getDefaultMeal());

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(recipeTitle, day, meal);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Add to Meal Plan</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 space-y-4">
                    <p className="text-center text-gray-400">Add "<span className="font-semibold text-green-400">{recipeTitle}</span>" to your plan.</p>
                    
                    <div>
                        <label htmlFor="day-select" className="block text-sm font-medium text-gray-400 mb-1">Day</label>
                        <select
                            id="day-select"
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
                        >
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Meal</label>
                        <div className="grid grid-cols-3 gap-2">
                            {MEALS.map(m => (
                                <button
                                    key={m}
                                    onClick={() => setMeal(m)}
                                    className={`p-2 rounded-lg text-sm font-semibold capitalize transition ${meal === m ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </main>
                 <footer className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white font-semibold text-sm rounded-lg hover:bg-gray-600 transition">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-500 transition">Add to Plan</button>
                </footer>
            </div>
        </div>
    );
};

export default AddToMealPlanModal;