import React from 'react';
import type { Message } from '../types.ts';
import AssistantInput from '../components/AssistantInput.tsx';
import ChatMessage from '../components/ChatMessage.tsx';
import CookLogo from '../components/CookLogo.tsx';

interface AssistantPageProps {
    messages: Message[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    onBack: () => void;
    onCancelJob: () => void;
}

const AssistantPage: React.FC<AssistantPageProps> = ({ messages, onSendMessage, isLoading, messagesEndRef, onBack, onCancelJob }) => {

    return (
        <div className="w-full h-full flex flex-col text-gray-200 bg-gray-900">
            <header className="p-4 flex items-center gap-4 flex-shrink-0 border-b border-gray-700/80">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">Cook Assistant</h1>
            </header>
            
            <main className="flex-grow overflow-y-auto">
                <div className="chat-container p-4 w-full">
                    {messages.length === 0 ? (
                        <div className="flex-grow flex flex-col justify-center items-center text-center p-4 h-full">
                            <CookLogo className="w-24 h-24 mb-6" />
                            <h2 className="text-3xl font-bold text-white mb-2">How can I help?</h2>
                            <p className="text-lg text-gray-400 max-w-md">Ask me anything about cooking, ingredients, or techniques.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg, i) => <ChatMessage key={`assistant-${i}`} message={msg} activeJob={isLoading ? 'assistant' : null} onCancelJob={onCancelJob} />)}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            
            <AssistantInput onSendMessage={onSendMessage} isLoading={isLoading} />
        </div>
    );
};

export default AssistantPage;