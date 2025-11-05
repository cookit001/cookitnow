import { useState, useCallback, useEffect } from 'react';
import { useToast } from '../components/ToastProvider.tsx';

const LIMITS = {
    recipe: 5,
    assistant: 5,
};
const USAGE_STORAGE_KEY = 'cook-usage-tracker-v2';

type UsageCounts = Record<keyof typeof LIMITS, number>;
type UsageData = {
    date: string;
    counts: UsageCounts;
};

const getUsageData = (): UsageData => {
    const storedData = localStorage.getItem(USAGE_STORAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    const defaultCounts = { recipe: 0, assistant: 0 };

    if (storedData) {
        try {
            const parsed = JSON.parse(storedData);
            // Ensure the parsed data has the correct shape
            if (parsed.date && typeof parsed.counts === 'object' && 'recipe' in parsed.counts && 'assistant' in parsed.counts) {
                 // If the stored date is not today, reset counts
                if (parsed.date === today) {
                    return parsed;
                }
            }
        } catch (e) {
            // Malformed data, fall through to return default
        }
    }
    
    return { date: today, counts: defaultCounts };
};

const setUsageData = (data: UsageData) => {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
};

export const useUsageTracker = () => {
    const [usage, setUsage] = useState(getUsageData);
    const toast = useToast();

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === USAGE_STORAGE_KEY && event.newValue) {
                try {
                    const newUsageData = JSON.parse(event.newValue);
                    setUsage(newUsageData);
                } catch (e) {
                    console.error("Failed to parse usage data from storage event.", e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        const checkAndResetDate = () => {
            const today = new Date().toISOString().split('T')[0];
            const currentData = getUsageData(); 
            if (currentData.date !== today) {
                const newUsage = { date: today, counts: { recipe: 0, assistant: 0 } };
                setUsage(newUsage);
                setUsageData(newUsage);
            }
        };

        checkAndResetDate();

        window.addEventListener('focus', checkAndResetDate);
        return () => {
            window.removeEventListener('focus', checkAndResetDate);
        };
    }, []);

    const remainingActions = {
        recipe: Math.max(0, LIMITS.recipe - usage.counts.recipe),
        assistant: Math.max(0, LIMITS.assistant - usage.counts.assistant),
    };

    const canPerformAction = useCallback((type: keyof UsageCounts) => {
        const today = new Date().toISOString().split('T')[0];
        const currentData = getUsageData();
        
        if (currentData.date !== today) {
            const newUsage = { date: today, counts: { recipe: 0, assistant: 0 } };
            setUsage(newUsage);
            setUsageData(newUsage);
            return true;
        }

        if (currentData.counts[type] >= LIMITS[type]) {
            toast.addToast(`You have reached your daily limit of ${LIMITS[type]} ${type} actions.`, 'error');
            return false;
        }
        return true;
    }, [toast]);

    const recordAction = useCallback((type: keyof UsageCounts) => {
        const today = new Date().toISOString().split('T')[0];
        let currentData = getUsageData();

        if (currentData.date !== today) {
            currentData = { date: today, counts: { recipe: 0, assistant: 0 } };
        }
        
        const newCounts = {
            ...currentData.counts,
            [type]: currentData.counts[type] + 1,
        };
        const newUsage = { date: today, counts: newCounts };
        
        setUsage(newUsage);
        setUsageData(newUsage);
        
        if (newCounts[type] >= LIMITS[type]) {
            toast.addToast(`You have used your last ${type} action for today.`, 'info');
        }

    }, [toast]);

    return { remainingActions, canPerformAction, recordAction };
};