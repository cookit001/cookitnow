import React, { useState } from 'react';
import type { Recipe, RecipeVariant } from '../types';
import { useAppContext } from '../App.tsx';

interface RecipeVariantsDisplayProps {
  variants: RecipeVariant[];
  originalRecipe: Recipe;
  onSaveVariation: (variant: RecipeVariant, originalRecipe: Recipe) => void;
}

const RecipeVariantsDisplay: React.FC<RecipeVariantsDisplayProps> = ({ variants, originalRecipe, onSaveVariation }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const { savedRecipes } = useAppContext();

    return (
        <div className="w-full bg-gray-800 p-6 rounded-lg text-gray-300">
            <h3 className="text-2xl font-bold text-white mb-4">Recipe Variations</h3>
            <div className="space-y-3">
                {variants.map((variant, index) => {
                    const isSaved = savedRecipes.some(r => r.title === variant.title);
                    return (
                        <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                            <div className="w-full text-left p-4 bg-gray-900 hover:bg-gray-700 flex justify-between items-center">
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="flex-grow flex items-center justify-between"
                                    aria-expanded={openIndex === index}
                                >
                                    <span className="font-semibold text-green-400">{variant.title}</span>
                                    <span className={`transform transition-transform text-gray-400 ${openIndex === index ? 'rotate-180' : ''}`}>▼</span>
                                </button>
                                <button onClick={() => onSaveVariation(variant, originalRecipe)} className="ml-4 p-2 rounded-full hover:bg-gray-700 transition" title={isSaved ? "Unsave variation" : "Save variation"}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </button>
                            </div>
                            {openIndex === index && (
                                <div className="p-4 bg-gray-800">
                                    <p className="text-gray-400 mb-4">{variant.description}</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-semibold text-white mb-2">Ingredients</h4>
                                            <ul className="list-disc list-inside space-y-1 text-base">
                                                {variant.ingredients.map((item, i) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white mb-2">Instructions</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-base">
                                                {variant.instructions.map((step, i) => <li key={i}>{step}</li>)}
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecipeVariantsDisplay;