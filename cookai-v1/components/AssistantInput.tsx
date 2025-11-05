import React, { useState } from 'react';

interface AssistantInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const AssistantInput: React.FC<AssistantInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full p-4 flex-shrink-0 bg-gray-900 border-t border-gray-700/80">
      <div className="chat-container">
        <div className="bg-gray-800 p-2 flex items-end gap-2 border border-gray-700 focus-within:border-green-500 transition-colors rounded-xl">
          <div className="flex-grow">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a cooking question..."
              className="w-full bg-transparent resize-none outline-none text-gray-200 placeholder-gray-500"
              rows={1}
              style={{maxHeight: '100px'}}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <button onClick={handleSend} disabled={isLoading || !message.trim()} className="p-2 text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Send message">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssistantInput;