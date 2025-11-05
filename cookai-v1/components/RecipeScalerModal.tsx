import React, { useState, useEffect } from 'react';
import type { Recipe } from '../types.ts';
import * as geminiService from '../services/geminiService.ts';
import { useAppContext } from '../App.tsx';
import { useToast } from './ToastProvider.tsx';

interface RecipeScalerModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
    onSaveScaledRecipe: (recipe: Recipe) => void;
}

const Loader: React.FC = () => (
    <div className="flex justify-center items-center p-8">
      <div className="w-10 h-10 border-4 border-gray-700 border-t-green-400 rounded-full animate-spin"></div>
    </div>
);

const RecipeScalerModal: React.FC<RecipeScalerModalProps> = ({ isOpen, onClose, recipe, onSaveScaledRecipe }) => {
    const [servings, setServings] = useState(recipe.servings);
    const [scaledRecipe, setScaledRecipe] = useState<Recipe | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { userProfile } = useAppContext();
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            setServings(recipe.servings);
            setScaledRecipe(null);
            setIsLoading(false);
            setError(null);
        }
    }, [isOpen, recipe]);

    const handleScale = async () => {
        if (!servings.trim()) {
            setError("Please enter a valid serving size.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await geminiService.scaleRecipe(recipe, servings, userProfile);
            setScaledRecipe(result);
        } catch (err: any) {
            setError(err.message || "Failed to scale recipe.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (scaledRecipe) {
            onSaveScaledRecipe({ ...scaledRecipe, title: `${scaledRecipe.title} (${scaledRecipe.servings})` });
            toast.addToast("Scaled recipe saved!", "success");
            onClose();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Scale Recipe</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-end gap-3 mb-4">
                        <div className="flex-grow">
                            <label className="text-sm font-semibold text-gray-400 block mb-1">New Serving Size</label>
                            <input
                                type="text"
                                value={servings}
                                onChange={(e) => setServings(e.target.value)}
                                placeholder={`Original: ${recipe.servings}`}
                                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
                            />
                        </div>
                        <button onClick={handleScale} disabled={isLoading} className="px-5 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 disabled:bg-gray-600">
                            Scale
                        </button>
                    </div>

                    {isLoading && <Loader />}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    
                    {scaledRecipe && (
                        <div className="mt-4 p-4 bg-gray-800 rounded-lg animate-fade-in">
                            <h3 className="font-semibold text-green-400 mb-2">New Ingredients for {scaledRecipe.servings}:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                                {scaledRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                            </ul>
                             <button onClick={handleSave} className="w-full mt-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500">
                                Save as New Recipe
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default RecipeScalerModal;