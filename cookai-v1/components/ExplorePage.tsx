import React, { useState, useEffect } from 'react';
import { getExplorePageContent } from '../services/geminiService';
import type { ExplorePageContent, UserProfile } from '../types';

interface ExplorePageProps {
  onSelectRecipe: (prompt: string) => void;
  profile: UserProfile;
}

// Skeleton Loader Components
const SkeletonCard: React.FC<{className?: string}> = ({className}) => (
    <div className={`bg-gray-800 p-4 rounded-lg animate-pulse ${className}`}>
        <div className="h-40 bg-gray-700 rounded-md mb-4"></div>
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6 mt-1"></div>
    </div>
);

const SkeletonText: React.FC<{className?: string}> = ({className}) => (
    <div className={`space-y-2 ${className}`}>
        <div className="h-5 bg-gray-700 rounded w-1/3"></div>
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-4/5"></div>
    </div>
);

const ExplorePage: React.FC<ExplorePageProps> = ({ onSelectRecipe, profile }) => {
    const [content, setContent] = useState<ExplorePageContent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getExplorePageContent(profile);
                setContent(data);
            } catch (err: any) {
                setError(err.message || "Failed to load content.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, [profile]);

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 space-y-8">
                <SkeletonCard className="col-span-1 md:col-span-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <SkeletonText />
                    <SkeletonText />
                </div>
            </div>
        );
    }
    
    if (error) {
        return <div className="p-8 text-center text-red-400">{error}</div>;
    }

    if (!content) {
        return <div className="p-8 text-center text-gray-500">No content available to explore.</div>;
    }

    const { dishOfTheDay, cuisineSpotlight, techniqueOfTheWeek } = content;

    return (
        <div className="p-4 sm:p-6 text-gray-200">
             <header className="mb-6">
                <h1 className="text-4xl font-bold text-white">Explore</h1>
                <p className="text-lg text-gray-400 mt-1">Discover new flavors, techniques, and culinary inspiration.</p>
             </header>
             
             <div className="space-y-8">
                {/* Dish of the Day */}
                {dishOfTheDay && (
                    <div className="bg-gray-800/50 rounded-xl overflow-hidden shadow-lg grid grid-cols-1 md:grid-cols-2 items-center">
                        <div className="p-6">
                             <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider">Dish of the Day</h2>
                             <h3 className="text-3xl font-bold text-white mt-1">{dishOfTheDay.title}</h3>
                             <p className="text-gray-300 mt-3">{dishOfTheDay.description}</p>
                             <button onClick={() => onSelectRecipe(dishOfTheDay.prompt)} className="mt-6 px-5 py-2.5 bg-purple-600 text-white font-bold text-sm rounded-lg hover:bg-purple-500 transition">
                                Get Recipe
                             </button>
                        </div>
                        <div className="w-full h-80 relative bg-gray-700">
                            {dishOfTheDay.base64Image ? (
                                <>
                                    <img src={`data:image/png;base64,${dishOfTheDay.base64Image}`} alt={dishOfTheDay.title} className="w-full h-full object-cover" />
                                    <div className="steam-container">
                                        <span style={{ animationDelay: '0s' }}></span>
                                        <span style={{ animationDelay: '1.5s' }}></span>
                                        <span style={{ animationDelay: '3s' }}></span>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-gray-500">Image not available</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Cuisine Spotlight */}
                    {cuisineSpotlight && (
                         <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg">
                            <h2 className="text-sm font-bold text-green-400 uppercase tracking-wider">Cuisine Spotlight</h2>
                            <h3 className="text-2xl font-bold text-white mt-1">{cuisineSpotlight.name}</h3>
                            <p className="text-gray-300 mt-2 mb-4 text-sm">{cuisineSpotlight.description}</p>
                            <div className="space-y-2">
                                {(cuisineSpotlight.recipes || []).map(recipe => (
                                    <button key={recipe.name} onClick={() => onSelectRecipe(recipe.prompt)} className="w-full text-left text-sm p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">
                                        {recipe.name}
                                    </button>
                                ))}
                            </div>
                         </div>
                    )}

                     {/* Technique of the Week */}
                    {techniqueOfTheWeek && (
                         <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg">
                            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Technique of the Week</h2>
                            <h3 className="text-2xl font-bold text-white mt-1">{techniqueOfTheWeek.name}</h3>
                            <p className="text-gray-300 mt-2 text-sm">{techniqueOfTheWeek.description}</p>
                         </div>
                    )}
                </div>
             </div>
        </div>
    );
};

export default ExplorePage;
