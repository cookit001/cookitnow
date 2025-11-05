import React, { useState, useEffect } from 'react';
import type { ConversionResult, Language } from '../types';
import { convertUnits } from '../services/geminiService';

interface UnitConverterModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMeasurement: string;
    language: Language;
}

const COMMON_UNITS = {
    volume: ['cups', 'tbsp', 'tsp', 'mL', 'L', 'fl oz'],
    weight: ['g', 'kg', 'oz', 'lb'],
    temperature: ['°C', '°F']
};

const UnitConverterModal: React.FC<UnitConverterModalProps> = ({ isOpen, onClose, initialMeasurement, language }) => {
    const [targetUnit, setTargetUnit] = useState('');
    const [result, setResult] = useState<ConversionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if(isOpen) {
            setTargetUnit('');
            setResult(null);
            setError(null);
            setIsLoading(false);
        }
    }, [isOpen, initialMeasurement]);

    if (!isOpen) return null;

    const handleConvert = async () => {
        if (!targetUnit) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const conversionResult = await convertUnits(initialMeasurement, targetUnit, language);
            setResult(conversionResult);
        } catch (err) {
            setError('Could not perform conversion. The units might be incompatible.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderUnitButtons = (units: string[]) => (
        <div className="flex flex-wrap gap-2">
            {units.map(unit => (
                <button 
                    key={unit} 
                    onClick={() => setTargetUnit(unit)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${targetUnit === unit ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                >
                    {unit}
                </button>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-900 text-gray-200 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Unit Converter</h2>
                    <button onClick={onClose} className="text-2xl font-light text-gray-400 hover:text-white">&times;</button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label className="text-sm text-gray-400">From</label>
                        <p className="text-lg font-semibold p-3 bg-gray-800 rounded-lg">{initialMeasurement}</p>
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">To</label>
                        <div className="space-y-3">
                            {renderUnitButtons(COMMON_UNITS.volume)}
                            {renderUnitButtons(COMMON_UNITS.weight)}
                             {renderUnitButtons(COMMON_UNITS.temperature)}
                        </div>
                    </div>

                    <button onClick={handleConvert} disabled={isLoading || !targetUnit} className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition disabled:bg-gray-600">
                        {isLoading ? 'Converting...' : 'Convert'}
                    </button>

                    {error && <p className="text-center text-red-400 text-sm mt-2">{error}</p>}

                    {result && (
                        <div className="mt-4 p-4 bg-gray-800 border border-green-700 rounded-lg text-center">
                            <p className="text-gray-400">Result</p>
                            <p className="text-2xl font-bold text-green-400">
                                {result.quantity.toLocaleString()} {result.unit}
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default React.memo(UnitConverterModal);