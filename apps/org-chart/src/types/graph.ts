export type GraphNode = {
    label: string;
    subtitle?: string;
    type?: 'organization' | 'position' | 'person';
    isVacant?: boolean;
    properties?: Record<string, any>;
};
