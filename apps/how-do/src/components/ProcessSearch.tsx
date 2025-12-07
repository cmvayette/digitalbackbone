import React, { useState } from 'react';
import { mockProcesses } from '../mocks/mock-processes';
import type { Process } from '@som/shared-types';

interface ProcessSearchProps {
    onSelectProcess: (process: Process) => void;
}

export const ProcessSearch: React.FC<ProcessSearchProps> = ({ onSelectProcess }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProcesses = mockProcesses.filter(p =>
        p.properties.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.properties.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="process-search">
            <h1>How Do I...</h1>
            <input
                type="text"
                placeholder="Search for a process..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
                autoFocus
            />

            <div className="results-list">
                {filteredProcesses.length === 0 && <p>No processes found.</p>}
                {filteredProcesses.map(process => (
                    <div key={process.id} className="process-card" onClick={() => onSelectProcess(process)}>
                        <h3>{process.properties.name}</h3>
                        <p>{process.properties.description}</p>
                        <span className="status-badge">{process.status}</span>
                        <span className="step-count">{process.properties.steps.length} Steps</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
