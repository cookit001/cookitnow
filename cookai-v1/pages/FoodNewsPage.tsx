import React, { useState, useEffect } from 'react';
import { getFoodNews } from '../services/geminiService';
import type { FoodNewsItem, Language } from '../types.ts';
import FoodNewsDisplay from '../components/FoodNewsDisplay.tsx';
import { translations } from '../translations.ts';

interface FoodNewsPageProps {
    onBack: () => void;
    language: Language;
}

const Loader: React.FC<{text: string}> = ({ text }) => (
    <div className="flex flex-col items-center justify-center gap-4 p-8 h-full">
      <div className="w-16 h-16 border-4 border-gray-700 border-t-green-400 rounded-full animate-spin"></div>
      <p className="text-lg text-gray-200 font-semibold">{text}</p>
    </div>
);

const FoodNewsPage: React.FC<FoodNewsPageProps> = ({ onBack, language }) => {
    const [newsItems, setNewsItems] = useState<FoodNewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Fix: Cast translation object to a more specific type to avoid property access errors.
    const t = translations[language].foodNews as Record<string, string>;

    useEffect(() => {
        const fetchNews = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const items = await getFoodNews(language);
                if (items && items.length > 0) {
                    setNewsItems(items);
                } else {
                    setError('No news could be fetched at this time.');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to fetch news.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchNews();
    }, [language]);

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 text-gray-200">
             <header className="mb-6 flex items-center gap-4 flex-shrink-0">
                 <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-800 transition-colors" title={t.backButton}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                 </button>
                <h1 className="text-3xl font-bold text-white">{t.title}</h1>
             </header>

            <main className="flex-grow overflow-y-auto">
                {isLoading && <Loader text={t.loading}/>}
                {error && <p className="text-center text-red-500 py-8">{error}</p>}
                
                {!isLoading && !error && newsItems.length > 0 && (
                    <FoodNewsDisplay newsItems={newsItems} />
                )}
            </main>
        </div>
    );
};

export default FoodNewsPage;