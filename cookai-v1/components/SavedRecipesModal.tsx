import React, { useState, useMemo, useEffect } from 'react';
import type { Recipe } from '../types';
import { translations } from '../translations.ts';
import type { Language } from '../types';

interface SavedRecipesModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedRecipes: Recipe[];
    onSelectRecipe: (recipe: Recipe) => void;
    onFuseRecipes: (recipe1: Recipe, recipe2: Recipe) => void;
    onEditRecipe: (recipe: Recipe) => void;
    onToggleFavorite: (title: string) => void;
    language: Language;
}

type SortKey = 'default' | 'relevance' | 'az' | 'za' | 'prep-asc' | 'prep-desc' | 'cook-asc' | 'cook-desc' | 'cuisine-az' | 'favorite-first';
type DifficultyFilter = 'All' | 'Easy' | 'Medium' | 'Hard';
type TimeFilter = 'All' | '<30' | '30-60' | '>60';
type RatingFilter = 0 | 1 | 2 | 3 | 4 | 5;

// Debounce hook for performance optimization
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

// Component to highlight search term
const Highlight: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-yellow-400 text-gray-900 rounded-sm px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const FavoriteStarIcon: React.FC<{ isFavorite: boolean }> = ({ isFavorite }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-500'}`} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);
const ReadOnlyStars: React.FC<{ rating?: number }> = ({ rating = 0 }) => (
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map(star => (
            <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      className={rating >= star ? 'text-yellow-400' : 'text-gray-600'}
                />
            </svg>
        ))}
    </div>
);

const DetailIcon: React.FC<{ icon: 'prep' | 'cook' | 'difficulty' }> = ({ icon }) => {
    const icons = {
        prep: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M17.293 3.293a1 1 0 011.414 0l.001.001a1 1 0 010 1.414l-11 11a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L6 13.586l10.293-10.293a1 1 0 011.414-.001z" clipRule="evenodd" /><path d="M10.793 2.293a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 4.414l-2.293 2.293a1 1 0 01-1.414-1.414l3.5-3.5z" /></svg>,
        cook: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>,
        difficulty: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.233 2.33a.75.75 0 00-1.466 0l-3.5 6.75a.75.75 0 00.65 1.112l1.398-.124a.75.75 0 01.76.63l.75 3.75a.75.75 0 001.442 0l.75-3.75a.75.75 0 01.76-.63l1.398.124a.75.75 0 00.65-1.112l-3.5-6.75z" clipRule="evenodd" /><path d="M10 18a5 5 0 100-10 5 5 0 000 10z" /></svg>,
    };
    return <div className="h-4 w-4 text-gray-400">{icons[icon]}</div>;
}


const parseTime = (timeStr?: string): number => {
    if (!timeStr) return Infinity;
    
    let totalMinutes = 0;
    const hourMatch = timeStr.match(/(\d*\.?\d+)\s*hours?/i);
    if (hourMatch) totalMinutes += parseFloat(hourMatch[1]) * 60;
    const minMatch = timeStr.match(/(\d+)\s*(minutes?|mins?)/i);
    if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
    const rangeMatch = timeStr.match(/^(\d+)-/);
    if (!hourMatch && !minMatch && rangeMatch) return parseInt(rangeMatch[1], 10);
    if (totalMinutes === 0 && /^\d+$/.test(timeStr)) return parseInt(timeStr, 10);

    return totalMinutes > 0 ? totalMinutes : Infinity;
};

const SavedRecipesModal: React.FC<SavedRecipesModalProps> = ({ isOpen, onClose, savedRecipes, onSelectRecipe, onFuseRecipes, onEditRecipe, onToggleFavorite, language }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [sortKey, setSortKey] = useState<SortKey>('default');
    const [isFusionMode, setIsFusionMode] = useState(false);
    const [fusionSelection, setFusionSelection] = useState<Recipe[]>([]);
    const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('All');
    const [cookTimeFilter, setCookTimeFilter] = useState<TimeFilter>('All');
    const [prepTimeFilter, setPrepTimeFilter] = useState<TimeFilter>('All');
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>(0);
    const [cuisineFilter, setCuisineFilter] = useState('');
    const [dietaryFilters, setDietaryFilters] = useState<string[]>([]);
    const [showDietary, setShowDietary] = useState(false);

    // Fix: Cast translation object to a more specific type to avoid property access errors.
    const t = translations[language].savedRecipesModal as Record<string, string>;

    const allDietaryTags = useMemo(() => {
        const tags = new Set<string>();
        savedRecipes.forEach(r => {
            r.tags?.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [savedRecipes]);

    const handleDietaryChange = (tag: string) => {
        setDietaryFilters(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const filteredAndSortedRecipes = useMemo(() => {
        let recipes = savedRecipes
            .filter(r => !cuisineFilter || r.cuisine?.toLowerCase().includes(cuisineFilter.toLowerCase()))
            .filter(r => dietaryFilters.length === 0 || dietaryFilters.every(tag => r.tags?.includes(tag)))
            .filter(r => difficultyFilter === 'All' || r.difficulty === difficultyFilter)
            .filter(r => {
                if (prepTimeFilter === 'All') return true;
                const minutes = parseTime(r.prepTime);
                if (prepTimeFilter === '<30') return minutes > 0 && minutes < 30;
                if (prepTimeFilter === '30-60') return minutes >= 30 && minutes <= 60;
                return minutes > 60;
            })
            .filter(r => {
                if (cookTimeFilter === 'All') return true;
                const minutes = parseTime(r.cookingTime);
                if (cookTimeFilter === '<30') return minutes > 0 && minutes < 30;
                if (cookTimeFilter === '30-60') return minutes >= 30 && minutes <= 60;
                return minutes > 60;
            })
            .filter(r => ratingFilter === 0 || (r.rating || 0) >= ratingFilter);

        const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
        if (lowerSearchTerm) {
            recipes = recipes.filter(r => 
                r.title.toLowerCase().includes(lowerSearchTerm) ||
                r.description.toLowerCase().includes(lowerSearchTerm) ||
                r.ingredients.some(i => i.toLowerCase().includes(lowerSearchTerm)) ||
                r.cuisine?.toLowerCase().includes(lowerSearchTerm) ||
                r.tags?.some(t => t.toLowerCase().includes(lowerSearchTerm))
            );
        }

        const sorted = [...recipes]; // Create a mutable copy

        switch (sortKey) {
            case 'az': sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
            case 'za': sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
            case 'prep-asc': sorted.sort((a, b) => parseTime(a.prepTime) - parseTime(b.prepTime)); break;
            case 'prep-desc': sorted.sort((a, b) => parseTime(b.prepTime) - parseTime(a.prepTime)); break;
            case 'cook-asc': sorted.sort((a, b) => parseTime(a.cookingTime) - parseTime(b.cookingTime)); break;
            case 'cook-desc': sorted.sort((a, b) => parseTime(b.cookingTime) - parseTime(a.cookingTime)); break;
            case 'cuisine-az': sorted.sort((a, b) => (a.cuisine || 'z').localeCompare(b.cuisine || 'z')); break;
            case 'favorite-first': sorted.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)); break;
            default: break;
        }
        return sorted;
    }, [savedRecipes, debouncedSearchTerm, sortKey, difficultyFilter, cookTimeFilter, prepTimeFilter, ratingFilter, cuisineFilter, dietaryFilters]);
    
    const handleFusionSelect = (recipe: Recipe) => {
        setFusionSelection(prev => {
            if (prev.find(r => r.title === recipe.title)) return prev.filter(r => r.title !== recipe.title);
            if (prev.length < 2) return [...prev, recipe];
            return [prev[1], recipe];
        });
    };

    const handleFuseClick = () => {
        if (fusionSelection.length === 2) onFuseRecipes(fusionSelection[0], fusionSelection[1]);
    };
    
    const resetFilters = () => {
        setSearchTerm('');
        setDifficultyFilter('All');
        setCookTimeFilter('All');
        setPrepTimeFilter('All');
        setRatingFilter(0);
        setCuisineFilter('');
        setDietaryFilters([]);
        setShowDietary(false);
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-slide-in-up-fade" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">{t.title}</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                
                <div className="p-4 flex-shrink-0 border-b border-gray-700 space-y-3">
                    <div className="flex gap-2">
                         <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                         <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className="p-2 bg-gray-800 border border-gray-600 rounded-lg shrink-0">
                            <option value="default">Sort By...</option>
                            <option value="favorite-first">Favorites First</option>
                            <option value="az">Title A-Z</option><option value="za">Title Z-A</option>
                            <option value="prep-asc">Prep Time (asc)</option><option value="prep-desc">Prep Time (desc)</option>
                            <option value="cook-asc">Cook Time (asc)</option><option value="cook-desc">Cook Time (desc)</option>
                            <option value="cuisine-az">Cuisine A-Z</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value as DifficultyFilter)} className="p-2 bg-gray-800 border border-gray-600 rounded-lg"><option value="All">All Difficulties</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option></select>
                        <select value={prepTimeFilter} onChange={e => setPrepTimeFilter(e.target.value as TimeFilter)} className="p-2 bg-gray-800 border border-gray-600 rounded-lg"><option value="All">All Prep Times</option><option value="<30">&lt; 30 min</option><option value="30-60">30-60 min</option><option value=">60">&gt; 60 min</option></select>
                        <select value={cookTimeFilter} onChange={e => setCookTimeFilter(e.target.value as TimeFilter)} className="p-2 bg-gray-800 border border-gray-600 rounded-lg"><option value="All">All Cook Times</option><option value="<30">&lt; 30 min</option><option value="30-60">30-60 min</option><option value=">60">&gt; 60 min</option></select>
                        <select value={ratingFilter} onChange={e => setRatingFilter(parseInt(e.target.value, 10) as RatingFilter)} className="p-2 bg-gray-800 border border-gray-600 rounded-lg"><option value="0">All Ratings</option><option value="1">1+ Stars</option><option value="2">2+ Stars</option><option value="3">3+ Stars</option><option value="4">4+ Stars</option><option value="5">5 Stars</option></select>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <input type="text" placeholder="Filter by Cuisine..." value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)} className="col-span-1 p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                        <button onClick={() => setShowDietary(!showDietary)} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600">Dietary Filters {dietaryFilters.length > 0 ? `(${dietaryFilters.length})` : ''} {showDietary ? '▲' : '▼'}</button>
                        <button onClick={resetFilters} className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600">Reset Filters</button>
                    </div>
                    {showDietary && (
                        <div className="p-3 bg-gray-800 rounded-lg max-h-24 overflow-y-auto">
                            {allDietaryTags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                {allDietaryTags.map(tag => (
                                    <label key={tag} className="flex items-center gap-2 px-2 py-1 bg-gray-700 rounded-md text-xs cursor-pointer">
                                        <input type="checkbox" checked={dietaryFilters.includes(tag)} onChange={() => handleDietaryChange(tag)} className="form-checkbox bg-gray-600 border-gray-500 rounded-sm text-green-500 focus:ring-green-500"/>{tag}
                                    </label>
                                ))}
                                </div>
                            ) : <p className="text-xs text-gray-500 text-center">No dietary tags found in your saved recipes.</p>}
                        </div>
                    )}
                    <label className="flex items-center gap-2 pt-2 cursor-pointer text-sm"><input type="checkbox" checked={isFusionMode} onChange={() => { setIsFusionMode(!isFusionMode); setFusionSelection([]); }} className="form-checkbox bg-gray-700 border-gray-600 rounded text-green-500 focus:ring-green-500" />{t.fusionMode}</label>
                </div>

                <main className="p-4 overflow-y-auto flex-grow">
                    {filteredAndSortedRecipes.length > 0 ? (
                        <ul className="space-y-3">
                            {filteredAndSortedRecipes.map(recipe => (
                                <li key={recipe.title} className="group relative bg-gray-800 rounded-lg transition-all hover:bg-gray-700/60 shadow-md hover:shadow-lg">
                                    <button onClick={() => isFusionMode ? handleFusionSelect(recipe) : onSelectRecipe(recipe)} className={`w-full text-left rounded-lg flex items-start gap-4 p-3 ${isFusionMode && fusionSelection.find(r=>r.title === recipe.title) ? 'ring-2 ring-green-500' : ''}`}>
                                        {recipe.base64Image ? (
                                            <div className="w-32 h-32 rounded-md flex-shrink-0 relative overflow-hidden bg-gray-700">
                                                <img src={`data:image/png;base64,${recipe.base64Image}`} alt={recipe.title} className="w-full h-full object-cover" />
                                                <div className="steam-container">
                                                    <span style={{ animationDelay: '0s' }}></span>
                                                    <span style={{ animationDelay: '1.5s' }}></span>
                                                    <span style={{ animationDelay: '3s' }}></span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-32 h-32 bg-gray-700 rounded-md flex-shrink-0 flex items-center justify-center text-gray-500 text-xs">No Image</div>
                                        )}
                                        <div className="flex-grow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-white pr-2"><Highlight text={recipe.title} highlight={debouncedSearchTerm} /></h3>
                                                    <p className="text-xs text-gray-400">{recipe.cuisine}</p>
                                                </div>
                                                <ReadOnlyStars rating={recipe.rating} />
                                            </div>
                                            <p className="text-sm text-gray-400 line-clamp-2 mt-1"><Highlight text={recipe.description} highlight={debouncedSearchTerm} /></p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700/50">
                                                {recipe.prepTime && <div className="flex items-center gap-1.5" title="Prep Time"><DetailIcon icon="prep" /> {recipe.prepTime}</div>}
                                                <div className="flex items-center gap-1.5" title="Cook Time"><DetailIcon icon="cook" /> {recipe.cookingTime}</div>
                                                <div className="flex items-center gap-1.5" title="Difficulty"><DetailIcon icon="difficulty" /> {recipe.difficulty}</div>
                                            </div>
                                        </div>
                                    </button>
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onToggleFavorite(recipe.title)} className="p-2 rounded-full bg-gray-900/50 hover:bg-gray-900" title="Toggle favorite">
                                            <FavoriteStarIcon isFavorite={!!recipe.isFavorite} />
                                        </button>
                                        {!isFusionMode && (<button onClick={() => onEditRecipe(recipe)} className="p-2 rounded-full bg-gray-900/50 text-gray-300 hover:bg-blue-600 hover:text-white" title="Edit Recipe"><EditIcon /></button>)}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : ( 
                        <div className="text-center text-gray-500 pt-8">
                             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                             <h3 className="mt-4 font-semibold">No Recipes Found</h3>
                             <p className="text-sm">Try adjusting your search or filters.</p>
                             {savedRecipes.length === 0 && <p className="text-sm mt-2">Your recipe book is empty. Start a chat to find and save your first recipe!</p>}
                        </div>
                    )}
                </main>
                
                {isFusionMode && (
                    <footer className="p-4 border-t border-gray-700 flex-shrink-0">
                        <button onClick={handleFuseClick} disabled={fusionSelection.length !== 2} className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition">{t.fuseButton} ({fusionSelection.length}/2)</button>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default React.memo(SavedRecipesModal);