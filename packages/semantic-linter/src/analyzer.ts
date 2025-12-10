import { Project, SourceFile, InterfaceDeclaration, EnumDeclaration } from 'ts-morph';
import * as path from 'path';

/**
 * Analyzing the SOM Type Definitions
 */
export class Analyzer {
    private project: Project;
    public sharedTypesFile: SourceFile | undefined;

    constructor(tsConfigPath: string) {
        this.project = new Project({
            tsConfigFilePath: tsConfigPath,
        });
    }

    /**
     * Load the key files for analysis
     */
    public loadFiles() {
        // We assume we are running from packages/semantic-linter OR root.
        // Let's try to resolve the root.
        // If we are in packages/semantic-linter, root is ../../

        let rootDir = process.cwd();
        if (rootDir.endsWith('semantic-linter')) {
            rootDir = path.resolve(rootDir, '../../');
        }

        console.log(`Resolved Monorepo Root: ${rootDir}`);

        const sharedTypesGlob = path.join(rootDir, 'packages/som-shared-types/src/**/*.ts');
        const tier0Glob = path.join(rootDir, 'apps/som-tier0/src/**/*.ts');

        console.log(`Loading files from: ${sharedTypesGlob}`);

        this.project.addSourceFilesAtPaths([sharedTypesGlob, tier0Glob]);

        // Find the specific file defining HolonType/RelationshipType
        this.sharedTypesFile = this.project.getSourceFiles().find(f => {
            return f.getEnum('HolonType') !== undefined;
        });

        if (!this.sharedTypesFile) {
            // Fallback: search specifically for holon.ts
            this.sharedTypesFile = this.project.getSourceFiles().find(f => f.getFilePath().endsWith('holon.ts'));
        }
    }

    public getHolonTypeEnum(): EnumDeclaration | undefined {
        // It might be in holon.ts, so we search all files if not found in the main one
        if (this.sharedTypesFile?.getEnum('HolonType')) {
            return this.sharedTypesFile.getEnum('HolonType');
        }

        for (const file of this.project.getSourceFiles()) {
            const e = file.getEnum('HolonType');
            if (e) return e;
        }
        return undefined;
    }

    public getInterface(name: string): InterfaceDeclaration | undefined {
        for (const file of this.project.getSourceFiles()) {
            const i = file.getInterface(name);
            if (i) return i;
        }
        return undefined;
    }

    public getTypeAlias(name: string): any | undefined {
        // returning any as TypeAliasDeclaration needs import from ts-morph
        for (const file of this.project.getSourceFiles()) {
            const t = file.getTypeAlias(name);
            if (t) return t;
        }
        return undefined;
    }
}
