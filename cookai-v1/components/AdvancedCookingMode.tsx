import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import type { Recipe } from '../types.ts';
import { sousChefTools } from '../services/geminiService.ts';
import { useToast } from './ToastProvider.tsx';
import CookLogo from './CookLogo.tsx';
import * as geminiService from '../services/geminiService.ts';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AssistantOrb: React.FC<{ status: 'connecting' | 'listening' | 'processing' | 'speaking' }> = ({ status }) => {
    const statusConfig = {
        connecting: { text: 'Connecting...', class: 'animate-pulse' },
        listening: { text: 'Listening...', class: 'animate-pulse-intense' },
        processing: { text: 'Thinking...', class: 'animate-spin' },
        speaking: { text: 'Speaking...', class: 'animate-ping-slow' },
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-48 h-48 rounded-full bg-gray-900 flex items-center justify-center relative">
                <div className={`absolute inset-0 rounded-full bg-green-500/20 blur-2xl ${statusConfig[status].class}`}></div>
                <div className="w-40 h-40 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                    <CookLogo className="w-24 h-24" />
                </div>
            </div>
            <p className="font-semibold text-lg text-gray-300 capitalize">{statusConfig[status].text}</p>
        </div>
    );
};

interface Timer {
    id: number;
    label: string;
    remaining: number;
}

interface AdvancedCookingModeProps {
    recipe: Recipe;
    onClose: () => void;
}

interface ConversationTurn {
    user: string;
    model: string;
}

const AdvancedCookingMode: React.FC<AdvancedCookingModeProps> = ({ recipe, onClose }) => {
    const [status, setStatus] = useState<'connecting' | 'listening' | 'processing' | 'speaking'>('connecting');
    const [currentStep, setCurrentStep] = useState(0);
    const [checkedSteps, setCheckedSteps] = useState<boolean[]>(() => Array(recipe.instructions.length).fill(false));
    const [error, setError] = useState<string | null>(null);
    const [timers, setTimers] = useState<Timer[]>([]);
    
    // For live transcription display
    const [currentUserTranscript, setCurrentUserTranscript] = useState('');
    const [currentModelTranscript, setCurrentModelTranscript] = useState('');
    const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    
    const toast = useToast();
    const stepListRef = useRef<HTMLUListElement>(null);

    // Timer countdown effect
    useEffect(() => {
        const timerInterval = setInterval(() => {
            setTimers(prev => 
                prev.map(t => ({...t, remaining: Math.max(0, t.remaining - 1)}))
                    .filter(t => {
                        if (t.remaining === 0) {
                            toast.addToast(`Timer "${t.label}" is finished!`, 'success');
                            return false;
                        }
                        return true;
                    })
            );
        }, 1000);
        return () => clearInterval(timerInterval);
    }, [toast]);
    
    // Scroll to current step in sidebar
    useEffect(() => {
        const currentStepElement = stepListRef.current?.children[currentStep] as HTMLLIElement;
        currentStepElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentStep]);


    useEffect(() => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        
        const connect = async () => {
            let stream: MediaStream | null = null;
            let inputAudioContext: AudioContext | null = null;
            let outputAudioContext: AudioContext | null = null;
            let scriptProcessor: ScriptProcessorNode | null = null;
            let sources = new Set<AudioBufferSourceNode>();
            let nextStartTime = 0;

            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                inputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
                if (inputAudioContext.state === 'suspended') await inputAudioContext.resume();
                
                outputAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
                if (outputAudioContext.state === 'suspended') await outputAudioContext.resume();
                
                const systemInstruction = `You are Cook's Sous Chef, an expert AI assistant. The user is cooking "${recipe.title}". Be concise and directly answer cooking-related questions. Use the provided tools 'goToStep' for navigation, 'setTimer' for timers, and 'getIngredientSubstitute' for substitutions when requested. For substitutions, you MUST provide the recipe context which is always the current recipe title. The current recipe has ${recipe.instructions.length} steps.`;
                
                let currentUserTranscriptAccumulator = '';
                let currentModelTranscriptAccumulator = '';
                
                sessionPromiseRef.current = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                        systemInstruction,
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        tools: [{ functionDeclarations: sousChefTools }]
                    },
                    callbacks: {
                        onopen: () => {
                            setStatus('listening');
                            const source = inputAudioContext!.createMediaStreamSource(stream!);
                            scriptProcessor = inputAudioContext!.createScriptProcessor(4096, 1, 1);

                            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                                const l = inputData.length;
                                const int16 = new Int16Array(l);
                                for (let i = 0; i < l; i++) int16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                                
                                const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                                sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                            };
                            source.connect(scriptProcessor);
                            scriptProcessor.connect(inputAudioContext!.destination);
                        },
                        onmessage: async (message: LiveServerMessage) => {
                             if (message.serverContent?.inputTranscription) {
                                 currentUserTranscriptAccumulator += message.serverContent.inputTranscription.text;
                                 setCurrentUserTranscript(currentUserTranscriptAccumulator);
                             }
                             if (message.serverContent?.outputTranscription) {
                                 currentModelTranscriptAccumulator += message.serverContent.outputTranscription.text;
                                 setCurrentModelTranscript(currentModelTranscriptAccumulator);
                             }
                             
                             if (message.serverContent?.turnComplete) {
                                setConversationHistory(prev => [...prev, { user: currentUserTranscriptAccumulator, model: currentModelTranscriptAccumulator }]);
                                currentUserTranscriptAccumulator = '';
                                currentModelTranscriptAccumulator = '';
                                setCurrentUserTranscript('');
                                setCurrentModelTranscript('');
                             }

                             if (message.toolCall) {
                                for(const fc of message.toolCall.functionCalls) {
                                    let resultPayload = "OK";
                                    if(fc.name === 'goToStep') {
                                        const step = fc.args.stepNumber;
                                        if (step > 0 && step <= recipe.instructions.length) setCurrentStep(step - 1);
                                    } else if (fc.name === 'setTimer') {
                                        const { durationInSeconds, timerLabel } = fc.args;
                                        setTimers(prev => [...prev, { id: Date.now(), label: timerLabel, remaining: durationInSeconds }]);
                                    } else if (fc.name === 'getIngredientSubstitute') {
                                        const subs = await geminiService.getIngredientSubstitute(fc.args.ingredient, recipe.title, {name: 'user'} as any);
                                        resultPayload = JSON.stringify(subs);
                                    }

                                    const result = { id: fc.id, name: fc.name, response: { result: resultPayload } };
                                    sessionPromiseRef.current?.then(session => session.sendToolResponse({ functionResponses: result }));
                                }
                             }

                            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                            if (base64Audio && outputAudioContext) {
                                 if (outputAudioContext.state === 'suspended') await outputAudioContext.resume();
                                setStatus('speaking');
                                nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                                const source = outputAudioContext.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputAudioContext.destination);
                                source.onended = () => { 
                                    sources.delete(source);
                                    if(sources.size === 0) setStatus('listening');
                                 };
                                source.start(nextStartTime);
                                nextStartTime = nextStartTime + audioBuffer.duration;
                                sources.add(source);
                            }
                        },
                        onerror: (e: ErrorEvent) => {
                            console.error('Live session error:', e);
                            setError("The Sous Chef is temporarily unavailable. Please try again in a moment.");
                            setStatus('connecting');
                        },
                        onclose: () => { setStatus('connecting'); },
                    },
                });

                cleanupRef.current = () => {
                    sessionPromiseRef.current?.then(s => s.close());
                    stream?.getTracks().forEach(track => track.stop());
                    scriptProcessor?.disconnect();
                    if (inputAudioContext && inputAudioContext.state !== 'closed') inputAudioContext.close();
                    if (outputAudioContext && outputAudioContext.state !== 'closed') outputAudioContext.close();
                };

            } catch (err) {
                console.error('Failed to start audio session:', err);
                setError('Could not access microphone. Please check permissions.');
                setStatus('connecting');
            }
        };
        
        connect();
        return () => cleanupRef.current?.();

    }, [recipe.title, recipe.instructions]);

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col" role="dialog" aria-modal="true">
            <header className="flex-shrink-0 flex items-center justify-between text-white p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold truncate">{recipe.title}</h2>
                <button onClick={onClose} className="text-3xl font-light hover:text-gray-400">&times;</button>
            </header>

            <div className="flex-grow flex flex-col md:flex-row min-h-0">
                {/* Left Sidebar: Recipe Steps */}
                <aside className="w-full md:w-1/3 xl:w-1/4 bg-gray-800/50 border-r border-gray-700 flex flex-col">
                    <h3 className="p-4 text-lg font-bold border-b border-gray-700">Recipe Steps</h3>
                    <ul ref={stepListRef} className="flex-grow overflow-y-auto p-2 space-y-2">
                         {recipe.instructions.map((step, index) => (
                            <li key={index}>
                                <button onClick={() => setCurrentStep(index)} className={`w-full text-left p-3 rounded-lg transition-colors ${currentStep === index ? 'bg-green-900/50' : 'bg-gray-700/50 hover:bg-gray-700'}`}>
                                    <div className="flex items-start gap-3">
                                        <input type="checkbox" checked={checkedSteps[index]} onChange={() => setCheckedSteps(p => p.map((c, i) => i === index ? !c : c))} className="mt-1 form-checkbox h-5 w-5 bg-gray-600 border-gray-500 rounded text-green-500 focus:ring-green-500" />
                                        <div className="flex-1">
                                            <span className={`font-semibold ${currentStep === index ? 'text-green-300' : 'text-gray-400'}`}>Step {index + 1}</span>
                                            <p className={`text-sm ${checkedSteps[index] ? 'line-through text-gray-500' : 'text-gray-200'}`}>{step}</p>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {timers.length > 0 && (
                        <div className="flex-shrink-0 p-4 border-t border-gray-700">
                            <h3 className="font-bold mb-2">Active Timers</h3>
                            <div className="space-y-2">
                                {timers.map(t => (
                                    <div key={t.id} className="bg-green-800/80 p-2 rounded-lg flex justify-between items-center">
                                        <span className="text-sm font-semibold">{t.label}</span>
                                        <p className="font-mono text-lg">{Math.floor(t.remaining / 60).toString().padStart(2,'0')}:{ (t.remaining % 60).toString().padStart(2, '0') }</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                 {/* Main Content: Conversation Hub */}
                <main className="flex-grow flex flex-col justify-between items-center text-center text-white p-6">
                    <div>
                        <p className="text-lg font-semibold text-gray-400 mb-4">
                            Step {currentStep + 1} of {recipe.instructions.length}
                        </p>
                        <p className="text-3xl sm:text-4xl font-medium max-w-2xl leading-relaxed text-gray-300">
                           {recipe.instructions[currentStep]}
                        </p>
                    </div>
                    
                    <AssistantOrb status={status} />
                    
                    <div className="w-full max-w-xl h-48 flex flex-col justify-end">
                         {error && <p className="text-lg text-red-400">{error}</p>}
                         <div className="space-y-2">
                            {currentUserTranscript && (
                                <div className="self-end ml-auto max-w-xs bg-blue-600 text-white p-3 rounded-2xl rounded-br-lg animate-fade-in text-left">
                                    {currentUserTranscript}
                                </div>
                            )}
                             {currentModelTranscript && (
                                <div className="self-start mr-auto max-w-xs bg-gray-700 text-gray-200 p-3 rounded-2xl rounded-bl-lg animate-fade-in text-left">
                                    {currentModelTranscript}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center mt-4 text-sm">
                        <p className="text-gray-500 w-full">Try saying:</p>
                        <span className="bg-gray-700 px-2 py-1 rounded">"Next step"</span>
                        <span className="bg-gray-700 px-2 py-1 rounded">"What can I use instead of butter?"</span>
                        <span className="bg-gray-700 px-2 py-1 rounded">"Set a 5 minute timer for rice"</span>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdvancedCookingMode;