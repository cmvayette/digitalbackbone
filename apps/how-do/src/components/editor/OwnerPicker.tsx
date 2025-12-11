import React from 'react';
import { OwnerPicker as SharedOwnerPicker } from '@som/ui-components';

interface OwnerPickerProps {
    value: string;
    onChange: (ownerId: string) => void;
    onClose: () => void;
}

export const OwnerPicker: React.FC<OwnerPickerProps> = ({ value, onChange, onClose }) => {
    // Adapter to match expected signature
    const handleChange = (id: string) => {
        onChange(id);
    };

    return (
        <SharedOwnerPicker
            value={value}
            onChange={handleChange}
            onClose={onClose}
            className="absolute top-full left-0 mt-1"
        />
    );
};

