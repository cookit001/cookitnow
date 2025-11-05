import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as geminiService from '../services/geminiService.ts';
import type { ImageAnalysisResult } from '../types.ts';
import { useToast } from '../components/ToastProvider.tsx';
import { useAppContext } from '../App.tsx';
import ImageRecipeSuggestions from '../components/ImageRecipeSuggestions.tsx';
import Loader from '../components/Loader.tsx';

// Icons
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const FoodRecognitionPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { userProfile, canPerformAction, recordAction, addMessage } = useAppContext();
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [imageData, setImageData] = useState<{ base64: string; mimeType: string; dataUrl: string; } | null>(null);
    const [result, setResult] = useState<ImageAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);

    const handleFileSelect = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                const parts = dataUrl.split(',');
                const mimeType = parts[0].match(/:(.*?);/)?.[1];
                const base64 = parts[1];
                if (mimeType && base64) {
                    setImageData({ base64, mimeType, dataUrl });
                    setResult(null); // Clear previous results
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileSelect(e.target.files?.[0] || null);
        // Fix: Reset the input value to allow selecting the same file again.
        e.target.value = '';
    };

    const handleAnalyze = async () => {
        if (!imageData) {
            toast.addToast("Please select an image first.", "info");
            return;
        }
        if (!canPerformAction('recipe')) {
            toast.addToast("Daily limit reached for this feature.", "error");
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const analysisResult = await geminiService.analyzeImage(imageData.base64, imageData.mimeType, userProfile);
            setResult(analysisResult);
            recordAction('recipe');
        } catch (error: any) {
            toast.addToast(error.message || "Failed to analyze image.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLoading) return;
        setIsDragging(isEntering);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (isLoading) return;
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    }, []);

    const startCamera = async () => {
        if (isCameraOn) {
            stopCamera();
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(err => {
                    console.error("Video play failed:", err);
                    toast.addToast("Could not start camera preview. Please check permissions.", "error");
                });
            }
            setIsCameraOn(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.addToast("Could not access camera. Please check permissions.", "error");
        }
    };
    
    useEffect(() => {
        return () => stopCamera(); // Cleanup on unmount
    }, [stopCamera]);

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            if (canvas.width === 0 || canvas.height === 0) {
                toast.addToast("Camera is not ready yet. Please try again in a moment.", "info");
                return;
            }

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                const base64Data = dataUrl.split(',')[1];

                if (base64Data && base64Data.length > 100) { // A minimal check for valid image data
                    setImageData({ base64: base64Data, mimeType: 'image/jpeg', dataUrl });
                    setResult(null);
                    stopCamera();
                } else {
                    toast.addToast("Failed to capture a clear image. Please try again.", "error");
                }
            }
        }
    };
    
    const handleSelectRecipe = (recipe: any) => {
        addMessage({ role: 'model', type: 'recipe', content: `Here is the recipe for ${recipe.title}.`, data: recipe });
        onBack();
    };

    return (
        <div className="w-full h-full flex flex-col text-gray-200">
            <header className="p-4 flex items-center gap-4 flex-shrink-0 border-b border-gray-700/80">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 transition-colors" title="Back">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">Food Recognition</h1>
            </header>

            <main className="flex-grow p-4 sm:p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    {/* Input Section */}
                    {!result && !isLoading && (
                        <div className="space-y-6 animate-fade-in">
                            <div
                                onDragEnter={(e) => handleDragEvents(e, true)}
                                onDragLeave={(e) => handleDragEvents(e, false)}
                                onDragOver={(e) => handleDragEvents(e, true)}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed ${isDragging ? 'border-green-500' : 'border-gray-600'} rounded-xl p-8 text-center bg-gray-800/50 cursor-pointer hover:border-gray-500 transition-colors`}
                                onClick={() => !isCameraOn && fileInputRef.current?.click()}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept="image/*" className="hidden" />
                                {imageData ? (
                                    <div className="flex flex-col items-center">
                                        <img src={imageData.dataUrl} alt="Preview" className="max-h-64 rounded-lg object-contain" />
                                        <p className="mt-4 text-sm text-gray-400">Image selected. Click Analyze to continue.</p>
                                    </div>
                                ) : isCameraOn ? (
                                    <div className="flex flex-col items-center">
                                        <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm rounded-lg" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <UploadIcon />
                                        <p className="mt-2 font-semibold text-white">Drag & drop an image of your ingredients</p>
                                        <p className="text-sm text-gray-500">or click to browse</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                {isCameraOn ? (
                                    <>
                                        <button onClick={captureImage} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition">Capture Photo</button>
                                        <button onClick={stopCamera} className="w-full py-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-600 transition">Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={startCamera} className="w-full sm:w-auto flex-1 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"><CameraIcon /> Take a Photo</button>
                                        <button onClick={handleAnalyze} disabled={!imageData || isLoading} className="w-full sm:w-auto flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition disabled:bg-gray-600">Analyze Image</button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <canvas ref={canvasRef} className="hidden"></canvas>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center gap-4 py-16">
                            <Loader />
                            <p className="text-lg font-semibold text-gray-300">Analyzing ingredients...</p>
                        </div>
                    )}

                    {/* Result Display */}
                    {result && !isLoading && (
                        <div className="animate-fade-in space-y-4">
                            <button onClick={() => { setResult(null); setImageData(null); }} className="text-sm text-blue-400 hover:underline">← Analyze another image</button>
                            <ImageRecipeSuggestions {...result} onSelectRecipe={handleSelectRecipe} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FoodRecognitionPage;