import React, { useState, useEffect } from 'react';
import type { Recipe, IngredientSubstitute } from '../types.ts';
import * as geminiService from '../services/geminiService.ts';
import { useAppContext } from '../App.tsx';

interface IngredientSubstituteModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
    ingredient: string;
}

const Loader: React.FC = () => (
    <div className="flex justify-center items-center p-8">
      <div className="w-10 h-10 border-4 border-gray-700 border-t-purple-400 rounded-full animate-spin"></div>
    </div>
);

const IngredientSubstituteModal: React.FC<IngredientSubstituteModalProps> = ({ isOpen, onClose, recipe, ingredient }) => {
    const [substitutes, setSubstitutes] = useState<IngredientSubstitute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { userProfile } = useAppContext();

    useEffect(() => {
        if (isOpen) {
            const fetchSubstitutes = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const result = await geminiService.getIngredientSubstitute(ingredient, recipe.title, userProfile);
                    setSubstitutes(result);
                } catch (err: any) {
                    setError(err.message || "Failed to find substitutes.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSubstitutes();
        }
    }, [isOpen, ingredient, recipe.title, userProfile]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Substitutes for <span className="text-purple-400">{ingredient.split(',')[0]}</span></h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 max-h-[60vh] overflow-y-auto">
                    {isLoading && <Loader />}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    {!isLoading && !error && (
                        <div className="space-y-4">
                            {substitutes.length > 0 ? substitutes.map((sub, index) => (
                                <div key={index} className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-lg font-semibold text-white">{sub.substitute}</h3>
                                    <p className="text-sm text-gray-400 mb-2">
                                        <span className="font-semibold text-gray-300">Quantity:</span> {sub.quantity}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        <span className="font-semibold text-gray-300">Impact:</span> {sub.impact}
                                    </p>
                                </div>
                            )) : <p className="text-center text-gray-500">No suitable substitutes found.</p>}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default IngredientSubstituteModal;