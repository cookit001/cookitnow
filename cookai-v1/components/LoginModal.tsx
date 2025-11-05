

import React, { useState } from 'react';

type View = 'login' | 'forgot';

const CookLogo = () => (
    <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center shrink-0 mb-6 ring-8 ring-gray-900/50">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M10 16.5l-5 -3l5 -3l5 3v5.5l-5 3z" />
            <path d="M10 8l-5 -3l5 -3l5 3l-5 3" />
            <path d="M15 13.5v5.5l5 3" />
            <path d="M20 8l-5 -3" />
        </svg>
    </div>
);


interface LoginModalProps {
    onLoginSuccess: () => void;
}

// Security Note for Demo: The email and password state in this component is ephemeral.
// It exists only while the modal is open and is not stored in localStorage, cookies,
// or any persistent storage, mitigating risks of client-side data sniffing.
const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
    const [activeView, setActiveView] = useState<View>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [form, setForm] = useState({ email: '', password: '' });

    const resetState = (view: View) => {
        setActiveView(view);
        setError('');
        setSuccessMessage('');
        setForm({ email: '', password: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            if (form.email.trim() && form.password.trim()) {
                onLoginSuccess();
            } else {
                setError("Please enter a valid email and password.");
                // Clear password field on failed attempt for better security practice
                setForm(f => ({ ...f, password: '' }));
            }
        }, 800);
    };
    
    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setSuccessMessage(`A password reset link has been sent to ${form.email}.`);
            setTimeout(() => resetState('login'), 3000);
        }, 1000);
    };


    const renderContent = () => {
        switch (activeView) {
            case 'forgot':
                 return (
                    <>
                        <h1 className="text-3xl font-bold text-center text-white mb-2">Reset Password</h1>
                        <p className="text-center text-gray-400 mb-8">We'll send a reset link to your email.</p>
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                             <div>
                                <label className="text-sm font-bold text-gray-400 block mb-2">Email Address</label>
                                <input type="email" name="email" required placeholder="you@example.com" value={form.email} onChange={handleChange} className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:border-green-500 focus:ring-0 transition" />
                            </div>
                            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                            {successMessage && <p className="text-xs text-green-400 text-center">{successMessage}</p>}
                            <button type="submit" disabled={isLoading || !!successMessage} className="w-full flex justify-center items-center p-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-600">
                                {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Send Reset Link"}
                            </button>
                            <p className="text-center text-sm text-gray-500"><button type="button" onClick={() => resetState('login')} className="font-bold text-green-400 hover:underline">Back to Sign In</button></p>
                        </form>
                    </>
                );
            default: // login
                return (
                    <>
                        <h1 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h1>
                        <p className="text-center text-gray-400 mb-8">Sign in to continue to Cook.</p>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-400 block mb-2">Email Address</label>
                                <input type="email" name="email" required placeholder="you@example.com" value={form.email} onChange={handleChange} className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:border-green-500 focus:ring-0 transition" />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-gray-400">Password</label>
                                    <button type="button" onClick={() => resetState('forgot')} className="text-xs text-green-400 hover:underline">Forgot Password?</button>
                                </div>
                                <input type="password" name="password" required placeholder="••••••••" value={form.password} onChange={handleChange} className="w-full p-3 bg-gray-800 border-2 border-gray-700 rounded-lg text-white focus:border-green-500 focus:ring-0 transition" />
                            </div>
                            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center p-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 disabled:bg-gray-600">
                                {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Sign In"}
                            </button>
                        </form>
                    </>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-90 flex flex-col items-center justify-center p-4 transition-opacity duration-500 z-50">
            <div className="w-full max-w-sm">
                <div className="flex justify-center">
                    <CookLogo />
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl">
                    {renderContent()}
                </div>
                 <p className="text-center text-sm text-gray-500 mt-4">For this demo, any email/password will work.</p>
            </div>
        </div>
    );
};

export default LoginModal;