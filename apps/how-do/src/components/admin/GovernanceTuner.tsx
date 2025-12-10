import React, { useState, useEffect } from 'react';
import { useGovernanceConfig } from '../../hooks/useGovernanceConfig';
import { Sliders, Shield, Search, Activity, Save, RefreshCw, Radio } from 'lucide-react';

export const GovernanceTuner: React.FC = () => {
    const { config, updateConfig, isLoading, error } = useGovernanceConfig({ mode: 'mock' });

    // Local state for form handling (to avoid jitter)
    const [localConfig, setLocalConfig] = useState(config?.properties);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync local state when config loads
    useEffect(() => {
        if (config?.properties) {
            setLocalConfig(config.properties);
        }
    }, [config]);

    const handleWeightChange = (domain: 'aggregation' | 'search', key: string, value: number) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            [domain]: {
                ...localConfig[domain],
                weights: {
                    ...localConfig[domain].weights,
                    [key]: value
                }
            }
        } as any);
        setHasChanges(true);
    };

    const handleDriftChange = (key: string, value: any) => {
        if (!localConfig) return;
        setLocalConfig({
            ...localConfig,
            drift: {
                ...localConfig.drift,
                [key]: value
            }
        });
        setHasChanges(true);
    };

    const saveChanges = () => {
        if (localConfig) {
            updateConfig(localConfig);
            setHasChanges(false);
        }
    };

    if (isLoading && !localConfig) return (
        <div className="flex h-full items-center justify-center">
            <div className="text-accent-cyan font-mono animate-pulse tracking-widest text-sm flex items-center gap-2">
                <RefreshCw className="animate-spin" size={14} /> INITIALIZING TUNER PROTOCOLS...
            </div>
        </div>
    );

    if (error) return <div className="p-8 text-center text-accent-critical font-mono">SYSTEM ERROR: {error}</div>;
    if (!localConfig) return null;

    return (
        <div className="governance-tuner h-full overflow-hidden flex flex-col relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-bg-canvas to-bg-canvas">

            {/* Header / HUD Top */}
            <div className="px-8 py-6 border-b border-border-color/50 flex justify-between items-end backdrop-blur-sm bg-bg-canvas/30 sticky top-0 z-10">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-accent-cyan/10 rounded border border-accent-cyan/30">
                            <Sliders className="text-accent-cyan" size={20} />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter font-ui uppercase">
                            Governance<span className="text-accent-cyan">Tuner</span>
                        </h1>
                    </div>
                    <p className="text-xs font-mono text-text-secondary tracking-widest uppercase pl-1">
                        System Heuristics & Sensitivity Configuration
                    </p>
                </div>

                {hasChanges && (
                    <button
                        onClick={saveChanges}
                        className="group relative px-6 py-2 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/50 text-accent-cyan font-bold font-mono text-xs uppercase tracking-wider transition-all overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <Save size={14} /> Commit Changes
                        </span>
                        <div className="absolute inset-0 bg-accent-cyan/10 translate-y-full group-hover:translate-y-0 transition-transform duration-200"></div>
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* 1. AGGREGATION TUNER */}
                    <Section
                        title="Command Readiness"
                        icon={<Activity size={18} />}
                        color="blue"
                        description="Adjust weights for Health Score aggregation."
                    >
                        <RangeControl
                            label="Freshness Bias"
                            subLabel="Impact of recent updates"
                            value={localConfig.aggregation.weights.freshness}
                            min={0} max={1} step={0.1}
                            format={(v) => `${(v * 100).toFixed(0)}%`}
                            onChange={(v) => handleWeightChange('aggregation', 'freshness', v)}
                            color="blue"
                        />
                        <RangeControl
                            label="Completeness Bias"
                            subLabel="Impact of field population"
                            value={localConfig.aggregation.weights.completeness}
                            min={0} max={1} step={0.1}
                            format={(v) => `${(v * 100).toFixed(0)}%`}
                            onChange={(v) => handleWeightChange('aggregation', 'completeness', v)}
                            color="blue"
                        />
                        <RangeControl
                            label="Compliance Bias"
                            subLabel="Impact of policy adherence"
                            value={localConfig.aggregation.weights.compliance}
                            min={0} max={1} step={0.1}
                            format={(v) => `${(v * 100).toFixed(0)}%`}
                            onChange={(v) => handleWeightChange('aggregation', 'compliance', v)}
                            color="blue"
                        />
                    </Section>

                    {/* 2. SEARCH TUNER */}
                    <Section
                        title="Discovery Matrix"
                        icon={<Search size={18} />}
                        color="emerald"
                        description="Fine-tune relevance scoring algorithms."
                    >
                        <RangeControl
                            label="Role Centricity"
                            subLabel="Boost for user's functional role"
                            value={localConfig.search.weights.roleMatch}
                            min={0} max={100} step={10}
                            format={(v) => `${v} pts`}
                            onChange={(v) => handleWeightChange('search', 'roleMatch', v)}
                            color="emerald"
                        />
                        <RangeControl
                            label="Rank Centricity"
                            subLabel="Boost for user's rank match"
                            value={localConfig.search.weights.rankMatch}
                            min={0} max={100} step={10}
                            format={(v) => `${v} pts`}
                            onChange={(v) => handleWeightChange('search', 'rankMatch', v)}
                            color="emerald"
                        />
                        <RangeControl
                            label="Recommendation Threshold"
                            subLabel="Min score for 'Recommended' badge"
                            value={localConfig.search.recommendationMinScore}
                            min={0} max={50} step={5}
                            format={(v) => `${v} pts`}
                            onChange={(v) => {
                                if (!localConfig) return;
                                setLocalConfig({
                                    ...localConfig,
                                    search: { ...localConfig.search, recommendationMinScore: v }
                                });
                                setHasChanges(true);
                            }}
                            color="emerald"
                        />
                    </Section>

                    {/* 3. DRIFT SENSITIVITY */}
                    <Section
                        title="Governance Drift"
                        icon={<Shield size={18} />}
                        color="amber"
                        description="Set sensitivity for validity checks."
                        className="lg:col-span-2"
                    >
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-1 w-full">
                                <RangeControl
                                    label="Staleness Threshold"
                                    subLabel="Days before data is flagged as stale"
                                    value={localConfig.drift.staleDays}
                                    min={30} max={365} step={15}
                                    format={(v) => `${v} Days`}
                                    onChange={(v) => handleDriftChange('staleDays', v)}
                                    color="amber"
                                />
                            </div>

                            <div className="bg-bg-canvas/50 border border-amber-900/30 p-4 rounded-sm flex items-center gap-4 min-w-[300px]">
                                <div className="space-y-1 flex-1">
                                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                        <Radio size={14} className={localConfig.drift.inspectionMode ? "text-amber-500 animate-pulse" : "text-slate-600"} />
                                        INSPECTION MODE
                                    </h4>
                                    <p className="text-[10px] text-slate-500 leading-tight">
                                        Enforce strict validation. Missing obligations on high-crit items will be flagged immediately.
                                    </p>
                                </div>
                                <Toggle
                                    checked={localConfig.drift.inspectionMode}
                                    onChange={(c) => handleDriftChange('inspectionMode', c)}
                                    color="amber"
                                />
                            </div>
                        </div>
                    </Section>

                </div>
            </div>

            {/* Background Decorations */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent"></div>
            <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-accent-cyan/10 to-transparent"></div>
        </div>
    );
};

// --- Subcomponents for Clean Layout ---

const Section: React.FC<{ title: string; icon: React.ReactNode; color: string; description: string; children: React.ReactNode; className?: string }> = ({ title, icon, color, description, children, className }) => {
    const colorMap: Record<string, string> = {
        'blue': 'text-blue-400 border-blue-500/20 bg-blue-500/5',
        'emerald': 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
        'amber': 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    };

    return (
        <div className={`relative border border-border-color bg-bg-panel/50 backdrop-blur-md rounded-sm overflow-hidden ${className}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-border-color to-transparent opacity-20"></div>

            <div className="p-6 border-b border-white/5 flex justify-between items-start">
                <div>
                    <h2 className={`text-lg font-bold flex items-center gap-2 ${colorMap[color].split(' ')[0]}`}>
                        {icon} {title}
                    </h2>
                    <p className="text-xs text-text-secondary mt-1">{description}</p>
                </div>
                <div className="flex gap-1">
                    <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                    <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                    <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {children}
            </div>
        </div>
    );
};

const RangeControl: React.FC<{
    label: string;
    subLabel: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
    onChange: (v: number) => void;
    color: string;
}> = ({ label, subLabel, value, min, max, step, format, onChange, color }) => {
    const accentColors: Record<string, string> = {
        'blue': 'accent-blue-500 text-blue-400',
        'emerald': 'accent-emerald-500 text-emerald-400',
        'amber': 'accent-amber-500 text-amber-400',
    };

    return (
        <div className="space-y-3 group">
            <div className="flex justify-between items-end">
                <div>
                    <label className="text-sm font-bold text-slate-300 block">{label}</label>
                    <span className="text-[10px] text-slate-500 font-mono hidden md:block">{subLabel}</span>
                </div>
                <div className={`font-mono text-sm font-bold ${accentColors[color].split(' ')[1]} bg-black/20 px-2 py-0.5 rounded border border-white/5`}>
                    {format(value)}
                </div>
            </div>

            <div className="relative h-6 flex items-center">
                {/* Custom Track Background */}
                <div className="absolute w-full h-1.5 bg-bg-canvas rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full opacity-50 ${color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${((value - min) / (max - min)) * 100}%` }}></div>
                </div>

                <input
                    type="range" min={min} max={max} step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className={`relative w-full z-10 opacity-0 cursor-pointer h-full`}
                />

                {/* Custom Thumb (Simulated via position) */}
                <div
                    className={`absolute h-4 w-4 bg-white rounded-sm shadow border border-slate-300 pointer-events-none transition-all group-hover:scale-110`}
                    style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 8px)` }}
                ></div>
            </div>
        </div>
    );
};

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; color: string }> = ({ checked, onChange, color }) => {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className={`w-11 h-6 bg-bg-surface border border-slate-600 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${checked ? (color === 'amber' ? 'peer-checked:bg-amber-900 peer-checked:border-amber-500 peer-checked:after:bg-amber-400' : 'peer-checked:bg-blue-900') : ''}`}></div>
        </label>
    );
};
