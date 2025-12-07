
import * as path from 'path';
import * as fs from 'fs';
import * as TJS from 'typescript-json-schema';

const settings: TJS.PartialArgs = {
    required: true,
    noExtraProps: true,
    ref: false, // Don't use $ref, inline everything for independent schemas
};

const compilerOptions: TJS.CompilerOptions = {
    strictNullChecks: true,
    esModuleInterop: true,
};

const basePath = path.resolve(__dirname, '../../..'); // Root of monorepo
const packagesDir = path.join(basePath, 'packages');
const outputDir = path.resolve(__dirname, '../schemas/v1');

// Files to scan for types
const files = [
    path.join(packagesDir, 'som-shared-types/src/holon.ts'),
    path.join(packagesDir, 'som-shared-types/src/relationship.ts'),
    path.join(packagesDir, 'som-shared-types/src/event.ts')
];

// Symbols to generate schemas for
const symbols = [
    'Person',
    'Position',
    'Organization',
    'Mission',
    'SystemHolon',
    'Asset',
    'DocumentHolon',
    'ConstraintHolon'
];

async function generate() {
    console.log('Generating JSON Schemas...');
    console.log(`Scanning files: ${files.join('\n')}`);

    const program = TJS.getProgramFromFiles(files, compilerOptions, basePath);
    const generator = TJS.buildGenerator(program, settings);

    if (!generator) {
        console.error('Failed to create schema generator');
        process.exit(1);
    }

    for (const symbol of symbols) {
        const schema = generator.getSchemaForSymbol(symbol);
        if (!schema) {
            console.warn(`Could not find schema for symbol: ${symbol}`);
            continue;
        }

        // Add explicit $id
        schema.$id = `http://som.tier0/schemas/v1/${symbol.toLowerCase()}.schema.json`;

        const fileName = `${symbol.toLowerCase()}.schema.json`;
        const outputPath = path.join(outputDir, fileName);

        fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2));
        console.log(`Generated ${fileName}`);
    }
}

generate().catch(err => {
    console.error(err);
    process.exit(1);
});
