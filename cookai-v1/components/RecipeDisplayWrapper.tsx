import React, { useState, useEffect } from 'react';
import type { Recipe, RecipeVariant } from '../types.ts';
import RecipeDisplay from './RecipeDisplay.tsx';
import * as geminiService from '../services/geminiService.ts';
import { useAppContext } from '../App.tsx';


interface RecipeDisplayWrapperProps {
    recipe: Recipe;
    // Fix: Made setMessages optional to align with ChatMessageProps and handle contexts where it's not available.
    setMessages?: React.Dispatch<React.SetStateAction<any[]>>;
    onUpdateRating?: (title: string, rating: number) => void;
    onVisualizeDish: (recipe: Recipe) => void;
    onStartCooking: (recipe: Recipe) => void;
    onSetReminder: (title: string, delay: number) => void;
    onAddToList: (ingredients: string[]) => void;
    onShowSubstituteModal: (recipe: Recipe, ingredient: string) => void;
    onShowPairingModal: (recipe: Recipe) => void;
    onShowScalerModal: (recipe: Recipe) => void;
    onShowAddToPlan: (recipe: Recipe) => void;
    activeJob: string | null;
}

const RecipeDisplayWrapper: React.FC<RecipeDisplayWrapperProps> = (props) => {
    const { 
        recipe, 
        setMessages,
        onUpdateRating,
    } = props;

    const { 
        userProfile, 
        savedRecipes, 
        addMessage, 
        setActiveJob, 
        onSaveRecipe,
        canPerformAction,
        recordAction 
    } = useAppContext();
    
    const savedVersion = savedRecipes.find(r => r.title === recipe.title);
    const [localRecipe, setLocalRecipe] = useState({ ...recipe, isSaved: !!savedVersion, rating: savedVersion?.rating });

    useEffect(() => {
        const latestSavedVersion = savedRecipes.find(r => r.title === recipe.title);
        setLocalRecipe(prev => ({
            ...prev,
            isSaved: !!latestSavedVersion,
            rating: latestSavedVersion?.rating
        }));
    }, [savedRecipes, recipe.title]);

    const handleRatingUpdate = (newRating: number) => {
        // FIX: Added a check for the optional `onUpdateRating` prop before calling it.
        if (localRecipe.isSaved && onUpdateRating) {
            onUpdateRating(localRecipe.title, newRating);
        }
    };

    const handleShowVariations = async (r: Recipe) => {
        if (!canPerformAction('recipe')) return;
        setActiveJob('variations');
        addMessage({ role: 'model', type: 'loading', content: 'generating-variations' });
        try {
            const variations = await geminiService.getRecipeVariations(r, userProfile);
            // Fix: Use optional chaining as setMessages might not be provided.
            setMessages?.(prev => prev.filter(m => m.type !== 'loading'));
            addMessage({ 
                role: 'model', 
                type: 'variations', 
                content: `Variations for ${r.title}`, // Placeholder content for serialization
                data: {
                    variants: variations,
                    originalRecipe: r,
                    onSaveVariation: async (variant: RecipeVariant, original: Recipe) => {
                         const newRecipe: Recipe = {
                            ...original, // Inherit properties like difficulty, servings, etc.
                            title: variant.title, 
                            description: variant.description,
                            ingredients: variant.ingredients, 
                            instructions: variant.instructions, 
                            prepTime: variant.prepTime,
                            cuisine: variant.cuisine,
                            tags: variant.tags,
                            isSaved: true, 
                            rating: 0,
                            base64Image: undefined, // Ensure image is fresh
                        };
                        try {
                            newRecipe.base64Image = await geminiService.generateDishImage(newRecipe.title, 'Food Magazine');
                        } catch(e) {
                            console.error("Failed to generate image for variation", e);
                        }
                        onSaveRecipe(newRecipe);
                    },
                }
            });
            recordAction('recipe');
        } catch (error: any) {
            // Fix: Use optional chaining as setMessages might not be provided.
            setMessages?.(prev => prev.filter(m => m.type !== 'loading'));
            addMessage({ role: 'system', type: 'text', content: error.message });
        } finally {
            setActiveJob(null);
        }
    };
    
    const handleShowTutorials = async (r: Recipe) => {
        setActiveJob('tutorials');
        addMessage({ role: 'model', type: 'loading', content: 'searching-tutorials' });
        try {
            const tutorials = await geminiService.getTutorials(r.title, userProfile.language);
            // Fix: Use optional chaining as setMessages might not be provided.
            setMessages?.(prev => prev.filter(m => m.type !== 'loading'));
            addMessage({
                role: 'model',
                type: 'tutorials',
                content: `Tutorials for ${r.title}`, // Placeholder
                data: tutorials,
            });
        } catch (error: any) {
            // Fix: Use optional chaining as setMessages might not be provided.
            setMessages?.(prev => prev.filter(m => m.type !== 'loading'));
            addMessage({ role: 'system', type: 'text', content: error.message });
        } finally {
            setActiveJob(null);
        }
    };

    return (
        <RecipeDisplay
            {...props}
            recipe={localRecipe}
            onSaveRecipe={onSaveRecipe}
            onUpdateRating={handleRatingUpdate}
            onShowVariations={handleShowVariations}
            onShowTutorials={handleShowTutorials}
        />
    );
};

export default React.memo(RecipeDisplayWrapper);