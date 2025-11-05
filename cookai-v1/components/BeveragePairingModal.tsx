import React, { useState, useEffect } from 'react';
import type { Recipe, BeveragePairings } from '../types.ts';
import * as geminiService from '../services/geminiService.ts';
import { useAppContext } from '../App.tsx';

interface BeveragePairingModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
}

const Loader: React.FC = () => (
    <div className="flex justify-center items-center p-8">
      <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-400 rounded-full animate-spin"></div>
    </div>
);

const BeveragePairingModal: React.FC<BeveragePairingModalProps> = ({ isOpen, onClose, recipe }) => {
    const [pairings, setPairings] = useState<BeveragePairings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { userProfile } = useAppContext();

    useEffect(() => {
        if (isOpen) {
            const fetchPairings = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const result = await geminiService.getBeveragePairing(recipe, userProfile);
                    setPairings(result);
                } catch (err: any) {
                    setError(err.message || "Failed to find pairings.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPairings();
        }
    }, [isOpen, recipe, userProfile]);

    if (!isOpen) return null;

    const renderPairingCategory = (title: string, items: { name: string; reason: string }[] | undefined) => {
        if (!items || items.length === 0) return null;
        return (
            <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">{title}</h3>
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="p-3 bg-gray-800 rounded-lg">
                            <h4 className="font-semibold text-white">{item.name}</h4>
                            <p className="text-sm text-gray-400">{item.reason}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Beverage Pairings</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 max-h-[60vh] overflow-y-auto">
                    {isLoading && <Loader />}
                    {error && <p className="text-center text-red-400">{error}</p>}
                    {!isLoading && !error && pairings && (
                        <div className="space-y-6">
                            {renderPairingCategory('Wine Pairings', pairings.wine)}
                            {renderPairingCategory('Beer Pairings', pairings.beer)}
                            {renderPairingCategory('Non-Alcoholic Pairings', pairings.nonAlcoholic)}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BeveragePairingModal;