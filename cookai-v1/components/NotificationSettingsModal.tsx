import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';

interface NotificationSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    permission: NotificationPermission;
    onRequestPermission: () => void;
    onSendTest: () => void;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
}

const Toggle: React.FC<{
    label: string;
    description: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}> = ({ label, description, enabled, onChange, disabled = false }) => (
    <div className={`flex items-center justify-between ${disabled ? 'opacity-50' : ''}`}>
        <div>
            <h3 className="font-semibold text-white">{label}</h3>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
        <button
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-600' : 'bg-gray-700'} ${disabled ? 'cursor-not-allowed' : ''}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);


const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
    isOpen,
    onClose,
    permission,
    onRequestPermission,
    onSendTest,
    userProfile,
    onUpdateProfile
}) => {
    const [settings, setSettings] = useState(userProfile.notificationSettings);

    useEffect(() => {
        if (isOpen) {
            setSettings(userProfile.notificationSettings);
        }
    }, [isOpen, userProfile.notificationSettings]);

    const handleToggle = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof settings] }));
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, reminderTime: e.target.value }));
    };
    
    const handleSave = () => {
        onUpdateProfile({ ...userProfile, notificationSettings: settings });
        onClose();
    };


    if (!isOpen) return null;

    const renderContent = () => {
        switch (permission) {
            case 'granted':
                return (
                    <>
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-lg font-medium text-white">Notifications Enabled</h3>
                            <p className="text-sm text-gray-400 mt-2 mb-4">You're all set to receive reminders for your recipes.</p>
                            <button
                                onClick={onSendTest}
                                className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition"
                            >
                                Send Test Notification
                            </button>
                        </div>
                        <div className="pt-4 mt-4 border-t border-gray-700">
                            <h3 className="text-lg font-medium text-white mb-2">Reminder Settings</h3>
                            <div className="space-y-4">
                                <Toggle
                                    label="Meal Plan Reminder"
                                    description="Get a daily ping for what's for dinner."
                                    enabled={settings.dailyMealPlanReminder}
                                    onChange={() => handleToggle('dailyMealPlanReminder')}
                                />
                                <Toggle
                                    label="Shopping List Reminder"
                                    description="Get a reminder for your grocery list."
                                    enabled={settings.dailyShoppingListReminder}
                                    onChange={() => handleToggle('dailyShoppingListReminder')}
                                />
                                 <Toggle
                                    label="Expiring Item Reminder"
                                    description="Get an alert for pantry items expiring soon."
                                    enabled={settings.expiringItemReminder}
                                    onChange={() => handleToggle('expiringItemReminder')}
                                />
                                {(settings.dailyMealPlanReminder || settings.dailyShoppingListReminder || settings.expiringItemReminder) && (
                                     <div className="flex items-center justify-between">
                                        <label htmlFor="reminderTime" className="font-semibold text-white">Reminder Time</label>
                                        <input
                                            type="time"
                                            id="reminderTime"
                                            value={settings.reminderTime}
                                            onChange={handleTimeChange}
                                            className="p-1 bg-gray-700 border border-gray-600 rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                );
            case 'denied':
                return (
                     <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-white">Notifications Blocked</h3>
                        <p className="text-sm text-gray-400 mt-2">To use reminders, you need to enable notifications in your browser settings.</p>
                        <p className="text-xs text-gray-500 mt-2">
                            Usually, you can do this by clicking the lock icon (🔒) in your browser's address bar and changing the setting for this site.
                        </p>
                    </div>
                );
            default: // 'default'
                return (
                     <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-700 mb-4">
                           <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-white">Enable Notifications</h3>
                        <p className="text-sm text-gray-400 mt-2 mb-4">Allow notifications to get timely reminders for when it's time to start cooking.</p>
                        <button
                            onClick={onRequestPermission}
                            className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition"
                        >
                            Enable Notifications
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Notification Center</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6">
                    {renderContent()}
                </main>
                <footer className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition">Save & Close</button>
                </footer>
            </div>
        </div>
    );
};

export default NotificationSettingsModal;
