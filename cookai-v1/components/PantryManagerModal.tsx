import React, { useState, useMemo, useEffect } from 'react';
import type { PantryItem, PantryCategory, UserProfile } from '../types';
import { PANTRY_CATEGORIES } from '../types';
import { translations } from '../translations.ts';
import type { Language } from '../types.ts';
import { categorizePantryItem } from '../services/geminiService';

interface PantryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
    language: Language;
}

const getExpiryStatus = (expiryDate?: string): 'expiring' | 'expired' | 'fresh' => {
    if (!expiryDate) return 'fresh';
    const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring';
    return 'fresh';
};

const ExpiryIcon: React.FC<{ status: 'expiring' | 'expired' | 'fresh' }> = ({ status }) => {
    if (status === 'expiring') {
        return <span className="text-yellow-400" title="Expiring soon">⚠️</span>;
    }
    if (status === 'expired') {
        return <span className="text-red-500" title="Expired">🛑</span>;
    }
    return null;
};

const PantryManagerModal: React.FC<PantryManagerModalProps> = ({ isOpen, onClose, userProfile, onUpdateProfile, language }) => {
    const [itemName, setItemName] = useState('');
    const [quantity, setQuantity] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [category, setCategory] = useState<PantryCategory>('Other');
    const [searchTerm, setSearchTerm] = useState('');
    const [isCategorizing, setIsCategorizing] = useState(false);
    // Fix: Cast translation object to a more specific type to avoid property access errors.
    const t = translations[language].pantryModal as Record<string, string>;
    const pantryItems = userProfile.pantry;

    // Debounce effect for auto-categorization
    useEffect(() => {
        if (itemName.trim().length < 3) {
            return;
        }

        const handler = setTimeout(async () => {
            setIsCategorizing(true);
            try {
                const suggestedCategory = await categorizePantryItem(itemName);
                setCategory(suggestedCategory);
            } catch (error) {
                console.error("Auto-categorization failed", error);
            } finally {
                setIsCategorizing(false);
            }
        }, 800);

        return () => {
            clearTimeout(handler);
        };
    }, [itemName]);

    const handleAddItem = () => {
        if (itemName.trim() && quantity.trim() && !pantryItems.some(i => i.name.toLowerCase() === itemName.trim().toLowerCase())) {
            const newItem: PantryItem = { 
                name: itemName.trim(), 
                category, 
                quantity: quantity.trim(),
                addedDate: new Date().toISOString(),
                expiryDate: expiryDate || undefined,
            };
            const newHistoryItem = { name: newItem.name, addedAt: new Date().toISOString() };
            onUpdateProfile({
                ...userProfile,
                pantry: [...pantryItems, newItem],
                pantryHistory: [...(userProfile.pantryHistory || []), newHistoryItem]
            });
            setItemName('');
            setQuantity('');
            setExpiryDate('');
            setCategory('Other');
        }
    };
    
    const handleRemoveItem = (itemName: string) => {
        onUpdateProfile({
            ...userProfile,
            pantry: pantryItems.filter(item => item.name !== itemName)
        });
    };

    const { expiringItems, filteredItems } = useMemo(() => {
        const expiring = pantryItems.filter(item => {
            const status = getExpiryStatus(item.expiryDate);
            return status === 'expiring' || status === 'expired';
        }).sort((a,b) => (new Date(a.expiryDate || 0).getTime()) - (new Date(b.expiryDate || 0).getTime()));

        const filtered = pantryItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return { expiringItems: expiring, filteredItems: filtered };
    }, [pantryItems, searchTerm]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-slide-in-up-fade" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold">{t.title}</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
                        <input
                            type="text"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder={t.placeholder}
                            className="md:col-span-2 p-2 bg-gray-800 border border-gray-600 rounded-lg"
                        />
                        <input
                            type="text"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Quantity (e.g., 1kg)"
                            className="p-2 bg-gray-800 border border-gray-600 rounded-lg"
                        />
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            title="Optional: Expiry Date"
                            className="p-2 bg-gray-800 border border-gray-600 rounded-lg"
                        />
                        <select 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value as PantryCategory)} 
                            disabled={isCategorizing}
                            className="p-2 bg-gray-800 border border-gray-600 rounded-lg"
                        >
                            {PANTRY_CATEGORIES.map(c => <option key={c} value={c}>{t[c.toLowerCase()]}</option>)}
                        </select>
                    </div>
                     <button onClick={handleAddItem} disabled={isCategorizing || !itemName.trim() || !quantity.trim()} className="w-full mb-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isCategorizing ? 'Categorizing...' : t.addButton}
                    </button>
                    
                    {expiringItems.length > 0 && (
                        <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                            <h3 className="font-bold text-yellow-300 mb-2">Expiring Soon</h3>
                            <div className="flex flex-wrap gap-2">
                                {expiringItems.map(item => (
                                     <div key={item.name} className="flex items-center bg-gray-700 text-sm pl-3 pr-2 py-1 rounded-full">
                                        <ExpiryIcon status={getExpiryStatus(item.expiryDate)} />
                                        <span className="ml-1.5">{item.name} ({item.quantity})</span>
                                        <button onClick={() => handleRemoveItem(item.name)} className="ml-2 text-gray-400 hover:text-white">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-6">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                    </div>

                    {pantryItems.length === 0 ? (
                         <div className="text-center text-gray-500 pt-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            <h3 className="mt-4 font-semibold">Your Pantry is Empty</h3>
                            <p className="text-sm">Add ingredients you have at home to get better recipe suggestions.</p>
                        </div>
                    ) : filteredItems.length === 0 && searchTerm ? (
                        <p className="text-center text-gray-500">No items match your search.</p>
                    ) : (
                        <div className="space-y-4">
                            {PANTRY_CATEGORIES.map(cat => {
                                const itemsInCategory = filteredItems
                                    .filter(item => item.category === cat)
                                    .sort((a, b) => a.name.localeCompare(b.name));

                                if (itemsInCategory.length === 0) return null;
                                
                                return (
                                    <div key={cat}>
                                        <h3 className="font-semibold text-green-400 mb-2">{t[cat.toLowerCase()]}</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {itemsInCategory.map(item => (
                                                <div key={item.name} className="flex items-center bg-gray-700 text-sm pl-3 pr-2 py-1 rounded-full">
                                                    <ExpiryIcon status={getExpiryStatus(item.expiryDate)} />
                                                    <span className="ml-1.5">{item.name} ({item.quantity})</span>
                                                    <button onClick={() => handleRemoveItem(item.name)} className="ml-2 text-gray-400 hover:text-white">&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default React.memo(PantryManagerModal);
