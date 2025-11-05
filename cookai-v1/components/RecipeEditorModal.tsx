import React, { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { useToast } from './ToastProvider.tsx';

interface RecipeEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe | null;
    onSave: (originalTitle: string, updatedRecipe: Recipe, mode: 'overwrite' | 'new') => void;
}

const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({ isOpen, onClose, recipe, onSave }) => {
    const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null);
    const toast = useToast();

    useEffect(() => {
        if (recipe) {
            // Create a deep copy to avoid mutating the original object
            setEditedRecipe(JSON.parse(JSON.stringify(recipe)));
        }
    }, [recipe]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedRecipe(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleListChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: 'ingredients' | 'instructions') => {
        setEditedRecipe(prev => prev ? { ...prev, [field]: e.target.value.split('\n').filter(line => line.trim() !== '') } : null);
    };

    const handleSave = (mode: 'overwrite' | 'new') => {
        if (!recipe || !editedRecipe) return;

        if (!editedRecipe.title.trim()) {
            toast.addToast('Recipe title cannot be empty.', 'error');
            return;
        }

        if (window.confirm('Are you sure you want to save these changes?')) {
            onSave(recipe.title, editedRecipe, mode);
        }
    };

    const handleClose = () => {
        const hasChanges = JSON.stringify(recipe) !== JSON.stringify(editedRecipe);
        if (hasChanges) {
            if (window.confirm('Discard changes? Unsaved edits will be lost.')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!isOpen || !editedRecipe) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">Edit Recipe</h2>
                    <button onClick={handleClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 overflow-y-auto flex-grow space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-400 block mb-1">Title</label>
                        <input type="text" name="title" value={editedRecipe.title} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg" />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-400 block mb-1">Description</label>
                        <textarea name="description" value={editedRecipe.description} onChange={handleChange} rows={3} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg resize-y" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-400 block mb-1">Cooking Time</label>
                            <input type="text" name="cookingTime" value={editedRecipe.cookingTime} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-400 block mb-1">Servings</label>
                            <input type="text" name="servings" value={editedRecipe.servings} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg" />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-400 block mb-1">Difficulty</label>
                            <select name="difficulty" value={editedRecipe.difficulty} onChange={handleChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg">
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-gray-400 block mb-1">Ingredients (one per line)</label>
                        <textarea name="ingredients" value={editedRecipe.ingredients.join('\n')} onChange={(e) => handleListChange(e, 'ingredients')} rows={8} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg resize-y" />
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-gray-400 block mb-1">Instructions (one per line)</label>
                        <textarea name="instructions" value={editedRecipe.instructions.join('\n')} onChange={(e) => handleListChange(e, 'instructions')} rows={10} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg resize-y" />
                    </div>
                </main>
                <footer className="p-4 border-t border-gray-700 flex-shrink-0 flex justify-end gap-3">
                    <button onClick={handleClose} className="px-4 py-2 bg-gray-700 text-white font-semibold text-sm rounded-lg hover:bg-gray-600 transition">Cancel</button>
                    <button onClick={() => handleSave('overwrite')} className="px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-500 transition">Overwrite Existing</button>
                    <button onClick={() => handleSave('new')} className="px-4 py-2 bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-500 transition">Save as New Recipe</button>
                </footer>
            </div>
        </div>
    );
};

export default RecipeEditorModal;