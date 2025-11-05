import React, { useState, useRef, useEffect } from 'react';
import type { SavedChat, ActivePage } from '../types.ts';

const UserProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const PantryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
const SavedRecipesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>;
const MealPlannerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const FoodNewsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3h.01M17 17h.01" /></svg>;
const ExploreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 21a2 2 0 002 2h2a2 2 0 002-2M9 21a2 2 0 01-2-2V3a2 2 0 012-2h6a2 2 0 012 2v16a2 2 0 01-2 2M9 21h6m-6-4h6m-6-4h6m-6-4h6" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const HealthIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const PrivacyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const ShoppingListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const AssistantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>;
const ToolsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CapabilitiesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const NotificationIcon: React.FC<{ permission: NotificationPermission }> = ({ permission }) => {
    if (permission === 'denied') {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636M15 17h.01" /></svg>;
    }
    if (permission === 'granted') {
         return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h.01M4.98 4.98h-.01M19.02 4.98h-.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
};

interface SidebarProps {
    isSidebarOpen: boolean;
    onClose: () => void;
    onNewChat: () => void;
    onSaveChat: () => void;
    onLoadChat: (chatId: string) => void;
    onDeleteChat: (chatId: string) => void;
    onOpenProfile: () => void;
    onOpenPantry: () => void;
    onOpenShoppingList: () => void;
    onOpenSavedRecipes: () => void;
    onOpenMealPlanner: () => void;
    onShowFoodNews: () => void;
    onShowExplore: () => void;
    onShowCapabilities: () => void;
    onOpenHealthIntegrations: () => void;
    onOpenPrivacySettings: () => void;
    onOpenNotificationSettings: () => void;
    onShowAssistant: () => void;
    onShowSmartTools: () => void;
    onShowFoodRecognition: () => void;
    notificationPermission: NotificationPermission;
    savedChats: SavedChat[];
    activeChatId: string | null;
    isChatEmpty: boolean;
    remainingActions: { recipe: number; assistant: number };
    activePage: ActivePage;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [isKitchenMenuOpen, setIsKitchenMenuOpen] = useState(false);
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const settingsMenuRef = useRef<HTMLDivElement>(null);

    const mainNav = [
        { id: 'assistant', label: 'Cook Assistant', action: props.onShowAssistant, icon: <AssistantIcon/> },
        { id: 'food-recognition', label: 'Food Recognition', action: props.onShowFoodRecognition, icon: <CameraIcon/> },
        { id: 'explore', label: 'Explore', action: props.onShowExplore, icon: <ExploreIcon/> },
        { id: 'food-news', label: 'Food News', action: props.onShowFoodNews, icon: <FoodNewsIcon/> },
        { id: 'smart-tools', label: 'Smart Tools', action: props.onShowSmartTools, icon: <ToolsIcon/> },
        { id: 'capabilities', label: 'App Capabilities', action: props.onShowCapabilities, icon: <CapabilitiesIcon/> },
    ];

    const kitchenNav = [
        { id: 'saved-recipes', label: 'Saved Recipes', action: props.onOpenSavedRecipes, icon: <SavedRecipesIcon/> },
        { id: 'meal-planner', label: 'Meal Planner', action: props.onOpenMealPlanner, icon: <MealPlannerIcon/> },
        { id: 'shopping-list', label: 'Shopping List', action: props.onOpenShoppingList, icon: <ShoppingListIcon /> },
        { id: 'pantry', label: 'My Pantry', action: props.onOpenPantry, icon: <PantryIcon/> },
    ];
    
     const settingsActions = [
        { label: 'User Profile', action: props.onOpenProfile, icon: <UserProfileIcon/> },
        { label: 'Health Connect', action: props.onOpenHealthIntegrations, icon: <HealthIcon /> },
        { label: 'Privacy Settings', action: props.onOpenPrivacySettings, icon: <PrivacyIcon /> },
        { label: 'Notifications', action: props.onOpenNotificationSettings, icon: <NotificationIcon permission={props.notificationPermission} /> },
    ];

    const handleActionClick = (action: () => void) => {
        action();
        props.onClose(); // Close sidebar on mobile after action
    };

     // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setIsSettingsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity md:hidden ${props.isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={props.onClose}
                aria-hidden="true"
            />
            <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-gray-900 text-gray-300 flex flex-col transform transition-transform md:relative md:translate-x-0 ${props.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 flex-shrink-0 flex gap-2">
                    <button onClick={() => handleActionClick(props.onNewChat)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-semibold text-sm rounded-lg hover:bg-green-500 transition shadow-lg shadow-green-900/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        New Recipe Chat
                    </button>
                    <button onClick={() => handleActionClick(props.onSaveChat)} disabled={props.isChatEmpty} title="Save current chat" className="p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </button>
                </div>
                <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                    <ul className="space-y-1">
                        {mainNav.map(({ id, label, action, icon }) => (
                            <li key={label}>
                                <button 
                                  onClick={() => handleActionClick(action)} 
                                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-medium transition-colors ${props.activePage === id ? 'bg-green-900/50 text-white' : 'hover:bg-gray-800'}`}
                                >
                                    <span className="shrink-0">{icon}</span>
                                    <span>{label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-gray-800"></div>
                    
                    {/* My Kitchen Dropdown */}
                    <div className="relative">
                        <button onClick={() => setIsKitchenMenuOpen(prev => !prev)} className="w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left text-sm font-medium hover:bg-gray-800 transition-colors" aria-expanded={isKitchenMenuOpen}>
                            <div className="flex items-center gap-3"><span className="shrink-0"><PantryIcon /></span><span>My Kitchen</span></div>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isKitchenMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <div className={`pl-6 transition-all duration-300 ease-in-out overflow-hidden ${isKitchenMenuOpen ? 'max-h-96' : 'max-h-0'}`}>
                             <ul className="space-y-1 py-2">
                                {kitchenNav.map(({ id, label, action, icon }) => (
                                    <li key={label}>
                                        <button onClick={() => handleActionClick(action)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-medium transition-colors ${props.activePage === id ? 'bg-green-900/50 text-white' : 'hover:bg-gray-800'}`}>
                                            <span className="shrink-0">{icon}</span>
                                            <span>{label}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                     {/* Chat History Section */}
                    <div>
                        <button onClick={() => setIsHistoryOpen(prev => !prev)} className="w-full flex items-center justify-between gap-3 p-3 rounded-lg text-left text-sm font-medium hover:bg-gray-800 transition-colors" aria-expanded={isHistoryOpen}>
                            <div className="flex items-center gap-3"><span className="shrink-0"><HistoryIcon /></span><span>Recipe Chat History</span></div>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isHistoryOpen ? 'max-h-[500px] mt-1' : 'max-h-0'}`}>
                            <ul className="space-y-1 pl-2 max-h-48 overflow-y-auto">
                                {props.savedChats.length === 0 && <p className="text-xs text-center text-gray-500 py-4">No saved chats.</p>}
                                {props.savedChats.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(chat => (
                                    <li key={chat.id}>
                                        <button onClick={() => handleActionClick(() => props.onLoadChat(chat.id))} className={`group w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left text-xs transition-colors ${props.activeChatId === chat.id && props.activePage === 'chat' ? 'bg-green-900/50' : 'hover:bg-gray-800'}`}>
                                            <span className="truncate flex-grow">{chat.title}</span>
                                            <span onClick={(e) => { e.stopPropagation(); props.onDeleteChat(chat.id); }} className="p-1 rounded text-gray-500 hover:bg-red-800 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TrashIcon />
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-800 flex-shrink-0 space-y-2">
                     <div className="px-3 py-2 text-center bg-gray-800 rounded-lg text-xs">
                        <p className="font-semibold text-gray-400 mb-1">Daily Usage Remaining</p>
                        <div className="flex justify-around">
                            <p><span className="font-bold text-lg text-white">{props.remainingActions.recipe}</span> Recipes</p>
                            <p><span className="font-bold text-lg text-white">{props.remainingActions.assistant}</span> Assistant</p>
                        </div>
                    </div>
                    
                    <div className="relative" ref={settingsMenuRef}>
                        {isSettingsMenuOpen && (
                            <div className="absolute bottom-full mb-2 w-full bg-gray-800 rounded-lg shadow-lg p-2 space-y-1 border border-gray-700 animate-slide-in-up-fade">
                                {settingsActions.map(({ label, action, icon }) => (
                                    <li key={label} className="list-none">
                                        <button onClick={() => { handleActionClick(action); setIsSettingsMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-medium hover:bg-gray-700 transition-colors">
                                            <span className="shrink-0">{icon}</span>
                                            <span>{label}</span>
                                        </button>
                                    </li>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setIsSettingsMenuOpen(prev => !prev)} className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-medium hover:bg-gray-800 transition-colors">
                            <span className="shrink-0"><SettingsIcon /></span>
                            <span>Settings & Profile</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default React.memo(Sidebar);