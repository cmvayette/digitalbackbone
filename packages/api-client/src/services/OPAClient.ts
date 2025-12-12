export interface OPAInput {
    user: {
        id: string;
        properties: {
            clearance: string;
            role?: string;
        };
    };
    resource: {
        id: string;
        type: string;
        properties: {
            classification?: string;
            [key: string]: unknown;
        };
    };
    action: 'read' | 'edit' | 'create' | 'delete';
}

export interface OPAContext {
    opaUrl: string;
}

export class OPAClient {
    private url: string;

    constructor(opaUrl: string = 'http://localhost:8181') {
        this.url = opaUrl;
    }

    async checkAccess(input: OPAInput): Promise<boolean> {
        try {
            const response = await fetch(`${this.url}/v1/data/app/authz/allow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
            });
            const data = await response.json();
            // OPA standard response: { result: true/false }
            return data.result === true;
        } catch (error) {
            console.error('OPA check failed', error);
            // Fail closed
            return false;
        }
    }
}
