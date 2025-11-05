import React, { useState, useRef, useEffect } from 'react';
import type { Recipe } from '../types.ts';
import FlavorProfile from './FlavorProfile.tsx';
import UnitConverterModal from './UnitConverterModal.tsx';
import ReminderModal from './ReminderModal.tsx';

const ScaleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>;
const SubstituteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 005 18h10a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4z" clipRule="evenodd" /></svg>;
const PairingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a2 2 0 00-2-2h-4a2 2 0 00-2 2v3h8z" /></svg>;
const VisualizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2H4zm10.5 5.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" clipRule="evenodd" /><path d="M2 7a1 1 0 011-1h1a1 1 0 010 2H3a1 1 0 01-1-1z" /></svg>;
const VariationsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const RemindIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const TutorialsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const ListAddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0V8H8a1 1 0 110-2h2V4a1 1 0 011-1z" clipRule="evenodd" /><path d="M3 5a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H4a1 1 0 01-1-1z" /><path d="M13 5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" /></svg>;
const AddToPlanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const TimeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" /></svg>;
const ServingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm-1.559 5.559a4.012 4.012 0 01-2.882 0C2.791 11.152 1 12.91 1 15h12c0-2.09-1.791-3.848-3.441-4.441zM16.5 6a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM19 15c0-1.232-1.04-2.25-2.5-2.25S14 13.768 14 15h5z" /></svg>;
const FlameIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className}`}>
        <path fillRule="evenodd" d="M11.233 2.33a.75.75 0 00-1.466 0l-3.5 6.75a.75.75 0 00.65 1.112l1.398-.124a.75.75 0 01.76.63l.75 3.75a.75.75 0 001.442 0l.75-3.75a.75.75 0 01.76-.63l1.398.124a.75.75 0 00.65-1.112l-3.5-6.75z" clipRule="evenodd" />
        <path d="M10 18a5 5 0 100-10 5 5 0 000 10z" />
    </svg>
);
const CuisineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.002 6.002 0 019.336 0l.251.251a6.002 6.002 0 010 9.336l-.251.251a6.002 6.002 0 01-9.336 0l-.251-.251a6.002 6.002 0 010-9.336l.251-.251z" clipRule="evenodd" />
        <path d="M10 4.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 4.5zM10 8.5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5a.75.75 0 01.75-.75z" />
    </svg>
);
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 002 3.5v13A1.5 1.5 0 003.5 18h13a1.5 1.5 0 001.5-1.5V3.5A1.5 1.5 0 0016.5 2h-13zM12 11.5a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5zm-3-3a.5.5 0 01.5.5v5a.5.5 0 01-1 0v-5a.5.5 0 01.5-.5zM8 5.5a.5.5 0 01.5.5v8a.5.5 0 01-1 0v-8a.5.5 0 01.5-.5z" clipRule="evenodd" /></svg>;

const DifficultyRating: React.FC<{ difficulty: 'Easy' | 'Medium' | 'Hard' }> = ({ difficulty }) => {
    const levelMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    const level = levelMap[difficulty] || 1;
    return (
        <div className="flex items-center gap-1.5" title={difficulty}>
            <span className="font-semibold">Difficulty:</span>
            <span className="flex items-center">
                {Array.from({ length: 3 }).map((_, i) => (
                    <FlameIcon key={i} className={i < level ? 'text-orange-400' : 'text-gray-600'} />
                ))}
            </span>
        </div>
    );
};

// New StarRating component
const StarRating: React.FC<{ rating: number; onSetRating: (rating: number) => void }> = ({ rating, onSetRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={() => onSetRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-yellow-400 focus:outline-none"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                              className={(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'}
                        />
                    </svg>
                </button>
            ))}
        </div>
    );
};

interface RecipeDisplayProps {
    recipe: Recipe;
    onStartCooking: (recipe: Recipe) => void;
    onSaveRecipe: (recipe: Recipe) => void;
    onShowVariations: (recipe: Recipe) => void;
    onShowTutorials: (recipe: Recipe) => void;
    onVisualizeDish: (recipe: Recipe) => void;
    onUpdateRating: (rating: number) => void;
    onSetReminder: (recipeTitle: string, delayInMs: number) => void;
    onAddToList: (ingredients: string[]) => void;
    onShowSubstituteModal: (recipe: Recipe, ingredient: string) => void;
    onShowPairingModal: (recipe: Recipe) => void;
    onShowScalerModal: (recipe: Recipe) => void;
    onShowAddToPlan: (recipe: Recipe) => void;
    activeJob: string | null;
}

const RecipeDisplay: React.FC<RecipeDisplayProps> = (props) => {
    const { recipe, onStartCooking, onSaveRecipe, onShowVariations, onShowTutorials, onVisualizeDish, onUpdateRating, onSetReminder, onAddToList, onShowSubstituteModal, onShowPairingModal, onShowScalerModal, onShowAddToPlan, activeJob } = props;

    const [isConverterOpen, setIsConverterOpen] = useState(false);
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [selectedMeasurement, setSelectedMeasurement] = useState('');

    const handleIngredientClick = (ingredient: string) => {
        const measurementRegex = /(\d*\.?\d+\s*(?:cups?|tbsp|tsp|g|kg|oz|lb|mL|L|°C|°F)[\s.,])/i;
        const match = ingredient.match(measurementRegex);
        if (match) {
            setSelectedMeasurement(match[0].trim());
            setIsConverterOpen(true);
        } else {
            // If no measurement, open substitute modal
            onShowSubstituteModal(recipe, ingredient);
        }
    };
    
    return (
        <div className="w-full bg-gray-800 p-6 rounded-lg text-gray-300">
            <header className="border-b border-gray-700 pb-4 mb-6 flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-white">{recipe.title}</h2>
                    <p className="text-gray-400 mt-2">{recipe.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base mt-4 text-gray-400">
                        <span className="flex items-center gap-1.5" title="Cooking Time"><TimeIcon /> {recipe.cookingTime}</span>
                        <span className="flex items-center gap-1.5" title="Servings"><ServingsIcon /> {recipe.servings}</span>
                        <DifficultyRating difficulty={recipe.difficulty} />
                        {recipe.cuisine && (
                            <span className="flex items-center gap-1.5 bg-blue-900/50 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                                <CuisineIcon />
                                {recipe.cuisine}
                            </span>
                        )}
                         {recipe.isSaved && <StarRating rating={recipe.rating || 0} onSetRating={onUpdateRating} />}
                    </div>
                </div>
                <button 
                    onClick={() => onSaveRecipe(recipe)} 
                    className="p-2 rounded-full hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!!activeJob}
                    title={recipe.isSaved ? 'Unsave Recipe' : 'Save Recipe'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={recipe.isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>
            </header>
            
            <div className="mb-4">
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3">Smart Tools</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button onClick={() => onShowScalerModal(recipe)} className="flex flex-col items-center justify-center p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"><ScaleIcon /> Scale Recipe</button>
                    <button onClick={() => onShowPairingModal(recipe)} className="flex flex-col items-center justify-center p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"><PairingIcon /> Pairings</button>
                    <button onClick={() => onShowVariations(recipe)} className="flex flex-col items-center justify-center p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"><VariationsIcon /> Variations</button>
                    <button onClick={() => onVisualizeDish(recipe)} className="flex flex-col items-center justify-center p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"><VisualizeIcon /> Visualize</button>
                </div>
            </div>
            
            {recipe.foodLore && (
                <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border-l-4 border-yellow-500">
                    <h3 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2"><BookIcon /> Food Lore</h3>
                    <p className="text-sm text-gray-300 italic">{recipe.foodLore}</p>
                </div>
            )}

            {recipe.flavorProfile && <FlavorProfile profile={recipe.flavorProfile} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
                <div className="lg:col-span-1">
                    <h3 className="text-xl font-semibold text-green-400 mb-3">Ingredients</h3>
                    <ul className="space-y-2 text-base">
                        {recipe.ingredients.map((item, i) => (
                            <li key={i} onClick={() => handleIngredientClick(item)} className="cursor-pointer hover:text-white transition-colors">{item}</li>
                        ))}
                    </ul>
                     <p className="text-xs text-gray-500 mt-2">Tip: Click an ingredient to convert units or find a substitute.</p>
                </div>
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-semibold text-green-400 mb-3">Instructions</h3>
                    <ol className="list-decimal list-inside space-y-3 text-base">
                        {recipe.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                        ))}
                    </ol>
                </div>
            </div>

            <footer className="pt-6 border-t border-gray-700 flex flex-wrap gap-3 items-center">
                 <button 
                    onClick={() => onStartCooking(recipe)} 
                    disabled={!!activeJob}
                    className="px-5 py-2 bg-green-600 text-white font-bold text-base rounded-lg hover:bg-green-500 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                 >
                    Start Cooking
                </button>
                <button 
                    onClick={() => onAddToList(recipe.ingredients)} 
                    disabled={!!activeJob}
                    className="px-4 py-2 bg-gray-700 text-white font-semibold text-base rounded-lg hover:bg-gray-600 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
                >
                    <ListAddIcon /> Add to List
                </button>
                <button onClick={() => onShowAddToPlan(recipe)} className="px-4 py-2 bg-gray-700 text-white font-semibold text-base rounded-lg hover:bg-gray-600 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"><AddToPlanIcon /> Add to Plan</button>
                <button onClick={() => onShowTutorials(recipe)} className="px-4 py-2 bg-gray-700 text-white font-semibold text-base rounded-lg hover:bg-gray-600 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"><TutorialsIcon /> Tutorials</button>
                <button onClick={() => setIsReminderModalOpen(true)} className="px-4 py-2 bg-gray-700 text-white font-semibold text-base rounded-lg hover:bg-gray-600 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"><RemindIcon /> Remind Me</button>
            </footer>
            
            {isConverterOpen && (
                <UnitConverterModal 
                    isOpen={isConverterOpen}
                    onClose={() => setIsConverterOpen(false)}
                    initialMeasurement={selectedMeasurement}
                    language="en" // This should eventually come from profile
                />
            )}

            {isReminderModalOpen && (
                <ReminderModal
                    isOpen={isReminderModalOpen}
                    onClose={() => setIsReminderModalOpen(false)}
                    onSetReminder={(delay) => onSetReminder(recipe.title, delay)}
                    recipeTitle={recipe.title}
                />
            )}
        </div>
    );
};

export default React.memo(RecipeDisplay);