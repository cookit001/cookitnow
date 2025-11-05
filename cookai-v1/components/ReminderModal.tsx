
import React from 'react';

interface ReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSetReminder: (delayInMs: number) => void;
    recipeTitle: string;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose, onSetReminder, recipeTitle }) => {
    if (!isOpen) return null;

    /**
     * Calculates the delay in milliseconds until a specific hour tomorrow.
     * @param {number} hour - The target hour (0-23).
     * @returns {number} The delay in milliseconds.
     */
    function getDelayForTomorrow(hour: number): number {
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        tomorrow.setHours(hour, 0, 0, 0);
        return tomorrow.getTime() - now.getTime();
    }
    
    const reminderOptions = [
        { label: 'In 10 seconds (Test)', delay: 10 * 1000 },
        { label: 'In 1 hour', delay: 60 * 60 * 1000 },
        { label: 'In 3 hours', delay: 3 * 60 * 60 * 1000 },
        { label: 'Tomorrow at 9 AM', delay: getDelayForTomorrow(9) },
        { label: 'Tomorrow at 6 PM', delay: getDelayForTomorrow(18) },
    ];

    const handleSet = (delay: number) => {
        onSetReminder(delay);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Set Reminder</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 space-y-3">
                    <p className="text-center text-gray-400">When should we remind you to cook "{recipeTitle}"?</p>
                    {reminderOptions.map(({ label, delay }) => (
                        <button
                            key={label}
                            onClick={() => handleSet(delay)}
                            className="w-full p-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition text-center"
                        >
                            {label}
                        </button>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default ReminderModal;
