import React from 'react';
import type { Message, Recipe, UserProfile, RecipeVariant, Tutorial, GroundingChunk } from '../types.ts';
import RecipeDisplayWrapper from './RecipeDisplayWrapper.tsx';
import RecipeVariantsDisplay from './RecipeVariantsDisplay.tsx';
import ImageRecipeSuggestions from './ImageRecipeSuggestions.tsx';
import TutorialsDisplay from './VideoTutorialsDisplay.tsx';
import GroundedResponseDisplay from './GroundedResponseDisplay.tsx';
import { sanitizeHtml } from '../services/security.ts';
import LoadingMessage from './LoadingMessage.tsx';
import { useAppContext } from '../App.tsx';
import CookLogo from './CookLogo.tsx';

const UserIcon: React.FC = () => {
    const { userProfile } = useAppContext();
    return (
        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-white text-sm shrink-0 ring-2 ring-gray-900">
             {userProfile.name.charAt(0)}
        </div>
    );
};

const ModelIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-gray-900 border border-green-500/50 flex items-center justify-center shrink-0 ring-2 ring-gray-900">
      <CookLogo className="w-5 h-5" />
    </div>
);

interface ChatMessageProps {
  message: Message;
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>;
  onUpdateRating?: (title: string, rating: number) => void;
  onVisualizeDish?: (recipe: Recipe) => void;
  onStartCooking?: (recipe: Recipe) => void;
  onSetReminder?: (title: string, delay: number) => void;
  onAddToList?: (ingredients: string[]) => void;
  onShowSubstituteModal?: (recipe: Recipe, ingredient: string) => void;
  onShowPairingModal?: (recipe: Recipe) => void;
  onShowScalerModal?: (recipe: Recipe) => void;
  onShowAddToPlan?: (recipe: Recipe) => void;
  activeJob?: string | null;
  onCancelJob?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = (props) => {
  const { message, ...restProps } = props;
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const { canPerformAction, recordAction, addMessage } = useAppContext();

  const renderContent = () => {
    switch (message.type) {
        case 'loading':
            return <LoadingMessage jobType={message.content} onCancel={props.onCancelJob!} />;
        case 'image-query':
            return (
                <div className="p-2 space-y-3">
                    {message.content && <p className="text-white px-1">{message.content}</p>}
                    {message.data?.imageUrl && (
                        <img 
                            src={message.data.imageUrl} 
                            alt="User upload with prompt" 
                            className="w-full h-auto object-cover rounded-lg" 
                            style={{ maxHeight: '250px' }} 
                        />
                    )}
                </div>
            );
        case 'recipe':
        case 'fused-recipe':
            // FIX: Pass the rest of the props, excluding 'message', to avoid a type mismatch where an unexpected 'message' prop was being passed.
            // Cast restProps to satisfy the required props of RecipeDisplayWrapper, as they are guaranteed to be passed in this context.
            return <RecipeDisplayWrapper recipe={message.data} {...restProps as any} />;
        case 'variations':
            return <RecipeVariantsDisplay variants={message.data.variants} originalRecipe={message.data.originalRecipe} onSaveVariation={message.data.onSaveVariation} />;
        case 'image-suggestions':
            return <ImageRecipeSuggestions {...message.data} onSelectRecipe={(recipe: Recipe) => { if (canPerformAction('recipe')) { addMessage({ role: 'model', type: 'recipe', content: `Here is the recipe for ${recipe.title}.`, data: recipe }); recordAction('recipe'); } }} />;
        case 'tutorials':
            return <TutorialsDisplay tutorials={message.data} />;
        case 'grounded-response':
            return <GroundedResponseDisplay content={message.content} citations={message.data} />;
        case 'smart-tool-result':
             // This case is handled by specific pages like SmartToolsPage, but providing a fallback.
             return <div className="prose prose-invert prose-sm max-w-none px-2"><pre><code>{JSON.stringify(message.data, null, 2)}</code></pre></div>;
        case 'text':
        default:
            return <div className="prose prose-invert prose-base max-w-none px-2" dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.content) }}></div>;
    }
  };

  if (isSystem) {
      return (
        <div className="flex justify-center items-center gap-2 text-sm text-yellow-500 my-2 animate-slide-in-up">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.236 2.86-1.236 3.496 0l6.284 12.212A2 2 0 0116.22 18H3.78a2 2 0 01-1.817-2.689l6.284-12.212zM10 14a1 1 0 100-2 1 1 0 000 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
            <span className="text-center">{message.content}</span>
        </div>
      )
  }

  const hasComplexContent = ['recipe', 'fused-recipe', 'variations', 'image-suggestions', 'tutorials', 'smart-tool-result'].includes(message.type);
  const isRecipe = message.type === 'recipe' || message.type === 'fused-recipe';

  return (
    <div className={`flex gap-3 items-start w-full ${isUser ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'}`} style={isRecipe ? { perspective: '1000px' } : {}}>
        {!isUser && <ModelIcon />}
        <div className="max-w-xl w-auto">
            <div className={`rounded-2xl ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'} ${!hasComplexContent ? 'p-3' : 'p-0 overflow-hidden'} ${isRecipe ? 'animate-recipe-rotate-in' : ''}`}>
                 {renderContent()}
            </div>
        </div>
        {isUser && <UserIcon />}
    </div>
  );
};

export default React.memo(ChatMessage);