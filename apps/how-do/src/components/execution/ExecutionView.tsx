import React, { useState } from 'react';
import { Process } from '../../types/process';
import { CheckCircle, Circle, ArrowRight, Play, Check } from 'lucide-react';

interface ExecutionViewProps {
    process: Process;
    onClose: () => void;
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({ process, onClose }) => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const steps = process.properties.steps;
    const currentStep = steps[currentStepIndex];
    const isComplete = currentStepIndex >= steps.length;

    const handleNext = () => {
        if (currentStepIndex < steps.length) {
            setCurrentStepIndex(prev => prev + 1);
        }
    };

    if (isComplete) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-slate-900 text-slate-100">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={48} className="text-green-500" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Process Complete!</h2>
                <p className="text-slate-400 mb-8 max-w-md">
                    You have successfully completed all steps in <strong>{process.properties.name}</strong>.
                </p>
                <button
                    onClick={onClose}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-slate-900 text-slate-100">
            {/* Sidebar Progress */}
            <div className="w-72 border-r border-slate-700 bg-slate-800/50 p-6 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-6 tracking-wider">Progress</h3>
                <div className="space-y-4">
                    {steps.map((step, idx) => {
                        const isPast = idx < currentStepIndex;
                        const isCurrent = idx === currentStepIndex;

                        return (
                            <div key={step.id} className={`flex gap-3 ${isCurrent ? 'opacity-100' : 'opacity-50'}`}>
                                <div className="mt-0.5 shrink-0">
                                    {isPast ? (
                                        <CheckCircle size={18} className="text-green-500" />
                                    ) : isCurrent ? (
                                        <div className="w-4.5 h-4.5 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        </div>
                                    ) : (
                                        <Circle size={18} className="text-slate-600" />
                                    )}
                                </div>
                                <div>
                                    <div className={`text-sm font-medium ${isCurrent ? 'text-blue-400' : 'text-slate-300'}`}>
                                        {step.title}
                                    </div>
                                    {isCurrent && <div className="text-xs text-slate-400 mt-1">Current Step</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 p-12 flex flex-col justify-center max-w-3xl mx-auto w-full">
                    <div className="mb-8">
                        <span className="text-blue-400 text-sm font-mono mb-2 block">STEP {currentStepIndex + 1} OF {steps.length}</span>
                        <h1 className="text-4xl font-bold mb-4 leading-tight">{currentStep.title}</h1>
                        <p className="text-xl text-slate-400 leading-relaxed">{currentStep.description}</p>
                    </div>

                    {/* Meta / Owner */}
                    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 mb-8">
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex flex-col">
                                <span className="text-slate-500 text-xs uppercase font-bold">Owner</span>
                                <span className="text-slate-200 font-mono bg-slate-700 px-2 py-0.5 rounded mt-1 inline-block w-fit">
                                    {currentStep.owner || 'Unassigned'}
                                </span>
                            </div>
                            {currentStep.obligations && currentStep.obligations.length > 0 && (
                                <div className="flex flex-col border-l border-slate-700 pl-4">
                                    <span className="text-slate-500 text-xs uppercase font-bold">Obligations</span>
                                    <span className="text-slate-300 mt-1">{currentStep.obligations.length} linked</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleNext}
                            className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
                        >
                            Complete Step
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
