import React, { useState, useRef, useCallback } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string, image?: { base64: string; mimeType: string; dataUrl: string }) => void;
  isLoading: boolean;
}

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSend = () => {
    const canSend = (message.trim() || imageDataUrl) && !isLoading;
    if (canSend) {
      let image: { base64: string; mimeType: string; dataUrl: string; } | undefined = undefined;
      if (imageDataUrl) {
          const parts = imageDataUrl.split(',');
          const mimeType = parts[0].match(/:(.*?);/)?.[1];
          const base64 = parts[1];
          if(mimeType && base64) {
              image = { base64, mimeType, dataUrl: imageDataUrl };
          }
      }

      onSendMessage(message.trim(), image);
      setMessage('');
      setImageDataUrl(null);
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null);
    // Fix: Reset the input value to allow selecting the same file again
    // and prevent weird state issues on cancel.
    e.target.value = '';
  };
  
  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(isEntering);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileSelect(e.dataTransfer.files[0]);
          e.dataTransfer.clearData();
      }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();
  const removeImage = () => {
    setImageDataUrl(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  }

  const isSendable = (message.trim() || imageDataUrl) && !isLoading;

  return (
    <div className="w-full py-1 md:py-2 px-2 md:px-4 flex-shrink-0 bg-gray-900/50">
      <div 
        className="chat-container relative"
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="drag-overlay">
            <UploadIcon />
            <p className="mt-2 font-semibold text-white">Drop image to upload</p>
          </div>
        )}

        <div className="bg-gray-900/50 backdrop-blur-md rounded-xl shadow-2xl ring-1 ring-white/10 focus-within:ring-green-500/80 transition-all duration-300">
            {imageDataUrl && (
                <div className="p-3 border-b border-white/10 flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <img src={imageDataUrl} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-green-400 text-sm font-semibold">Image Attached</span>
                        <p className="text-xs text-gray-400">Ask a question about this image below.</p>
                      </div>
                    </div>
                    <button onClick={removeImage} className="w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-500">&times;</button>
                </div>
            )}
            <div className={`p-2 flex items-end gap-2`}>
              <button onClick={triggerFileSelect} className="p-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors" aria-label="Attach image">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <div className="flex-grow">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for a recipe, or upload an image of ingredients..."
                  className="w-full bg-transparent resize-none outline-none text-gray-200 placeholder-gray-500"
                  rows={1}
                  style={{maxHeight: '100px'}}
                  disabled={isLoading}
                />
              </div>
              <button onClick={handleSend} disabled={!isSendable} className="p-2.5 text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-200 transform active:scale-90" aria-label="Send message">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 transition-transform duration-300 ${isSendable ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;