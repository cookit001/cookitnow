import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../components/ToastProvider.tsx';
import * as geminiService from '../services/geminiService.ts';
import type { IngredientSubstitute, BeveragePairings, GarnishIdea, KitchenSafetyTip, Message, ConversionResult } from '../types.ts';
import { useAppContext } from '../App.tsx';
import CookLogo from '../components/CookLogo.tsx';
import ChatMessage from '../components/ChatMessage.tsx';
import AssistantInput from '../components/AssistantInput.tsx';

// --- Result Display Components ---

const SubstituteResult: React.FC<{ substitutes: IngredientSubstitute[] }> = ({ substitutes }) => (
    <div className="space-y-3 p-3">
        {substitutes.map((sub, i) => (
            <div key={i} className="p-3 bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-purple-300">{sub.substitute}</h3>
                <p className="text-sm text-gray-400"><strong>Quantity:</strong> {sub.quantity}</p>
                <p className="text-sm text-gray-400"><strong>Impact:</strong> {sub.impact}</p>
            </div>
        ))}
    </div>
);

const PairingResult: React.FC<{ pairings: BeveragePairings }> = ({ pairings }) => (
    <div className="space-y-4 p-3">
        {pairings.wine?.length > 0 && <div><h4 className="font-bold text-blue-300">Wine:</h4>{pairings.wine.map(p => <p key={p.name} className="text-sm">{p.name} - <em>{p.reason}</em></p>)}</div>}
        {pairings.beer?.length > 0 && <div><h4 className="font-bold text-blue-300">Beer:</h4>{pairings.beer.map(p => <p key={p.name} className="text-sm">{p.name} - <em>{p.reason}</em></p>)}</div>}
        {pairings.nonAlcoholic?.length > 0 && <div><h4 className="font-bold text-blue-300">Non-Alcoholic:</h4>{pairings.nonAlcoholic.map(p => <p key={p.name} className="text-sm">{p.name} - <em>{p.reason}</em></p>)}</div>}
    </div>
);

const ScalerResult: React.FC<{ ingredients: string[], toServings: string }> = ({ ingredients, toServings }) => (
    <div className="p-3">
        <h3 className="font-semibold text-green-300 mb-2">Scaled for {toServings}:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
            {ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
        </ul>
    </div>
);

const GarnishResult: React.FC<{ garnishes: GarnishIdea[] }> = ({ garnishes }) => (
    <div className="space-y-3 p-3">
        {garnishes.map((g, i) => (
            <div key={i} className="p-3 bg-gray-800 rounded-lg">
                <h3 className="font-semibold text-yellow-300">{g.idea}</h3>
                <p className="text-sm text-gray-400">{g.instructions}</p>
            </div>
        ))}
    </div>
);

const SafetyResult: React.FC<{ tip: KitchenSafetyTip }> = ({ tip }) => (
    <div className="p-4 bg-yellow-900/30 border-l-4 border-yellow-500">
        <h3 className="font-bold text-yellow-300">{tip.tip}</h3>
        <p className="text-sm text-gray-300 mt-1">{tip.explanation}</p>
    </div>
);

const ConversionResultDisplay: React.FC<{ result: ConversionResult, from: string }> = ({ result, from }) => (
     <div className="p-4 text-center">
        <p className="text-sm text-gray-400">{from} is</p>
        <p className="text-3xl font-bold text-green-400">{result.quantity.toLocaleString()} {result.unit}</p>
    </div>
);


// --- Main Page Component ---

const SmartToolsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { userProfile, canPerformAction, recordAction } = useAppContext();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const toast = useToast();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (messageText: string) => {
        if (isLoading) return;
        if (!canPerformAction('assistant')) {
            setMessages(prev => [...prev, { role: 'system', type: 'text', content: `Daily limit reached.` }]);
            return;
        }

        const userMessage: Message = { role: 'user', type: 'text', content: messageText };
        setMessages(prev => [...prev, userMessage, { role: 'model', type: 'loading', content: 'thinking' }]);
        setIsLoading(true);
        
        try {
            const history = messages.filter(m => m.type === 'text').map(m => ({ role: m.role as 'user' | 'model', parts: [{ text: m.content }] }));
            const systemInstruction = "You are Cook's Smart Tool assistant. Your goal is to help the user with specific cooking-related tasks by using your available tools. Be direct and tool-focused. When a user asks for a substitute, pairing, scaling, etc., identify the required parameters and call the appropriate function. Do not answer conversationally unless you cannot use a tool.";
            
            const response = await geminiService.getConversationalResponse(messageText, history, userProfile, null, systemInstruction);

            let newMessages: Message[] = [];

            if (response.functionCalls?.length > 0) {
                 for (const fc of response.functionCalls) {
                    recordAction('assistant'); // Count tool usage
                    let resultData: any = null;
                    let resultType: string = 'text';

                    try {
                        switch (fc.name) {
                            case 'getIngredientSubstitute':
                                resultData = await geminiService.getIngredientSubstitute(fc.args.ingredient, fc.args.recipeContext, userProfile);
                                resultType = 'substitute';
                                break;
                            case 'getBeveragePairingForDish':
                                resultData = await geminiService.getBeveragePairingForDish(fc.args.dishDescription, userProfile);
                                resultType = 'pairing';
                                break;
                            case 'scaleIngredients':
                                resultData = await geminiService.scaleIngredients(fc.args.ingredients, fc.args.fromServings, fc.args.toServings, userProfile);
                                resultType = 'scaler';
                                break;
                            case 'getGarnishIdeas':
                                resultData = await geminiService.getGarnishIdeas(fc.args.dishDescription, userProfile);
                                resultType = 'garnish';
                                break;
                            case 'getKitchenSafetyTip':
                                resultData = await geminiService.getKitchenSafetyTip(fc.args.topic, userProfile);
                                resultType = 'safety';
                                break;
                            case 'convertUnits':
                                resultData = await geminiService.convertUnits(fc.args.from, fc.args.to, userProfile.language);
                                resultType = 'conversion';
                                break;
                            default:
                                throw new Error(`Unknown tool: ${fc.name}`);
                        }
                        
                        newMessages.push({
                            role: 'model',
                            type: 'smart-tool-result',
                            content: `Result for ${fc.name}`,
                            data: { type: resultType, payload: resultData, originalArgs: fc.args }
                        });

                    } catch(e: any) {
                         newMessages.push({ role: 'system', type: 'text', content: e.message });
                    }
                }
            } else if (response.text) {
                 newMessages.push({ role: 'model', type: 'text', content: response.text });
                 recordAction('assistant');
            } else {
                 newMessages.push({ role: 'system', type: 'text', content: "Sorry, I couldn't process that request. Please try rephrasing." });
            }

            setMessages(prev => [...prev.filter(m => m.type !== 'loading'), ...newMessages]);

        } catch (error: any) {
             setMessages(prev => [...prev.filter(m => m.type !== 'loading'), { role: 'system', type: 'text', content: error.message || "An unexpected error occurred." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderSmartToolResult = (data: any) => {
        switch (data.type) {
            case 'substitute': return <SubstituteResult substitutes={data.payload} />;
            case 'pairing': return <PairingResult pairings={data.payload} />;
            case 'scaler': return <ScalerResult ingredients={data.payload} toServings={data.originalArgs.toServings} />;
            case 'garnish': return <GarnishResult garnishes={data.payload} />;
            case 'safety': return <SafetyResult tip={data.payload} />;
            case 'conversion': return <ConversionResultDisplay result={data.payload} from={data.originalArgs.from} />;
            default: return <p>Unsupported tool result.</p>;
        }
    };

    return (
        <div className="w-full h-full flex flex-col text-gray-200">
            <header className="p-4 flex items-center gap-4 flex-shrink-0 border-b border-gray-700/80">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">Smart Tools</h1>
            </header>

            <main className="flex-grow overflow-y-auto">
                <div className="chat-container p-4 w-full">
                     {messages.length === 0 ? (
                        <div className="flex-grow flex flex-col justify-center items-center text-center p-4 h-full">
                            <CookLogo className="w-24 h-24 mb-6" />
                            <h2 className="text-3xl font-bold text-white mb-2">Smart Tools Assistant</h2>
                            <p className="text-lg text-gray-400 max-w-lg">How can I help you in the kitchen? Try asking:</p>
                            <div className="text-sm text-gray-300 mt-4 space-y-2">
                                <p>"Find a substitute for buttermilk"</p>
                                <p>"What wine goes well with steak?"</p>
                                <p>"Convert 1 cup of flour to grams"</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages.map((msg, i) => 
                                msg.type === 'smart-tool-result' 
                                ? <div key={`tool-${i}`} className="flex gap-3 items-start w-full justify-start animate-slide-in-left">
                                      <div className="w-8 h-8 rounded-full bg-gray-900 border border-green-500/50 flex items-center justify-center shrink-0 ring-2 ring-gray-900"><CookLogo className="w-5 h-5" /></div>
                                      <div className="max-w-xl w-auto"><div className="rounded-2xl bg-gray-700 text-gray-200 rounded-bl-none overflow-hidden">{renderSmartToolResult(msg.data)}</div></div>
                                  </div>
                                : <ChatMessage key={`tool-msg-${i}`} message={msg} activeJob={isLoading ? 'assistant' : null} />
                            )}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </main>
            
            <AssistantInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
    );
};

export default SmartToolsPage;
