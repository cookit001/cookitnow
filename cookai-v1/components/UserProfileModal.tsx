import React, { useState } from 'react';
import type { UserProfile, RememberedPerson } from '../types.ts';
import { translations } from '../translations.ts';
import type { Language } from '../types.ts';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile;
    onUpdateProfile: (profile: UserProfile) => void;
    language: Language;
}

const languageNames: Record<Language, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
    hi: 'हिन्दी',
    zh: '中文',
    ar: 'العربية',
    ru: 'Русский',
    pt: 'Português',
    bn: 'বাংলা',
    id: 'Bahasa Indonesia',
};

type ProfileTab = 'General' | 'Preferences' | 'My Kitchen' | 'Personalization';

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, userProfile, onUpdateProfile, language }) => {
    const [profile, setProfile] = useState(userProfile);
    const [newPerson, setNewPerson] = useState({ name: '', details: ''});
    const [activeTab, setActiveTab] = useState<ProfileTab>('General');
    // Fix: Cast translation object to a more specific type to avoid property access errors.
    const t = translations[language].userProfileModal as Record<string, string>;
    
    const handleListChange = (key: 'dietaryRestrictions' | 'tastePreferences' | 'availableEquipment' | 'favoriteCuisines' | 'allergies' | 'dislikedIngredients' | 'cookingGoals', value: string) => {
        setProfile(p => ({...p, [key]: value.split(',').map(s => s.trim()).filter(Boolean) }));
    }

    const handleAddPerson = () => {
        if (newPerson.name.trim() && newPerson.details.trim()) {
            const person: RememberedPerson = { ...newPerson, id: Date.now().toString() };
            setProfile(p => ({ ...p, rememberedPeople: [...p.rememberedPeople, person] }));
            setNewPerson({ name: '', details: ''});
        }
    };

    const handleRemovePerson = (id: string) => {
        setProfile(p => ({ ...p, rememberedPeople: p.rememberedPeople.filter(person => person.id !== id) }));
    };

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile(p => ({
            ...p,
            nutritionGoals: {
                ...p.nutritionGoals,
                [name]: value === '' ? 0 : parseInt(value, 10),
            },
        }));
    };

    const handleSave = () => {
        onUpdateProfile(profile);
        onClose();
    };

    if (!isOpen) return null;

    const TabButton: React.FC<{tabName: ProfileTab, children: React.ReactNode}> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tabName ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
        >
            {children}
        </button>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'General':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="font-semibold mb-2 text-white block">Name</label>
                                 <input type="text" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                            </div>
                             <div>
                                <label className="font-semibold mb-2 text-white block">Language</label>
                                <select 
                                    value={profile.language} 
                                    onChange={e => setProfile(p => ({ ...p, language: e.target.value as Language }))} 
                                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"
                                >
                                    {(Object.keys(translations) as Language[]).map(lang => (
                                        <option key={lang} value={lang}>{languageNames[lang]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={profile.budgetMode} onChange={e => setProfile(p => ({ ...p, budgetMode: e.target.checked }))} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 rounded text-green-500 focus:ring-green-500" />
                                <div>
                                    <h3 className="font-semibold text-white">{t.budgetModeTitle}</h3>
                                    <p className="text-sm text-gray-400">{t.budgetModeDesc}</p>
                                </div>
                            </label>
                        </div>
                    </div>
                );
            case 'Preferences':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="font-semibold mb-2 text-white block">Allergies</label>
                            <input type="text" value={profile.allergies.join(', ')} onChange={e => handleListChange('allergies', e.target.value)} placeholder="e.g., Peanuts, Shellfish" className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                            <p className="text-xs text-gray-500 mt-1">Comma-separated list. CRITICAL for safety.</p>
                        </div>
                        <div>
                            <label className="font-semibold mb-2 text-white block">Disliked Ingredients</label>
                            <input type="text" value={profile.dislikedIngredients.join(', ')} onChange={e => handleListChange('dislikedIngredients', e.target.value)} placeholder="e.g., Cilantro, Olives" className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                            <p className="text-xs text-gray-500 mt-1">Comma-separated list.</p>
                        </div>
                        <div>
                            <label className="font-semibold mb-2 text-white block">Dietary Restrictions</label>
                            <input type="text" value={profile.dietaryRestrictions.join(', ')} onChange={e => handleListChange('dietaryRestrictions', e.target.value)} placeholder="e.g., Gluten-Free, Vegan" className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                            <p className="text-xs text-gray-500 mt-1">Comma-separated list.</p>
                        </div>
                         <div>
                            <label className="font-semibold mb-2 text-white block">Taste Preferences</label>
                            <input type="text" value={profile.tastePreferences.join(', ')} onChange={e => handleListChange('tastePreferences', e.target.value)} placeholder="e.g., Spicy, Savory, Sweet" className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                             <p className="text-xs text-gray-500 mt-1">Comma-separated list.</p>
                        </div>
                        <div>
                           <label className="font-semibold mb-2 text-white block">Favorite Cuisines</label>
                           <input type="text" value={profile.favoriteCuisines.join(', ')} onChange={e => handleListChange('favoriteCuisines', e.target.value)} placeholder="e.g., Italian, Mexican, Japanese" className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                            <p className="text-xs text-gray-500 mt-1">Comma-separated list.</p>
                       </div>
                    </div>
                );
            case 'My Kitchen':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-lg font-bold text-green-400">Cooking Profile</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="font-semibold mb-2 text-white block">Skill Level</label>
                                <select value={profile.skillLevel} onChange={e => setProfile(p => ({ ...p, skillLevel: e.target.value as any }))} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg">
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Expert</option>
                                </select>
                            </div>
                         </div>
                         <div>
                             <label className="font-semibold mb-2 text-white block">Available Kitchen Equipment</label>
                             <input type="text" value={profile.availableEquipment.join(', ')} onChange={e => handleListChange('availableEquipment', e.target.value)} placeholder="e.g., Air Fryer, Stand Mixer, Blender" className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                             <p className="text-xs text-gray-500 mt-1">Comma-separated list.</p>
                         </div>
                         <div>
                            <label className="font-semibold mb-2 text-white block">Cooking Goals</label>
                            <input type="text" value={profile.cookingGoals.join(', ')} onChange={e => handleListChange('cookingGoals', e.target.value)} placeholder="e.g., Eat healthier, Learn new techniques" className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                            <p className="text-xs text-gray-500 mt-1">Comma-separated list.</p>
                        </div>
                    </div>
                );
            case 'Personalization':
                return (
                     <div className="space-y-6 animate-fade-in">
                        <div>
                            <h3 className="font-semibold mb-2 text-white">People to Remember</h3>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                <input type="text" value={newPerson.name} onChange={e => setNewPerson(p => ({...p, name: e.target.value}))} placeholder="Name (e.g., John)" className="col-span-1 p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                                 <input type="text" value={newPerson.details} onChange={e => setNewPerson(p => ({...p, details: e.target.value}))} placeholder="Details (e.g., Vegetarian)" className="col-span-2 p-2 bg-gray-800 border border-gray-600 rounded-lg"/>
                            </div>
                            <button onClick={handleAddPerson} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-500">{t.addButton}</button>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {profile.rememberedPeople.map(person => (
                                    <div key={person.id} className="flex items-center bg-gray-700 text-sm pl-3 pr-2 py-1 rounded-full">
                                        <span><strong>{person.name}:</strong> {person.details}</span>
                                        <button onClick={() => handleRemovePerson(person.id)} className="ml-2 text-gray-400 hover:text-white">&times;</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="font-semibold mb-2 text-white">Nutrition Goals (per day)</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm text-gray-400 block">Calories (kcal)</label><input type="number" name="calories" value={profile.nutritionGoals.calories || ''} onChange={handleGoalChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/></div>
                                <div><label className="text-sm text-gray-400 block">Protein (g)</label><input type="number" name="protein" value={profile.nutritionGoals.protein || ''} onChange={handleGoalChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/></div>
                                <div><label className="text-sm text-gray-400 block">Carbs (g)</label><input type="number" name="carbs" value={profile.nutritionGoals.carbs || ''} onChange={handleGoalChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/></div>
                                <div><label className="text-sm text-gray-400 block">Fat (g)</label><input type="number" name="fat" value={profile.nutritionGoals.fat || ''} onChange={handleGoalChange} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg"/></div>
                            </div>
                        </div>
                     </div>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">{t.title}</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                    <div className="flex items-center gap-2">
                        <TabButton tabName="General">General</TabButton>
                        <TabButton tabName="Preferences">Preferences</TabButton>
                        <TabButton tabName="My Kitchen">My Kitchen</TabButton>
                        <TabButton tabName="Personalization">Personalization</TabButton>
                    </div>
                </div>
                <main className="p-6 max-h-[60vh] overflow-y-auto min-h-[300px]">
                    {renderContent()}
                </main>
                <footer className="p-4 border-t border-gray-700 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition">{t.saveButton}</button>
                </footer>
            </div>
        </div>
    );
};

export default React.memo(UserProfileModal);