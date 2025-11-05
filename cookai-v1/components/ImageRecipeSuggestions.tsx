import React, { useState, useEffect } from 'react';
import type { Recipe, ImageAnalysisResult } from '../types.ts';
import * as geminiService from '../services/geminiService';

const HealthGauge: React.FC<{ score: number }> = ({ score }) => {
    const percentage = Math.max(0, Math.min(100, score));
    const rotation = (percentage / 100) * 180;
    const color = percentage > 75 ? '#34D399' : percentage > 40 ? '#FBBF24' : '#F87171';

    return (
        <div className="relative w-40 h-20 overflow-hidden mx-auto">
            <div className="absolute top-0 left-0 w-full h-full border-8 border-gray-700 rounded-t-full border-b-0"></div>
            <div
                className="absolute top-0 left-0 w-full h-full rounded-t-full border-b-0 border-8 transition-transform duration-1000"
                style={{
                    borderColor: color,
                    clipPath: `inset(0 ${100 - percentage}% 0 0)`,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'bottom center',
                }}
            ></div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <span className="text-2xl font-bold text-white">{score}</span>
                <span className="text-xs text-gray-400 block">/ 100</span>
            </div>
        </div>
    );
};


const RecipeCard: React.FC<{ recipe: Recipe, onSelect: (r: Recipe) => void }> = ({ recipe, onSelect }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateImg = async () => {
            setIsLoading(true);
            try {
                const base64 = await geminiService.generateDishImage(recipe.title, "Food Magazine");
                setImageUrl(`data:image/png;base64,${base64}`);
            } catch (e) {
                console.error("Failed to generate recipe image for card:", e);
                setImageUrl(null);
            } finally {
                setIsLoading(false);
            }
        };
        generateImg();
    }, [recipe.title]);

    return (
        <div className="border border-gray-700 rounded-lg flex flex-col bg-gray-900 hover:shadow-lg hover:shadow-gray-800/50 hover:-translate-y-1 transition-all">
            <div className="h-40 w-full bg-gray-800 rounded-t-lg flex items-center justify-center relative overflow-hidden">
                {isLoading && <div className="w-8 h-8 border-2 border-gray-700 border-t-green-400 rounded-full animate-spin"></div>}
                {!isLoading && imageUrl && (
                    <>
                        <img src={imageUrl} alt={recipe.title} className="w-full h-full object-cover" />
                        <div className="steam-container">
                            <span style={{ animationDelay: '0s' }}></span>
                            <span style={{ animationDelay: '1s' }}></span>
                        </div>
                    </>
                )}
                {!isLoading && !imageUrl && <span className="text-xs text-gray-500">Image could not be generated</span>}
            </div>
            <div className="p-4 flex flex-col flex-grow">
                <h4 className="font-semibold text-white leading-tight mb-2 flex-grow">{recipe.title}</h4>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{recipe.description}</p>
                <button 
                    onClick={() => onSelect(recipe)}
                    className="w-full text-center mt-auto py-2 px-4 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-500 transition-colors"
                >
                    View Recipe
                </button>
            </div>
        </div>
    );
};

const ImageRecipeSuggestions: React.FC<ImageAnalysisResult & { onSelectRecipe: (recipe: Recipe) => void }> = ({ inventory, qualityNotes, recipes, suggestedAdditions, nutritionalSummary, healthScore, storageTips, chefTips, onSelectRecipe }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'tips'>('overview');
    
    return (
        <div className="bg-gray-800 p-6 rounded-lg w-full text-gray-300">
            <h3 className="text-xl font-bold text-white mb-2">Image Analysis Dashboard</h3>
            <p className="text-gray-400 italic mb-4">"{qualityNotes}"</p>

            <div className="border-b border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-purple-500 text-purple-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Overview</button>
                    <button onClick={() => setActiveTab('health')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'health' ? 'border-green-500 text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Health & Nutrition</button>
                    <button onClick={() => setActiveTab('tips')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'tips' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Kitchen Tips</button>
                </nav>
            </div>

            <div className="animate-fade-in">
                {activeTab === 'overview' && (
                     <div>
                        <h4 className="font-semibold text-purple-400 mb-2">Detected Ingredients</h4>
                        <ul className="space-y-1 text-sm max-h-32 overflow-y-auto pr-2 mb-4">
                            {inventory.map((item, index) => (
                                <li key={index} className="flex justify-between p-1.5 bg-gray-900/50 rounded">
                                    <span>{item.name} (~{item.quantity})</span>
                                    <span className="text-gray-400 capitalize">{item.quality}</span>
                                </li>
                            ))}
                        </ul>
                         <h3 className="text-lg font-bold text-white mb-3">Recipe Ideas</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recipes.map((recipe, index) => (
                                <RecipeCard key={index} recipe={recipe} onSelect={onSelectRecipe} />
                            ))}
                        </div>
                    </div>
                )}
                 {activeTab === 'health' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center">
                             <h4 className="font-semibold text-green-400 mb-2">Health Score</h4>
                             <HealthGauge score={healthScore.score} />
                             <p className="text-xs text-gray-400 text-center mt-2">{healthScore.reasoning}</p>
                        </div>
                         <div className="md:col-span-2">
                             <h4 className="font-semibold text-green-400 mb-2">Nutritional Insights</h4>
                             <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded max-h-48 overflow-y-auto">{nutritionalSummary}</p>
                         </div>
                    </div>
                )}
                 {activeTab === 'tips' && (
                     <div className="space-y-6">
                        <div>
                            <h4 className="font-semibold text-blue-400 mb-2">Chef's Tips</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm bg-gray-900/50 p-3 rounded">
                                {chefTips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </div>
                         <div>
                            <h4 className="font-semibold text-blue-400 mb-2">Smart Storage Tips</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm bg-gray-900/50 p-3 rounded">
                                {storageTips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </div>
                         <div>
                             <h4 className="font-semibold text-blue-400 mb-2">Suggested Additions</h4>
                            <div className="flex flex-wrap gap-2">
                                {suggestedAdditions.map((item, index) => (
                                    <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded-full">{item}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageRecipeSuggestions;