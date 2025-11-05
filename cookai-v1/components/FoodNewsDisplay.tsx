import React from 'react';
import type { FoodNewsItem } from '../types.ts';
import { sanitizeHtml } from '../services/security.ts';

interface FoodNewsDisplayProps {
    newsItems: FoodNewsItem[];
}

const NewsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h.01M17 17h.01" />
    </svg>
);


const FoodNewsDisplay: React.FC<FoodNewsDisplayProps> = ({ newsItems }) => {
    return (
        <div className="space-y-6">
            {newsItems.map((item, index) => (
                <div key={index} className="bg-gray-800/50 p-6 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <NewsIcon />
                        <h2 
                            className="text-xl font-bold text-white"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.title) }}
                        />
                    </div>
                    <p 
                        className="text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.summary) }}
                    />
                    {item.source && item.source.uri && (
                        <div className="mt-4">
                            <a 
                                href={item.source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center gap-2 text-sm text-blue-400 font-semibold hover:text-blue-300 hover:underline"
                            >
                                Read more at {item.source.title || new URL(item.source.uri).hostname}
                                <svg xmlns="http://www.w.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default FoodNewsDisplay;