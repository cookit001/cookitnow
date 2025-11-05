import React, { useState, useEffect, useCallback } from 'react';
import type { Recipe, Language } from '../types';
import * as geminiService from '../services/geminiService';
import { translations } from '../translations.ts';

interface ImageGeneratorModalProps {
    recipe: Recipe;
    onClose: () => void;
    language: Language;
    canPerformAction: () => boolean;
    recordAction: () => void;
}

const STYLES = [
    "Default", "Gourmet Plating", "Rustic Style", "Food Magazine", "Studio Lighting", "Dark & Moody"
];

const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({ recipe, onClose, language, canPerformAction, recordAction }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [prompt, setPrompt] = useState(recipe.title);
    const [style, setStyle] = useState("Default");
    // Fix: Cast translation object to a more specific type to avoid property access errors.
    const t = translations[language].imageGeneratorModal as Record<string, string>;

    const generate = useCallback(async () => {
        if (!canPerformAction()) {
            onClose(); // Close modal if limit is reached
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const base64ImageBytes = await geminiService.generateDishImage(prompt, style);
            setImageUrl(`data:image/png;base64,${base64ImageBytes}`);
            recordAction();
        } catch (err: any) {
            setError(err.message || t.error);
        } finally {
            setIsLoading(false);
        }
    }, [prompt, style, t.error, canPerformAction, recordAction, onClose]);

    useEffect(() => {
        generate();
    }, []); // Run only once on mount

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 animate-slide-in-up-fade" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-lg shadow-xl w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{t.title}: {recipe.title}</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 flex justify-center items-center h-64 md:h-96 bg-gray-800 rounded-lg">
                            {isLoading && <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>}
                            {error && <p className="text-red-400 text-center">{error}</p>}
                            {imageUrl && <img src={imageUrl} alt={`Visualization of ${recipe.title}`} className="max-w-full max-h-full object-contain rounded-md" />}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-gray-400 block mb-1">{t.promptLabel}</label>
                                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg" />
                            </div>
                             <div>
                                <label className="text-sm font-semibold text-gray-400 block mb-1">{t.styleLabel}</label>
                                <select value={style} onChange={e => setStyle(e.target.value)} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg">
                                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                             <button onClick={generate} disabled={isLoading} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-600">
                                {isLoading ? t.generating : t.generateButton}
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default React.memo(ImageGeneratorModal);