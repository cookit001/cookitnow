import React from 'react';
import { translations } from '../translations.ts';
import { useAppContext } from '../App.tsx';

const features = [
    { 
        icon: '🧠', 
        title: 'Intelligent Food Recognition', 
        description: 'Snap a photo of any ingredients and get an instant analysis from our Cook AI chef, including quality notes, creative recipes, and pro "Chef\'s Tips".' 
    },
    { 
        icon: '💬', 
        title: 'Conversational Cook AI Assistant', 
        description: 'Harnessing the power of Gemini 2.5 Pro, our assistant provides deeply reasoned, accurate, and cited answers to your most complex culinary questions.' 
    },
    {
        icon: '💾',
        title: 'Automatic Chat History',
        description: 'Your conversations are automatically saved, creating an evolving cookbook that thinks and learns with you. Never lose an idea again.'
    },
    {
        icon: '❤️',
        title: 'Proactive Health Coach',
        description: 'Integrate with (simulated) health data to receive predictive, personalized nutritional advice that anticipates your needs and keeps you on track with your goals.'
    },
    { 
        icon: '📦', 
        title: 'Smart Pantry Management', 
        description: 'A zero-waste kitchen is now possible. Our Cook AI tracks items, prioritizes ingredients nearing expiry, and helps build your shopping list.' 
    },
    { 
        icon: '📅', 
        title: 'Dynamic Meal Planning', 
        description: 'Generate weekly meal plans from a simple prompt. The Cook AI intelligently reuses ingredients to minimize waste and continuously optimizes to maximize variety.' 
    },
    { 
        icon: '🍳', 
        title: 'Adaptive Cooking Modes', 
        description: 'Experience cooking like never before. Choose from a classic dashboard, a hands-free conversational Sous Chef, or a minimalist Zen Mode with adaptive ambient sounds.' 
    },
     { 
        icon: '🛠️', 
        title: 'Versatile Smart Tools', 
        description: 'Go beyond basic conversions. This Cook AI-powered suite provides ingredient substitutions, beverage pairings, recipe scaling, garnish ideas, and safety tips through natural conversation.' 
    },
    {
        icon: '⚗️',
        title: 'Recipe Fusion Lab',
        description: 'Unleash your creativity by combining any two saved recipes. Our Cook AI will intelligently merge their styles and ingredients to invent a unique fusion dish.'
    },
    { 
        icon: '🏆', 
        title: 'Advanced Gamification', 
        description: 'Level up your cooking skills. Unlock achievements for trying new cuisines, build your cooking streak, and embark on culinary quests to master new techniques.' 
    },
    { 
        icon: '🛡️', 
        title: 'Hyper-Vigilant Allergy Shield', 
        description: 'Your safety is paramount. Our Cook AI cross-references every ingredient against your allergy profile with extreme prejudice, providing a safe and stress-free cooking experience.' 
    },
    { 
        icon: '🔮', 
        title: 'AR Cook Mode (Coming Soon)', 
        description: 'Visualize instructions and measurements overlaid directly onto your kitchen for a truly futuristic culinary experience.' 
    },
];


const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700/50 flex flex-col items-start h-full">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="text-gray-400 mt-2 text-sm flex-grow">{description}</p>
    </div>
);


const CapabilitiesPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { userProfile } = useAppContext();
    
    return (
        <div className="w-full h-full flex flex-col text-gray-200">
            <header className="p-4 flex items-center gap-4 flex-shrink-0 border-b border-gray-700/80">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">App Capabilities</h1>
            </header>

            <main className="flex-grow p-4 sm:p-6 overflow-y-auto">
                <p className="text-lg text-gray-400 max-w-3xl mb-8">
                    Cook is more than just a recipe book. It's an intelligent culinary platform designed to assist, inspire, and simplify your entire cooking journey. Here's a look at what you can do:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <FeatureCard key={index} {...feature} />
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CapabilitiesPage;