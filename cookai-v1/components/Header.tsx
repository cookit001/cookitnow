import React from 'react';
import CookLogo from './CookLogo.tsx';
import { useAppContext } from '../App.tsx';

const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;

interface HeaderProps {
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
    const { userProfile } = useAppContext();
    const [date, setDate] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const greeting = () => {
        const hour = date.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <header className="w-full p-4 flex-shrink-0 bg-gray-900/50 backdrop-blur-md sticky top-0 z-20 border-b border-gray-700/60">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onToggleSidebar} className="p-2.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors md:hidden" title="Toggle Menu">
                        <MenuIcon/>
                    </button>
                    <div className="flex items-center gap-3">
                         <CookLogo className="w-10 h-10" />
                         <div className="hidden sm:block">
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                {greeting()}, {userProfile.name.split(' ')[0]}
                                {userProfile.cookingStreak > 0 && (
                                    <span className="flex items-center gap-1 text-orange-400 animate-fade-in" title={`You're on a ${userProfile.cookingStreak}-day cooking streak!`}>
                                        🔥 {userProfile.cookingStreak}
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs text-gray-400">{date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                         </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center font-bold text-white text-lg ring-2 ring-offset-2 ring-offset-gray-900 ring-green-500">
                        {userProfile.name.charAt(0)}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default React.memo(Header);