import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types.ts';
import { getHealthInsight } from '../services/geminiService.ts';
import { useAppContext } from '../App.tsx';

// SVGs for logos for self-containment
const GoogleFitIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M256.002 256.002L131.23 380.772L62.068 311.61L124.404 249.274L256.002 256.002Z" fill="#34A853"/>
    <path d="M256.002 256.002L380.772 131.232L311.61 62.07L249.274 124.406L256.002 256.002Z" fill="#EA4335"/>
    <path d="M256 256L387.598 256L449.934 193.664L387.598 131.328L256 256Z" fill="#FCC934"/>
    <path d="M256 256L256 387.598L193.664 449.934L131.328 387.598L256 256Z" fill="#4285F4"/>
  </svg>
);

const AppleHealthIcon = () => (
    <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M11.999 3.034C10.598 3.03 9.24 3.51 8.117 4.381C6.98 5.25 6.13 6.46 5.69 7.842C5.66 7.93 5.59 8.01 5.5 8.04C4.38 8.4 3.48 9.2 2.94 10.23C2.39 11.27 2.25 12.48 2.56 13.63C2.86 14.78 3.58 15.78 4.58 16.44C5.58 17.1 6.79 17.37 7.95 17.2C7.99 17.2 8.04 17.2 8.08 17.22C8.61 18.59 9.6 19.78 10.89 20.54C12.18 21.3 13.69 21.57 15.15 21.28C16.61 21 17.92 20.18 18.82 18.99C19.72 17.8 20.15 16.34 20.03 14.87C20.01 14.77 20.04 14.67 20.1 14.59C21.24 14.18 22.09 13.25 22.44 12.08C22.79 10.91 22.61 9.66 21.94 8.64C21.27 7.62 20.19 6.94 18.98 6.77C18.94 6.77 18.89 6.75 18.86 6.72C18.25 5.31 17.21 4.1 15.88 3.44C14.55 2.78 13.04 2.72 11.66 3.28C11.61 3.3 11.55 3.31 11.5 3.29C11.5 3.29 11.5 3.29 11.5 3.29L11.72 3.12C11.83 3.06 11.92 2.99 12 2.9C11.999 3.034 11.999 3.034 11.999 3.034ZM10.33 6.13C10.74 5.92 11.2 5.8 11.67 5.8C12.8 5.8 13.84 6.27 14.6 7.1L12.71 9L10.33 6.13ZM9.11 7.7L12.02 10.63L14.4 7.79C13.83 7.23 13.1 6.8 12.29 6.51L9.11 7.7ZM8.7 8.3L11.75 11.37L10.62 12.51L7.57 9.46L8.7 8.3ZM12.29 11.9L15.34 8.85L16.47 9.98L13.42 13.03L12.29 11.9ZM11.36 13.04L13.74 15.91C13.33 16.12 12.87 16.24 12.4 16.24C11.27 16.24 10.23 15.77 9.47 14.94L11.36 13.04ZM14.92 14.34L12.05 11.41L9.67 14.25C10.24 14.81 10.97 15.24 11.78 15.53L14.92 14.34Z" />
    </svg>
);

const simulatedData = {
    activity: { steps: 8230, caloriesBurned: 450 },
    meals: [
        { name: 'Oatmeal with Berries', calories: 350, time: '8:00 AM' },
        { name: 'Grilled Chicken Salad', calories: 550, time: '1:00 PM' }
    ]
};

interface HealthIntegrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
}

const HealthIntegrationModal: React.FC<HealthIntegrationModalProps> = ({ isOpen, onClose, userProfile, onUpdateProfile }) => {
    const { canPerformAction, recordAction } = useAppContext();
    const [integrations, setIntegrations] = useState(userProfile.healthIntegrations);
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIntegrations(userProfile.healthIntegrations);
            setInsight(null); // Reset insight when modal opens
        }
    }, [isOpen, userProfile.healthIntegrations]);

    const handleToggle = (service: 'googleFitConnected' | 'appleHealthConnected') => {
        setIntegrations(prev => ({ ...prev, [service]: !prev[service] }));
    };

    const handleGetInsight = async () => {
        if (!canPerformAction('assistant')) return;
        setIsLoading(true);
        setInsight(null);
        try {
            const result = await getHealthInsight(simulatedData, userProfile);
            setInsight(result);
            recordAction('assistant');
        } catch (error) {
            console.error(error);
            setInsight("Sorry, I couldn't generate an insight right now.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const isConnected = integrations.googleFitConnected || integrations.appleHealthConnected;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Health Connect</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="p-3 mb-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-center">
                        <h3 className="font-bold text-yellow-300">Disclaimer</h3>
                        <p className="text-xs text-yellow-300/80">This feature is a **simulation** for demonstration purposes. No real health data is collected, stored, or processed. Information provided is AI-generated and is not a substitute for professional medical or nutritional advice.</p>
                    </div>

                    {!isConnected ? (
                        <div className="space-y-4">
                             <p className="text-gray-400 text-center">Connect your health apps to get recipe suggestions based on your daily activity and nutrition goals.</p>
                            <ServiceConnector icon={<GoogleFitIcon />} name="Google Fit" connected={integrations.googleFitConnected} onToggle={() => handleToggle('googleFitConnected')} />
                            <ServiceConnector icon={<AppleHealthIcon />} name="Apple Health" connected={integrations.appleHealthConnected} onToggle={() => handleToggle('appleHealthConnected')} />
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <DataCard title="Today's Activity">
                                    <p className="text-3xl font-bold text-white">{simulatedData.activity.steps.toLocaleString()}</p>
                                    <p className="text-sm text-gray-400">Steps</p>
                                    <p className="text-2xl font-bold text-white mt-2">{simulatedData.activity.caloriesBurned} <span className="text-base font-normal">kcal</span></p>
                                    <p className="text-sm text-gray-400">Active Energy</p>
                                </DataCard>
                                <DataCard title="Recent Meals Logged">
                                    <ul className="space-y-2 text-sm">
                                        {simulatedData.meals.map(meal => (
                                            <li key={meal.name} className="flex justify-between">
                                                <span>{meal.name}</span>
                                                <span className="text-gray-400">{meal.calories} kcal</span>
                                            </li>
                                        ))}
                                    </ul>
                                </DataCard>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg text-white mb-2">AI-Powered Health Insight</h3>
                                <div className="p-4 bg-gray-800 rounded-lg min-h-[100px] flex flex-col justify-center">
                                    {isLoading ? (
                                        <div className="flex justify-center items-center"><div className="w-6 h-6 border-2 border-gray-600 border-t-green-400 rounded-full animate-spin"></div></div>
                                    ) : insight ? (
                                        <p className="text-center text-green-300 italic">"{insight}"</p>
                                    ) : (
                                        <button onClick={handleGetInsight} className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition">
                                            Analyze My Day
                                        </button>
                                    )}
                                </div>
                            </div>
                             <div className="pt-4 border-t border-gray-700">
                                <h3 className="font-semibold text-lg text-white mb-2">Connected Services</h3>
                                {integrations.googleFitConnected && <ServiceConnector icon={<GoogleFitIcon />} name="Google Fit" connected={true} onToggle={() => handleToggle('googleFitConnected')} />}
                                {integrations.appleHealthConnected && <ServiceConnector icon={<AppleHealthIcon />} name="Apple Health" connected={true} onToggle={() => handleToggle('appleHealthConnected')} />}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const ServiceConnector: React.FC<{icon: React.ReactNode, name: string, connected: boolean, onToggle: () => void}> = ({ icon, name, connected, onToggle }) => (
    <div className="p-4 bg-gray-800 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
            {icon}
            <h3 className="font-semibold text-white">{name}</h3>
        </div>
        <button
            onClick={onToggle}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                connected 
                ? 'bg-red-600 hover:bg-red-500' 
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
        >
            {connected ? 'Disconnect' : 'Connect'}
        </button>
    </div>
);

const DataCard: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="p-4 bg-gray-800 rounded-lg text-center">
        <h4 className="font-semibold text-gray-400 mb-2">{title}</h4>
        {children}
    </div>
);


export default HealthIntegrationModal;