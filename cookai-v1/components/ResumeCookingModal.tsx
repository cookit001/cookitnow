import React from 'react';

interface ResumeCookingModalProps {
    recipeTitle: string;
    onContinue: () => void;
    onDismiss: () => void;
}

const ResumeCookingModal: React.FC<ResumeCookingModalProps> = ({ recipeTitle, onContinue, onDismiss }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
                <h2 className="text-xl font-bold mb-2">Resume Cooking?</h2>
                <p className="text-gray-400 mb-6">It looks like you were in the middle of cooking "{recipeTitle}". Would you like to continue where you left off?</p>
                <div className="flex gap-4">
                    <button onClick={onDismiss} className="w-full py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition">
                        Dismiss
                    </button>
                    <button onClick={onContinue} className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition">
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResumeCookingModal;
