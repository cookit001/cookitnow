import React, { useState, useMemo } from 'react';
import type { ShoppingListItem } from '../types.ts';
// Fix: Import all of geminiService to fix 'Cannot find name' error and make usage consistent.
import * as geminiService from '../services/geminiService.ts';
import { useToast } from '../components/ToastProvider.tsx';

interface ShoppingListPageProps {
    onBack: () => void;
    items: ShoppingListItem[];
    onUpdateItems: (items: ShoppingListItem[]) => void;
}

const OptimizeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

const ShoppingListPage: React.FC<ShoppingListPageProps> = ({ onBack, items: initialItems, onUpdateItems }) => {
    const [conversationalInput, setConversationalInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const toast = useToast();

    // Fix: Memoize and sanitize the `items` prop to ensure it's always a stable array, preventing potential type errors and re-renders.
    const items = useMemo(() => (Array.isArray(initialItems) ? initialItems : []), [initialItems]);

    const { uncompleted, completed } = useMemo(() => {
        const uncompleted = items.filter(item => !item.completed);
        const completed = items.filter(item => item.completed);
        return { uncompleted, completed };
    }, [items]);
    
    const groupedItems = useMemo(() => {
        return uncompleted.reduce((acc, item) => {
            const category = item.category || 'General';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as Record<string, ShoppingListItem[]>);
    }, [uncompleted]);

    const handleConversationalAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = conversationalInput.trim();
        if (!trimmedInput) return;

        setIsProcessing(true);
        try {
            // Fix: Use geminiService prefix for consistency.
            const extractedItems = await geminiService.extractItemsFromList(trimmedInput);
            
            let itemsToAdd: string[] = [];
            if (Array.isArray(extractedItems) && extractedItems.length > 0) {
                itemsToAdd = extractedItems;
            } else {
                itemsToAdd = [trimmedInput];
            }

            const existingItemsLower = new Set(items.map(i => i.text.toLowerCase()));
            const itemsToCategorize = itemsToAdd
                .map(text => String(text).trim())
                .filter(text => text && !existingItemsLower.has(text.toLowerCase()));

            if (itemsToCategorize.length > 0) {
                const newItemsPromises = itemsToCategorize.map(async (text) => {
                    const category = await geminiService.categorizePantryItem(text);
                    return {
                        id: Date.now() + Math.random(),
                        text,
                        completed: false,
                        category,
                    };
                });
                const newItems = await Promise.all(newItemsPromises);

                onUpdateItems([...items, ...newItems]);
                toast.addToast(`${newItems.length} new item(s) added to your list.`, 'success');
                setConversationalInput('');
            } else {
                toast.addToast('All items are already on your list.', 'info');
            }

        } catch (error: any) {
            toast.addToast(error.message, 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleToggleItem = (id: number) => {
        onUpdateItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
    };

    const handleRemoveItem = (id: number) => {
        onUpdateItems(items.filter(item => item.id !== id));
    };

    const handleClearCompleted = () => {
        onUpdateItems(items.filter(item => !item.completed));
    };

    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear the entire shopping list?')) {
            onUpdateItems([]);
        }
    };

    const handleOptimize = async () => {
        const uncompletedItems = items.filter(item => !item.completed);
        if (uncompletedItems.length === 0) {
            toast.addToast('Add some items before optimizing!', 'info');
            return;
        }
        setIsOptimizing(true);
        try {
            // Fix: Use geminiService prefix for consistency.
            const categorizedResult = await geminiService.optimizeShoppingList(uncompletedItems.map(i => i.text));
            
            if (!Array.isArray(categorizedResult)) {
                throw new Error("Could not optimize list, unexpected format received.");
            }
            
            const categoryMap = new Map<string, string>();
            
            // Fix: Replaced forEach with a more robust for...of loop and stricter type checks 
            // to handle potentially malformed API responses, resolving the underlying cause of the type error.
            for (const group of categorizedResult) {
                if (group && typeof group === 'object' && 'category' in group && typeof group.category === 'string' && 'items' in group && Array.isArray(group.items)) {
                    for (const itemName of group.items) {
                        if (typeof itemName === 'string') {
                            categoryMap.set(itemName.toLowerCase(), group.category);
                        }
                    }
                }
            }
    
            const newItems = items.map(item => {
                if (!item.completed) {
                    const foundCategory = categoryMap.get(item.text.toLowerCase());
                    if (foundCategory) {
                        return { ...item, category: foundCategory };
                    }
                }
                return item;
            });
    
            onUpdateItems(newItems);
            toast.addToast('Your list has been optimized!', 'success');
        } catch (error: any) {
            toast.addToast(error.message, 'error');
        } finally {
            setIsOptimizing(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col text-gray-200">
            <header className="p-4 flex items-center gap-4 flex-shrink-0 border-b border-gray-700/80">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Back to chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">Shopping List</h1>
            </header>

            <main className="p-4 overflow-y-auto flex-grow">
                {items.length === 0 ? (
                    <div className="text-center text-gray-500 pt-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        <p className="mt-4">Your shopping list is empty.</p>
                        <p className="text-sm">Use the input below to add items.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedItems).sort(([catA], [catB]) => catA.localeCompare(catB)).map(([category, catItems]) => (
                            <div key={category}>
                                <h3 className="font-semibold text-green-400 mb-2">{category}</h3>
                                <ul className="space-y-2">
                                    {catItems.map(item => (
                                        <li key={item.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-md">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={false} onChange={() => handleToggleItem(item.id)} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 rounded text-green-500 focus:ring-green-500" />
                                                <span>{item.text}</span>
                                            </label>
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-gray-500 hover:text-red-400"><TrashIcon /></button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}

                        {completed.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-gray-700">
                                <h3 className="font-semibold text-gray-500 mb-2">Completed Items</h3>
                                <ul className="space-y-2">
                                    {completed.map(item => (
                                        <li key={item.id} className="flex items-center justify-between p-2 bg-gray-800 rounded-md opacity-60">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input type="checkbox" checked={true} onChange={() => handleToggleItem(item.id)} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 rounded text-green-500 focus:ring-green-500" />
                                                <span className="line-through">{item.text}</span>
                                            </label>
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-gray-500 hover:text-red-400"><TrashIcon /></button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <footer className="p-4 flex-shrink-0 border-t border-gray-700/80 space-y-4 bg-gray-800/50">
                <form onSubmit={handleConversationalAdd} className="flex gap-2">
                    <input
                        type="text"
                        value={conversationalInput}
                        onChange={(e) => setConversationalInput(e.target.value)}
                        placeholder="e.g., I need milk, bread, and a dozen eggs..."
                        className="flex-grow p-2 bg-gray-900 border border-gray-700 rounded-lg"
                        disabled={isProcessing}
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:bg-gray-500" disabled={isProcessing}>
                        {isProcessing ? 'Adding...' : 'Add'}
                    </button>
                </form>
                <div className="flex flex-wrap justify-between items-center gap-2">
                    <button onClick={handleOptimize} disabled={isOptimizing} className="px-4 py-2 bg-purple-600 text-white font-semibold text-sm rounded-lg hover:bg-purple-500 transition flex items-center disabled:bg-gray-600">
                        <OptimizeIcon />
                        {isOptimizing ? 'Optimizing...' : 'Optimize List'}
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handleClearCompleted} className="px-3 py-2 text-xs bg-gray-700 rounded-lg hover:bg-gray-600">Clear Completed</button>
                        <button onClick={handleClearAll} className="px-3 py-2 text-xs bg-red-800 rounded-lg hover:bg-red-700">Clear All</button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ShoppingListPage;