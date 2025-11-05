import React from 'react';

interface CookingModeChoiceModalProps {
    onClose: () => void;
    onSelectSimple: () => void;
    onSelectAdvanced: () => void;
    onSelectZen: () => void;
}

const CookingModeChoiceModal: React.FC<CookingModeChoiceModalProps> = ({ onClose, onSelectSimple, onSelectAdvanced, onSelectZen }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Choose Your Guide</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 space-y-3">
                    <p className="text-gray-400 text-center mb-2">How would you like to cook this recipe?</p>
                    <button 
                        onClick={onSelectSimple} 
                        className="w-full p-4 bg-gray-700/80 text-white font-semibold rounded-lg hover:bg-gray-700 transition text-left"
                    >
                        <h3 className="text-lg">Guided Cooking</h3>
                        <p className="text-sm text-gray-400 font-normal">An interactive dashboard with timers and a step-by-step checklist.</p>
                    </button>
                    <button 
                        onClick={onSelectAdvanced} 
                        className="w-full p-4 bg-green-800/80 text-white font-semibold rounded-lg hover:bg-green-700 transition text-left"
                    >
                        <h3 className="text-lg">Cook Sous Chef</h3>
                        <p className="text-sm text-gray-300 font-normal">Real-time voice conversation for interactive help and questions.</p>
                    </button>
                    <button 
                        onClick={onSelectZen} 
                        className="w-full p-4 bg-blue-800/80 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-left"
                    >
                        <h3 className="text-lg">Zen Mode</h3>
                        <p className="text-sm text-gray-300 font-normal">A minimalist, distraction-free view with gesture controls.</p>
                    </button>
                </main>
            </div>
        </div>
    );
};

export default CookingModeChoiceModal;