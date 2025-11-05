import React, { useState, useEffect } from 'react';
import * as geminiService from '../services/geminiService.ts';
import { useAppContext } from '../App.tsx';

interface InitialViewProps {
    onSuggestionClick: (suggestion: string) => void;
    trendingDishName: string | null;
}

const LeafIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.121 15.536A9.003 9.003 0 0112 15c-1.85 0-3.579.5-5.121 1.342M12 15V3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrendingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const MoodIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const ICONS = [<LeafIcon />, <ClockIcon />, <MoodIcon />];

const InitialView: React.FC<InitialViewProps> = ({ onSuggestionClick, trendingDishName }) => {
    const { userProfile } = useAppContext();
    const [suggestions, setSuggestions] = useState<{ text: string; prompt: string }[]>([]);

    useEffect(() => {
        geminiService.getInitialSuggestions(userProfile)
            .then(setSuggestions)
            .catch(err => {
                console.error("Could not fetch dynamic suggestions:", err);
                // Set static fallbacks on error
                setSuggestions([
                    { text: "Healthy dinner for two", prompt: "Healthy dinner for two" },
                    { text: "Quick 30-minute lunch idea", prompt: "Quick 30-minute lunch idea" },
                    { text: "Show me a vegan pasta recipe", prompt: "Show me a vegan pasta recipe" },
                ]);
            });
    }, [userProfile]);
    
    const allSuggestions = [
        { 
            text: trendingDishName ? `Try today's trend: ${trendingDishName}` : "Suggest a popular dish", 
            prompt: trendingDishName ? `recipe for ${trendingDishName}` : "SUGGEST_TRENDING",
            icon: <TrendingIcon />
        },
        ...suggestions.slice(0, 2).map((s, i) => ({ ...s, icon: ICONS[i] })),
        {
            text: 'A comforting recipe for a stressful day',
            prompt: 'I am feeling stressed, suggest a comforting recipe',
            icon: <MoodIcon />
        }
    ];

    return (
        <div className="flex-grow flex flex-col justify-center items-center text-center p-4 h-full animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center shrink-0 mb-6 ring-8 ring-gray-800/30 animate-pulse-intense">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M10 16.5l-5 -3l5 -3l5 3v5.5l-5 3z" />
                    <path d="M10 8l-5 -3l5 -3l5 3l-5 3" />
                    <path d="M15 13.5v5.5l5 3" />
                    <path d="M20 8l-5 -3" />
                </svg>
            </div>
            <h1 className="text-5xl font-bold text-white mb-2">Hello, I'm <span className="text-green-400">Cook</span></h1>
            <p className="text-lg text-gray-400 mb-10 max-w-md">Your personal AI-powered culinary assistant. What are we making today?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full chat-stagger-in">
                {allSuggestions.map(({text, icon, prompt}, index) => (
                    <button
                        key={prompt}
                        onClick={() => onSuggestionClick(prompt)}
                        className={`p-4 bg-gray-900/50 rounded-xl hover:bg-gray-700/50 transition-all duration-300 group flex items-center gap-4 text-left hover:-translate-y-1 hover:shadow-2xl ${index === 0 ? 'ring-2 ring-purple-500/50' : 'ring-1 ring-white/10'}`}
                        style={{animationDelay: `${100 * index}ms`}}
                    >
                        <div className={`w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg group-hover:bg-green-900/50 transition-colors ${index === 0 ? 'text-purple-400' : 'text-green-400'}`}>
                            {icon}
                        </div>
                        <span className="text-gray-200 font-medium text-base flex-1">
                          {text}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default React.memo(InitialView);
