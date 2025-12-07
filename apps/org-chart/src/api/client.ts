// Basic fetch wrapper for now, can be replaced with axios later
const API_BASE_URL = '/api/v1';

export async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    return json.data; // Assuming standard APIResponse wrapper
}
