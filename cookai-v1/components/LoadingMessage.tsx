import React, { useState, useEffect } from 'react';
import CookLogo from './CookLogo.tsx';

const STEPS: Record<string, string[]> = {
  'generating-recipe': ['Analyzing your request...', 'Brainstorming ideas...', 'Consulting culinary knowledge...', 'Structuring the recipe...', 'Adding finishing touches...'],
  'generating-variations': ['Revisiting the original recipe...', 'Exploring creative twists...', 'Developing new flavor profiles...', 'Writing up the variations...'],
  'searching-tutorials': ['Understanding the recipe steps...', 'Sending query to Google...', 'Scanning top search results...', 'Filtering for the best sources...', 'Verifying links are active...'],
  'searching-assistant': ['Thinking about your question...', 'Searching for up-to-date information...', 'Synthesizing the best answer...'],
  'analyzing-image': ['Processing image data...', 'Identifying potential ingredients...', 'Cross-referencing with recipes...', 'Suggesting delicious ideas...'],
  'fusing-recipes': ['Deconstructing both recipes...', 'Finding complementary flavors...', 'Creating a new structure...', 'Innovating a fusion dish...'],
  'searching-trending': ['Scanning the latest food trends...', 'Identifying popular dishes...', 'Selecting a tasty suggestion...'],
  'thinking': ['Cook AI is thinking...'],
};

const LoadingMessage: React.FC<{ jobType: string; onCancel: () => void; }> = ({ jobType, onCancel }) => {
    const messages = STEPS[jobType] || STEPS['thinking'];
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Reset step when jobType changes
        setStep(0);
        
        const interval = setInterval(() => {
            setStep(prev => (prev + 1) % messages.length);
        }, 1800); // Cycle through messages every 1.8 seconds

        return () => clearInterval(interval);
    }, [jobType, messages.length]);

    return (
        <div className="flex items-center justify-between gap-3 p-2 w-full">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 shrink-0">
                    <CookLogo className="w-full h-full animate-spin" />
                </div>
                <div className="text-gray-300 text-sm transition-opacity duration-500">
                    {messages[step]}
                </div>
            </div>
            <button onClick={onCancel} className="text-xs text-gray-400 hover:text-white hover:bg-gray-600 rounded px-2 py-1 transition-colors">Cancel</button>
        </div>
    );
};

export default LoadingMessage;