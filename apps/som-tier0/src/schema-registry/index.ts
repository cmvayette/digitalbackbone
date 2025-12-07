
import * as fs from 'fs/promises';
import * as path from 'path';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { HolonType } from '@som/shared-types';

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}

export class SchemaRegistry {
    private ajv: Ajv;
    private validators: Map<string, ValidateFunction> = new Map();
    private schemasLoaded: boolean = false;
    private schemaDir: string;

    constructor(schemaDir?: string) {
        this.ajv = new Ajv({
            allErrors: true,
            strict: false // Allow unknown keywords if necessary
        });
        addFormats(this.ajv);

        // Default to relative path if not provided
        this.schemaDir = schemaDir || path.resolve(__dirname, '../../schemas/v1');
    }

    /**
     * Initialize the registry by loading all schemas from the directory
     */
    async initialize(): Promise<void> {
        if (this.schemasLoaded) return;

        try {
            const files = await fs.readdir(this.schemaDir);

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.schemaDir, file);
                    const content = await fs.readFile(filePath, 'utf-8');
                    const schema = JSON.parse(content);

                    // Add to Ajv
                    // We assume the schema has an $id, if not we use the filename
                    const schemaId = schema.$id || file;
                    this.ajv.addSchema(schema, schemaId);

                    // Map HolonType to validator if possible
                    // The generator creates files like 'person.schema.json'
                    // We can try to infer the type from the filename or schema content
                    this.registerValidatorForType(file, schemaId);

                    console.log(`Loaded schema: ${schemaId}`);
                }
            }

            this.schemasLoaded = true;
        } catch (error) {
            console.error('Failed to initialize SchemaRegistry:', error);
            throw error;
        }
    }

    private registerValidatorForType(filename: string, schemaId: string) {
        // Mapping convention: person.schema.json -> HolonType.Person
        const typeName = filename.replace('.schema.json', '');

        // Find matching HolonType enum key (case-insensitive)
        const holonTypes = Object.values(HolonType);
        const matchedType = holonTypes.find(t => t.toLowerCase() === typeName.toLowerCase());

        if (matchedType) {
            const validator = this.ajv.getSchema(schemaId);
            if (validator) {
                this.validators.set(matchedType, validator);
            }
        }
    }

    /**
     * Validate data against a specific holon type schema
     */
    validate(type: HolonType, data: any): ValidationResult {
        if (!this.schemasLoaded) {
            throw new Error('SchemaRegistry not initialized. Call initialize() first.');
        }

        const validator = this.validators.get(type);

        if (!validator) {
            // If no schema exists for this type, we currently allow it (warn only)
            // or strictly fail. For Tier-0 upgrade, we might want to warn.
            console.warn(`No schema found for type: ${type}`);
            return { valid: true };
        }

        const valid = validator(data);

        if (!valid) {
            return {
                valid: false,
                errors: validator.errors?.map(e => `${e.instancePath} ${e.message}`)
            };
        }

        return { valid: true };
    }

    /**
     * Get all loaded types
     */
    getLoadedTypes(): string[] {
        return Array.from(this.validators.keys());
    }

    getSchema(type: HolonType): any {
        const validator = this.validators.get(type);
        return validator ? validator.schema : null;
    }
}


export const schemaRegistry = new SchemaRegistry();
