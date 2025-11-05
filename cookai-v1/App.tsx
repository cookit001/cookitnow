import React, { useState, useEffect, useCallback, useRef, lazy, Suspense, createContext, useContext } from 'react';
import type { Message, Recipe, UserProfile, SavedMealPlans, ShoppingListItem, SavedChat, ActivePage } from './types.ts';
import * as geminiService from './services/geminiService.ts';
import * as notificationService from './services/notificationService.ts';
import { useUsageTracker } from './hooks/useUsageTracker.ts';

// Components
import Header from './components/Header.tsx';
import Sidebar from './components/Sidebar.tsx';
import Footer from './components/Footer.tsx';
import ChatMessage from './components/ChatMessage.tsx';
import ChatInput from './components/ChatInput.tsx';
import InitialView from './components/InitialView.tsx';
import Loader from './components/Loader.tsx';
import { useToast } from './components/ToastProvider.tsx';

// Lazy-loaded Modals and Pages for performance optimization
const UserProfileModal = lazy(() => import('./components/UserProfileModal.tsx'));
const PantryManagerModal = lazy(() => import('./components/PantryManagerModal.tsx'));
const SavedRecipesModal = lazy(() => import('./components/SavedRecipesModal.tsx'));
const ImageGeneratorModal = lazy(() => import('./components/ImageGeneratorModal.tsx'));
const CookingModeChoiceModal = lazy(() => import('./components/CookingModeChoiceModal.tsx'));
const CookingMode = lazy(() => import('./components/CookingMode.tsx'));
const AdvancedCookingMode = lazy(() => import('./components/AdvancedCookingMode.tsx'));
const ZenMode = lazy(() => import('./components/ZenMode.tsx'));
const ResumeCookingModal = lazy(() => import('./components/ResumeCookingModal.tsx'));
const RecipeEditorModal = lazy(() => import('./components/RecipeEditorModal.tsx'));
const HealthIntegrationModal = lazy(() => import('./components/HealthIntegrationModal.tsx'));
const PrivacySettingsModal = lazy(() => import('./components/PrivacySettingsModal.tsx'));
const NotificationSettingsModal = lazy(() => import('./components/NotificationSettingsModal.tsx'));
const IngredientSubstituteModal = lazy(() => import('./components/IngredientSubstituteModal.tsx'));
const BeveragePairingModal = lazy(() => import('./components/BeveragePairingModal.tsx'));
const RecipeScalerModal = lazy(() => import('./components/RecipeScalerModal.tsx'));
const AddToMealPlanModal = lazy(() => import('./components/AddToMealPlanModal.tsx'));


// Standalone Pages
const FoodNewsPage = lazy(() => import('./pages/FoodNewsPage.tsx'));
const ExplorePage = lazy(() => import('./pages/ExplorePage.tsx'));
const MealPlannerPage = lazy(() => import('./pages/MealPlannerPage.tsx'));
const ShoppingListPage = lazy(() => import('./pages/ShoppingListPage.tsx'));
const AssistantPage = lazy(() => import('./pages/AssistantPage.tsx'));
const SmartToolsPage = lazy(() => import('./pages/SmartToolsPage.tsx'));
const CapabilitiesPage = lazy(() => import('./pages/CapabilitiesPage.tsx'));
const FoodRecognitionPage = lazy(() => import('./pages/FoodRecognitionPage.tsx'));

// --- App Context for State Management ---
interface AppContextType {
    userProfile: UserProfile;
    savedRecipes: Recipe[];
    shoppingList: ShoppingListItem[];
    canPerformAction: (type: 'recipe' | 'assistant') => boolean;
    recordAction: (type: 'recipe' | 'assistant') => void;
    addMessage: (message: Message) => void;
    setActiveJob: (job: string | null) => void;
    onSaveRecipe: (recipe: Recipe) => void;
}
export const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};

// Helper for local storage
const useStickyState = <T,>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [value, setValue] = useState<T>(() => {
        const stickyValue = window.localStorage.getItem(key);
        if (stickyValue) {
            try {
                const parsedValue = JSON.parse(stickyValue);
                // Simple merge for objects to ensure new keys from defaultValue are included
                if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
                    return { ...defaultValue, ...parsedValue };
                }
                return parsedValue;
            } catch {
                return defaultValue;
            }
        }
        return defaultValue;
    });
    useEffect(() => {
        window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];


// Fix: Corrected the component definition to be a valid React.FC and added the missing return statement and export.
const App: React.FC = () => {
    const toast = useToast();
    const { remainingActions, canPerformAction, recordAction } = useUsageTracker();

    const [userProfile, setUserProfile] = useStickyState<UserProfile>({
        name: 'Guest User', dietaryRestrictions: [], tastePreferences: [], budgetMode: false, pantry: [], language: 'en',
        allergies: [], dislikedIngredients: [],
        rememberedPeople: [],
        healthIntegrations: { googleFitConnected: false, appleHealthConnected: false },
        nutritionGoals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        privacySettings: { saveChatHistory: true, allowPersonalization: true },
        skillLevel: 'Intermediate', availableEquipment: [], favoriteCuisines: [], cookingGoals: [],
        // FIX: Add 'expiringItemReminder' to the default user profile to match the type definition.
        notificationSettings: { dailyShoppingListReminder: false, dailyMealPlanReminder: false, expiringItemReminder: false, reminderTime: "17:00" },
        cookingStreak: 0, lastCookedDate: '', pantryHistory: [], achievements: [],
    }, 'cook-user-profile');
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [assistantMessages, setAssistantMessages] = useStickyState<Message[]>([], 'cook-assistant-history');
    const [activeJob, setActiveJob] = useState<string | null>(null);
    const [activePage, setActivePage] = useState<ActivePage>('chat');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAutoSaving, setIsAutoSaving] = useState(false);


    // Modals state
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isPantryOpen, setIsPantryOpen] = useState(false);
    const [isSavedRecipesOpen, setIsSavedRecipesOpen] = useState(false);
    const [isCookingChoiceOpen, setIsCookingChoiceOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [isHealthIntegrationOpen, setIsHealthIntegrationOpen] = useState(false);
    const [isPrivacySettingsOpen, setIsPrivacySettingsOpen] = useState(false);
    const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
    const [substituteModalState, setSubstituteModalState] = useState<{ recipe: Recipe; ingredient: string; } | null>(null);
    const [pairingModalRecipe, setPairingModalRecipe] = useState<Recipe | null>(null);
    const [scalerModalRecipe, setScalerModalRecipe] = useState<Recipe | null>(null);
    const [addToPlanRecipe, setAddToPlanRecipe] = useState<Recipe | null>(null);


    // Feature-specific state
    const [visualizingRecipe, setVisualizingRecipe] = useState<Recipe | null>(null);
    const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
    const [cookingMode, setCookingMode] = useState<'simple' | 'advanced' | 'zen' | null>(null);
    const [resumeCookingInfo, setResumeCookingInfo] = useState<{ recipe: Recipe, step: number } | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [trendingDishName, setTrendingDishName] = useState<string | null>(null);

    // User data
    const [savedRecipes, setSavedRecipes] = useStickyState<Recipe[]>([], 'cook-saved-recipes');
    const [savedMealPlans, setSavedMealPlans] = useStickyState<SavedMealPlans>({ 'My First Plan': {} }, 'cook-saved-meal-plans');
    const [shoppingList, setShoppingList] = useStickyState<ShoppingListItem[]>([], 'cook-shopping-list');
    const [savedChats, setSavedChats] = useStickyState<SavedChat[]>([], 'cook-saved-chats');
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [activePlanName, setActivePlanName] = useStickyState<string>('My First Plan', 'cook-active-plan-name');
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const jobCancelledRef = useRef(false);

    const scrollToBottom = () => {
        // For chat page, we scroll the main content area to the bottom
        if (activePage === 'chat' && mainContentRef.current) {
            mainContentRef.current.scrollTop = mainContentRef.current.scrollHeight;
        }
    };
    
    // Auto-save existing chat
    useEffect(() => {
        if (activeChatId && userProfile.privacySettings.saveChatHistory && !isAutoSaving) {
            setSavedChats(prev => prev.map(chat => 
                chat.id === activeChatId ? { ...chat, messages: messages } : chat
            ));
        }
    }, [messages, activeChatId, userProfile.privacySettings.saveChatHistory, setSavedChats, isAutoSaving]);

    // FIX: Moved autoCreateChat outside of useEffect to make it accessible to other handlers.
    const autoCreateChat = useCallback(async () => {
        // Conditions to create a new chat: no active ID, at least 2 messages, history saving is on, not currently in the process of saving.
        if (activeChatId || messages.length < 2 || !userProfile.privacySettings.saveChatHistory || isAutoSaving) {
            return;
        }

        const hasUserAndModelMessage = messages.some(m => m.role === 'user') && messages.some(m => m.role === 'model' && m.type !== 'loading');

        if (hasUserAndModelMessage) {
            setIsAutoSaving(true);
            try {
                const history = messages.filter(m => m.type === 'text' || (m.type === 'image-query' && m.content)).map(m => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content }] }));
                const title = await geminiService.generateChatTitle(history);
                const newChat: SavedChat = { id: Date.now().toString(), title, messages, createdAt: new Date().toISOString() };
                
                setSavedChats(prev => [...prev, newChat]);
                setActiveChatId(newChat.id);
            } catch (e) {
                console.error("Auto-save failed to create chat:", e);
            } finally {
                setIsAutoSaving(false);
            }
        }
    }, [activeChatId, isAutoSaving, messages, userProfile.privacySettings.saveChatHistory, setSavedChats, setActiveChatId]);


    // Auto-create a new chat
    useEffect(() => {
        autoCreateChat();
    }, [messages, autoCreateChat]);


    useEffect(scrollToBottom, [messages, assistantMessages, activePage]);

    useEffect(() => {
        setNotificationPermission(notificationService.getPermissionState());
        
        const inProgressRecipeTitle = Object.keys(localStorage).find(k => k.startsWith('cooking_step_'))?.replace('cooking_step_', '');
        if (inProgressRecipeTitle) {
            const recipe = savedRecipes.find(r => r.title === inProgressRecipeTitle);
            const step = parseInt(localStorage.getItem(`cooking_step_${inProgressRecipeTitle}`) || '0', 10);
            if (recipe) {
                setResumeCookingInfo({ recipe, step });
            }
        }
        
        // Fetch trending dish for initial view
        geminiService.getTrendingDishName(userProfile)
            .then(setTrendingDishName)
            .catch(err => console.error("Could not fetch trending dish:", err));

    }, [savedRecipes, userProfile]);

    useEffect(() => {
        const checkAndSendReminders = () => {
            if (notificationService.getPermissionState() !== 'granted') return;
            if (!userProfile.notificationSettings?.dailyMealPlanReminder && !userProfile.notificationSettings?.dailyShoppingListReminder) return;

            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const lastNotificationDate = localStorage.getItem('cook-last-notification-date');

            if (lastNotificationDate === todayStr) return; // Already sent today

            const [reminderHour, reminderMinute] = userProfile.notificationSettings.reminderTime.split(':').map(Number);
            if (now.getHours() < reminderHour || (now.getHours() === reminderHour && now.getMinutes() < reminderMinute)) {
                return; // Not time yet
            }
            
            let notificationSent = false;
            // Meal Plan Reminder
            if (userProfile.notificationSettings.dailyMealPlanReminder) {
                const dayOfWeek = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Adjust for Sunday being 0
                const activePlan = savedMealPlans[activePlanName] || {};
                const dinner = activePlan[dayOfWeek]?.dinner;
                if (dinner) {
                    notificationService.showNotificationNow(
                        "What's for dinner? 🍽️",
                        { body: `Your plan says "${dinner}". Let's get cooking!` }
                    );
                    notificationSent = true;
                }
            }

            // Shopping List Reminder (sent as a separate notification)
            if (userProfile.notificationSettings.dailyShoppingListReminder) {
                const uncompletedItems = shoppingList.filter(item => !item.completed);
                if (uncompletedItems.length > 0) {
                     notificationService.showNotificationNow(
                        "Time for a grocery run? 🛒",
                        { body: `You have ${uncompletedItems.length} item(s) on your shopping list.` }
                    );
                    notificationSent = true;
                }
            }
            
            if(notificationSent) {
                localStorage.setItem('cook-last-notification-date', todayStr);
            }
        };
        
        // Check reminders shortly after app load
        const timer = setTimeout(checkAndSendReminders, 3000);
        return () => clearTimeout(timer);

    }, [userProfile.notificationSettings, savedMealPlans, activePlanName, shoppingList]);

    const addMessage = useCallback((message: Message) => setMessages(prev => [...prev, message]), []);

    const handleNewChat = useCallback(() => {
        setMessages([]);
        setActivePage('chat');
        setActiveChatId(null);
    }, []);

    const handleSaveRecipe = useCallback((r: Recipe) => {
        setSavedRecipes(prev => {
            const exists = prev.some(sr => sr.title === r.title);
            if (exists) {
                // This is an unsave action
                return prev.filter(sr => sr.title !== r.title);
            } else {
                // This is a save action
                return [...prev, { ...r, isSaved: true, isFavorite: r.isFavorite ?? false, rating: r.rating || 0 }];
            }
        });
    }, [setSavedRecipes]);

    const handleCancelJob = useCallback(() => {
        jobCancelledRef.current = true;
        setActiveJob(null);
        setMessages(prev => prev.filter(m => m.type !== 'loading'));
        setAssistantMessages(prev => prev.filter(m => m.type !== 'loading'));
        toast.addToast("Request cancelled.", "info");
    }, [toast, setMessages, setAssistantMessages, setActiveJob]);


    const handleSendMessage = async (messageText: string, image?: { base64: string; mimeType: string; dataUrl: string }) => {
        if (activeJob) return;
        jobCancelledRef.current = false;
    
        setActivePage('chat');

        if (image) {
            addMessage({ role: 'user', type: 'image-query', content: messageText, data: { imageUrl: image.dataUrl } });
        } else {
            const userMessageContent = messageText === 'SUGGEST_TRENDING' ? 'Suggest a popular dish' : messageText;
            addMessage({ role: 'user', type: 'text', content: userMessageContent });
        }
        
        let jobType = 'thinking';
        if (messageText === 'SUGGEST_TRENDING') jobType = 'searching-trending';
        else if (image) jobType = 'analyzing-image';
        else jobType = 'generating-recipe';

        addMessage({ role: 'model', type: 'loading', content: jobType });
        
        try {
            const history = messages.filter(m => m.type === 'text').map(m => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content as string }] }));

            if (messageText === 'SUGGEST_TRENDING') {
                if (!canPerformAction('recipe')) { addMessage({ role: 'system', type: 'text', content: `Daily limit reached.` }); return; }
                setActiveJob('trending');
                const dishName = await geminiService.getTrendingDishName(userProfile);
                if (jobCancelledRef.current) return;
                addMessage({ role: 'system', type: 'text', content: `Found one! Let's make: ${dishName}` });
                messageText = `recipe for ${dishName}`;
                // Fall through to the recipe generation logic
            }
            
            if (image) {
                if (!canPerformAction('recipe')) { addMessage({ role: 'system', type: 'text', content: `Daily limit reached.` }); return; };
                setActiveJob('analyzing');
                const modelResponse = await geminiService.analyzeImage(image.base64, image.mimeType, userProfile);
                if (jobCancelledRef.current) return;
                addMessage({ role: 'model', type: 'image-suggestions', content: modelResponse.qualityNotes, data: modelResponse });
                recordAction('recipe');

            } else {
                if (!canPerformAction('recipe')) { addMessage({ role: 'system', type: 'text', content: `Daily limit reached.` }); return; }
                
                setActiveJob('generating');
                const recipe = await geminiService.getChatResponse(messageText, history, userProfile);
                if (jobCancelledRef.current) return;
                try {
                    recipe.base64Image = await geminiService.generateDishImage(recipe.title, 'Food Magazine');
                } catch (imgError) {
                    console.error("Could not generate image for new recipe:", imgError);
                }
                if (jobCancelledRef.current) return;
                addMessage({ role: 'model', type: 'recipe', content: `Here is a recipe for ${recipe.title}.`, data: recipe });
                recordAction('recipe');
            }
        } catch (error: any) {
            if (jobCancelledRef.current) return;
            addMessage({ role: 'system', type: 'text', content: error.message || "An unexpected error occurred." });
        } finally {
            if (jobCancelledRef.current) return;
            setMessages(prev => prev.filter(m => m.type !== 'loading'));
            setActiveJob(null);
        }
    };
    
    const handleSendAssistantMessage = async (messageText: string) => {
        if (activeJob) return;
        if (!canPerformAction('assistant')) {
            setAssistantMessages(prev => [...prev, { role: 'system', type: 'text', content: `Daily limit reached.` }]);
            return;
        }

        jobCancelledRef.current = false;
        const userMessage: Message = { role: 'user', type: 'text', content: messageText };
        setAssistantMessages(prev => [...prev, userMessage, { role: 'model', type: 'loading', content: 'searching-assistant' }]);
        setActiveJob('assistant');
        
        try {
            const history = assistantMessages.filter(m => m.type === 'text').map(m => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content }] }));
            const lastRecipe = [...messages].reverse().find(m => m.type === 'recipe')?.data as Recipe | null;
            const modelResponse = await geminiService.getConversationalResponse(messageText, history, userProfile, lastRecipe);

            if (jobCancelledRef.current) return;

            if (modelResponse.functionCalls?.length > 0) {
                 for (const fc of modelResponse.functionCalls) {
                    if (fc.name === 'addToShoppingList' && fc.args.items) {
                        handleAddIngredientsToList(fc.args.items, true);
                    }
                }
            }
            if (modelResponse.text) {
                const responseMessage: Message = { role: 'model', type: 'grounded-response', content: modelResponse.text, data: modelResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
                setAssistantMessages(prev => [...prev.filter(m => m.type !== 'loading'), responseMessage]);
            } else {
                 setAssistantMessages(prev => prev.filter(m => m.type !== 'loading'));
            }
            recordAction('assistant');
        } catch (error: any) {
             if (jobCancelledRef.current) return;
             setAssistantMessages(prev => [...prev.filter(m => m.type !== 'loading'), { role: 'system', type: 'text', content: error.message || "An unexpected error occurred." }]);
        } finally {
            if (jobCancelledRef.current) return;
            setActiveJob(null);
        }
    };

    const handleUpdateRecipeRating = useCallback((title: string, rating: number) => {
        setSavedRecipes(prev => prev.map(r => r.title === title ? { ...r, rating } : r));
    }, [setSavedRecipes]);

    const handleToggleFavorite = useCallback((title: string) => {
        setSavedRecipes(prev => prev.map(r => 
            r.title === title ? { ...r, isFavorite: !r.isFavorite } : r
        ));
    }, [setSavedRecipes]);

    const handleAddIngredientsToList = useCallback(async (ingredients: string[], fromAssistant: boolean = false) => {
        const existingTexts = new Set(shoppingList.map(i => i.text.toLowerCase()));
        const itemsToCategorize = ingredients.filter(ing => !existingTexts.has(ing.toLowerCase()));

        if (itemsToCategorize.length > 0) {
            try {
                const newItemsPromises = itemsToCategorize.map(async (ing) => {
                    const category = await geminiService.categorizePantryItem(ing);
                    return { id: Date.now() + Math.random(), text: ing, completed: false, category: category };
                });
                const newItems = await Promise.all(newItemsPromises);

                setShoppingList(prev => [...prev, ...newItems]);
                
                const message = fromAssistant 
                    ? `I've added ${newItems.length} item(s) to your shopping list for you.`
                    : `${newItems.length} item(s) added to your shopping list.`;
                toast.addToast(message, 'success');
            } catch (error) {
                toast.addToast('Could not auto-categorize items, added to "Other".', 'error');
                const newItems = itemsToCategorize.map(ing => ({ id: Date.now() + Math.random(), text: ing, completed: false, category: 'Other' as const }));
                setShoppingList(prev => [...prev, ...newItems]);
            }
        } else if (!fromAssistant) {
            toast.addToast('All ingredients are already on your shopping list.', 'info');
        }
    }, [setShoppingList, toast, shoppingList]);
    
    const handleSetReminder = (recipeTitle: string, delayInMs: number) => {
        if (notificationPermission !== 'granted') {
            toast.addToast('Please enable notifications first to set a reminder.', 'error');
            return;
        }
        notificationService.scheduleNotification('Time to Cook!', { body: `Your reminder for "${recipeTitle}" is ready. Let's get cooking!` }, delayInMs);
        toast.addToast(`Reminder set for "${recipeTitle}".`, 'success');
    };

    const handleRequestNotificationPermission = async () => {
        const permission = await notificationService.requestPermission();
        setNotificationPermission(permission);
    };

    const handleAddToMealPlan = (recipeTitle: string, day: string, meal: 'breakfast' | 'lunch' | 'dinner') => {
        setSavedMealPlans(prevPlans => {
            const newPlans = { ...prevPlans };
            const planToUpdate = { ...(newPlans[activePlanName] || {}) };
            planToUpdate[day] = { ...(planToUpdate[day] || {}), [meal]: recipeTitle };
            newPlans[activePlanName] = planToUpdate;
            return newPlans;
        });
        toast.addToast(`Added "${recipeTitle}" to your meal plan for ${day}.`, 'success');
        setAddToPlanRecipe(null);
    };
    
    const handleFuseRecipes = async (recipe1: Recipe, recipe2: Recipe) => {
        if (!canPerformAction('recipe')) return;
        jobCancelledRef.current = false;
        setIsSavedRecipesOpen(false);
        handleNewChat();
        setActivePage('chat');
        setActiveJob('fusing');
        addMessage({ role: 'model', type: 'loading', content: 'fusing-recipes' });
        try {
            const fusedRecipe = await geminiService.generateFusedRecipe(recipe1, recipe2, userProfile);
            if (jobCancelledRef.current) return;
            try {
                fusedRecipe.base64Image = await geminiService.generateDishImage(fusedRecipe.title, 'Food Magazine');
            } catch (imgError) {
                console.error("Could not generate image for fused recipe:", imgError);
            }
            if (jobCancelledRef.current) return;
            addMessage({ role: 'model', type: 'fused-recipe', content: `Here is a fusion recipe for ${fusedRecipe.title}.`, data: fusedRecipe });
            recordAction('recipe');
        } catch (error: any) {
            if (jobCancelledRef.current) return;
            addMessage({ role: 'system', type: 'text', content: (error as Error).message || "An unexpected error occurred." });
        } finally {
            if (jobCancelledRef.current) return;
            setMessages(prev => prev.filter(m => m.type !== 'loading'));
            setActiveJob(null);
        }
    };

    const renderPageContent = () => {
        const pageProps = { onBack: () => setActivePage('chat') };
        switch (activePage) {
            case 'food-news':
                return <FoodNewsPage {...pageProps} language={userProfile.language} />;
            case 'explore':
                return <ExplorePage profile={userProfile} onSelectRecipe={(prompt) => { setActivePage('chat'); handleSendMessage(prompt); }} />;
            case 'meal-planner':
                return <MealPlannerPage {...pageProps} userProfile={userProfile} savedPlans={savedMealPlans} setSavedPlans={setSavedMealPlans} activePlanName={activePlanName} setActivePlanName={setActivePlanName} canPerformAction={() => canPerformAction('recipe')} recordAction={() => recordAction('recipe')} language={userProfile.language} items={shoppingList} onUpdateItems={setShoppingList} />;
            case 'shopping-list':
                return <ShoppingListPage {...pageProps} items={shoppingList} onUpdateItems={setShoppingList} />;
            case 'assistant':
                return <AssistantPage messages={assistantMessages} onSendMessage={handleSendAssistantMessage} isLoading={activeJob === 'assistant'} messagesEndRef={messagesEndRef} onBack={() => setActivePage('chat')} onCancelJob={handleCancelJob} />;
            case 'smart-tools':
                return <SmartToolsPage onBack={() => setActivePage('chat')} />;
            case 'capabilities':
                 return <CapabilitiesPage onBack={() => setActivePage('chat')} />;
            case 'food-recognition':
                return <FoodRecognitionPage onBack={() => { setActivePage('chat'); setMessages([]); }} />;
            case 'chat':
            default:
                return (
                     <div className="chat-container p-4 w-full">
                        {messages.length === 0 ? (
                            <InitialView onSuggestionClick={handleSendMessage} trendingDishName={trendingDishName} />
                        ) : (
                            <div className="space-y-6">
                                {messages.map((msg, i) => (
                                    <ChatMessage
                                        key={i}
                                        message={msg}
                                        setMessages={setMessages}
                                        onUpdateRating={handleUpdateRecipeRating}
                                        onVisualizeDish={setVisualizingRecipe}
                                        onStartCooking={(recipe) => { setCookingRecipe(recipe); setIsCookingChoiceOpen(true); }}
                                        onSetReminder={handleSetReminder}
                                        onAddToList={handleAddIngredientsToList}
                                        onShowSubstituteModal={(recipe, ingredient) => setSubstituteModalState({ recipe, ingredient })}
                                        onShowPairingModal={setPairingModalRecipe}
                                        onShowScalerModal={setScalerModalRecipe}
                                        onShowAddToPlan={setAddToPlanRecipe}
                                        activeJob={activeJob}
                                        onCancelJob={handleCancelJob}
                                    />
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                );
        }
    };

    const contextValue = {
        userProfile,
        savedRecipes,
        shoppingList,
        canPerformAction,
        recordAction,
        addMessage,
        setActiveJob,
        onSaveRecipe: handleSaveRecipe,
    };
    
    return (
        <AppContext.Provider value={contextValue}>
            <div className="bg-gray-800 font-sans h-full w-full flex flex-col">
                <div className="flex-grow flex min-h-0">
                    <Sidebar
                        isSidebarOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        onNewChat={handleNewChat}
                        onSaveChat={() => {
                             if(messages.length > 0 && !activeChatId) {
                                autoCreateChat();
                                toast.addToast("Chat saved!", "success");
                             }
                        }}
                        onLoadChat={(chatId) => {
                            const chat = savedChats.find(c => c.id === chatId);
                            if (chat) {
                                setMessages(chat.messages);
                                setActiveChatId(chat.id);
                                setActivePage('chat');
                            }
                        }}
                        onDeleteChat={(chatId) => {
                             if (window.confirm("Are you sure you want to delete this chat?")) {
                                setSavedChats(prev => prev.filter(c => c.id !== chatId));
                                if (activeChatId === chatId) {
                                    handleNewChat();
                                }
                            }
                        }}
                        onOpenProfile={() => setIsProfileOpen(true)}
                        onOpenPantry={() => setIsPantryOpen(true)}
                        onOpenSavedRecipes={() => setIsSavedRecipesOpen(true)}
                        onOpenMealPlanner={() => setActivePage('meal-planner')}
                        onShowFoodNews={() => setActivePage('food-news')}
                        onShowExplore={() => setActivePage('explore')}
                        onShowCapabilities={() => setActivePage('capabilities')}
                        onOpenHealthIntegrations={() => setIsHealthIntegrationOpen(true)}
                        onOpenPrivacySettings={() => setIsPrivacySettingsOpen(true)}
                        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
                        onOpenShoppingList={() => setActivePage('shopping-list')}
                        onShowAssistant={() => setActivePage('assistant')}
                        onShowSmartTools={() => setActivePage('smart-tools')}
                        onShowFoodRecognition={() => setActivePage('food-recognition')}
                        notificationPermission={notificationPermission}
                        savedChats={savedChats}
                        activeChatId={activeChatId}
                        isChatEmpty={messages.length === 0}
                        remainingActions={remainingActions}
                        activePage={activePage}
                    />
                    <main className="flex-grow flex flex-col bg-gray-900/50 min-w-0">
                        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                        <div ref={mainContentRef} className="flex-grow relative min-h-0 overflow-y-auto">
                           <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader /></div>}>
                                {renderPageContent()}
                            </Suspense>
                        </div>
                        <div className="flex-shrink-0">
                            {activePage === 'chat' 
                                ? <ChatInput onSendMessage={handleSendMessage} isLoading={!!activeJob} />
                                : (activePage !== 'assistant' && activePage !== 'smart-tools' && <Footer />)
                            }
                        </div>
                    </main>
                </div>
                
                <Suspense fallback={<div />}>
                    {isProfileOpen && <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} userProfile={userProfile} onUpdateProfile={setUserProfile} language={userProfile.language} />}
                    {isPantryOpen && <PantryManagerModal isOpen={isPantryOpen} onClose={() => setIsPantryOpen(false)} userProfile={userProfile} onUpdateProfile={setUserProfile} language={userProfile.language} />}
                    {isSavedRecipesOpen && <SavedRecipesModal isOpen={isSavedRecipesOpen} onClose={() => setIsSavedRecipesOpen(false)} savedRecipes={savedRecipes} onSelectRecipe={(recipe) => { handleNewChat(); addMessage({ role: 'model', type: 'recipe', content: '', data: recipe }); setIsSavedRecipesOpen(false); setActivePage('chat'); }} onFuseRecipes={handleFuseRecipes} onEditRecipe={setEditingRecipe} onToggleFavorite={handleToggleFavorite} language={userProfile.language} />}
                    {visualizingRecipe && <ImageGeneratorModal recipe={visualizingRecipe} onClose={() => setVisualizingRecipe(null)} language={userProfile.language} canPerformAction={() => canPerformAction('recipe')} recordAction={() => recordAction('recipe')} />}
                    {isCookingChoiceOpen && cookingRecipe && <CookingModeChoiceModal onClose={() => setIsCookingChoiceOpen(false)} onSelectSimple={() => { setCookingMode('simple'); setIsCookingChoiceOpen(false); }} onSelectAdvanced={() => { setCookingMode('advanced'); setIsCookingChoiceOpen(false); }} onSelectZen={() => { setCookingMode('zen'); setIsCookingChoiceOpen(false); }} />}
                    {cookingMode === 'simple' && cookingRecipe && <CookingMode recipe={cookingRecipe} onClose={() => { setCookingMode(null); setCookingRecipe(null); localStorage.removeItem(`cooking_step_${cookingRecipe.title}`); }} />}
                    {cookingMode === 'advanced' && cookingRecipe && <AdvancedCookingMode recipe={cookingRecipe} onClose={() => { setCookingMode(null); setCookingRecipe(null); }} />}
                    {cookingMode === 'zen' && cookingRecipe && <ZenMode recipe={cookingRecipe} onClose={() => { setCookingMode(null); setCookingRecipe(null); localStorage.removeItem(`cooking_step_${cookingRecipe.title}`); }} />}
                    {resumeCookingInfo && <ResumeCookingModal recipeTitle={resumeCookingInfo.recipe.title} onContinue={() => { setCookingRecipe(resumeCookingInfo.recipe); setCookingMode('simple'); setResumeCookingInfo(null);}} onDismiss={() => { localStorage.removeItem(`cooking_step_${resumeCookingInfo.recipe.title}`); setResumeCookingInfo(null);}} />}
                    {editingRecipe && <RecipeEditorModal isOpen={!!editingRecipe} onClose={() => setEditingRecipe(null)} recipe={editingRecipe} onSave={(originalTitle, updatedRecipe, mode) => { setSavedRecipes(prev => { if (mode === 'overwrite') { return prev.map(r => r.title === originalTitle ? updatedRecipe : r); } else { return [...prev.filter(r => r.title !== updatedRecipe.title), updatedRecipe]; } }); setEditingRecipe(null); }} />}
                    {isHealthIntegrationOpen && <HealthIntegrationModal isOpen={isHealthIntegrationOpen} onClose={() => setIsHealthIntegrationOpen(false)} userProfile={userProfile} onUpdateProfile={setUserProfile} />}
                    {isPrivacySettingsOpen && <PrivacySettingsModal isOpen={isPrivacySettingsOpen} onClose={() => setIsPrivacySettingsOpen(false)} userProfile={userProfile} onUpdateProfile={setUserProfile} onExportData={() => alert('Exporting data...')} onDeleteAccount={() => alert('Deleting account...')} />}
                    {isNotificationSettingsOpen && <NotificationSettingsModal isOpen={isNotificationSettingsOpen} onClose={() => setIsNotificationSettingsOpen(false)} permission={notificationPermission} onRequestPermission={handleRequestNotificationPermission} onSendTest={() => notificationService.showTestNotification()} userProfile={userProfile} onUpdateProfile={setUserProfile} />}
                    {substituteModalState && <IngredientSubstituteModal isOpen={!!substituteModalState} onClose={() => setSubstituteModalState(null)} recipe={substituteModalState.recipe} ingredient={substituteModalState.ingredient} />}
                    {pairingModalRecipe && <BeveragePairingModal isOpen={!!pairingModalRecipe} onClose={() => setPairingModalRecipe(null)} recipe={pairingModalRecipe} />}
                    {scalerModalRecipe && <RecipeScalerModal isOpen={!!scalerModalRecipe} onClose={() => setScalerModalRecipe(null)} recipe={scalerModalRecipe} onSaveScaledRecipe={(recipe) => handleSaveRecipe(recipe)} />}
                    {addToPlanRecipe && <AddToMealPlanModal isOpen={!!addToPlanRecipe} onClose={() => setAddToPlanRecipe(null)} recipeTitle={addToPlanRecipe.title} onSave={handleAddToMealPlan} />}
                </Suspense>
            </div>
        </AppContext.Provider>
    );
};
export default App;