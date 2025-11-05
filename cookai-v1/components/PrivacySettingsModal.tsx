
import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';

interface PrivacySettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
    onExportData: () => void;
    onDeleteAccount: () => void;
}

const Toggle: React.FC<{
    label: string;
    description: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
}> = ({ label, description, enabled, onChange }) => (
    <div className="flex items-center justify-between">
        <div>
            <h3 className="font-semibold text-white">{label}</h3>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-600' : 'bg-gray-700'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);


const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ isOpen, onClose, userProfile, onUpdateProfile, onExportData, onDeleteAccount }) => {
    const [settings, setSettings] = useState(userProfile.privacySettings);

    useEffect(() => {
        if (isOpen) {
            setSettings(userProfile.privacySettings);
        }
    }, [isOpen, userProfile.privacySettings]);
    
    const handleToggle = (setting: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    };

    const handleSave = () => {
        onUpdateProfile({ ...userProfile, privacySettings: settings });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Privacy & Data Settings</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 space-y-6">
                    <Toggle 
                        label="Save Chat History"
                        description="Keep a record of your conversations and stay logged in."
                        enabled={settings.saveChatHistory}
                        onChange={() => handleToggle('saveChatHistory')}
                    />
                     <Toggle 
                        label="Recipe Personalization"
                        description="Allow Cook to use your profile for tailored suggestions."
                        enabled={settings.allowPersonalization}
                        onChange={() => handleToggle('allowPersonalization')}
                    />
                    
                    <div className="pt-4 border-t border-gray-700 space-y-4">
                        <div>
                            <h3 className="font-semibold text-white">Manage Your Data</h3>
                            <p className="text-sm text-gray-400 mb-2">Export your profile, saved recipes, and meal plans, or delete your account entirely.</p>
                            <div className="flex gap-4">
                                <button onClick={onExportData} className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition">
                                    Export My Data
                                </button>
                                <button onClick={onDeleteAccount} className="flex-1 py-2 bg-red-700 text-white font-semibold rounded-lg hover:bg-red-600 transition">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>

                </main>
                <footer className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition">Save & Close</button>
                </footer>
            </div>
        </div>
    );
};

export default PrivacySettingsModal;
