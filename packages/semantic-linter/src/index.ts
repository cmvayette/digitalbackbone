// Export Runtime Validator
export * from './runtime/validator';
export * from './runtime/rules/process-rules';

import { Command } from 'commander';
import chalk from 'chalk';
import { Project } from 'ts-morph';
import * as path from 'path';

const program = new Command();

program
    .name('som-lint')
    .description('Semantic Operating Model Linter')
    .version('0.1.0');

program
    .command('audit')
    .description('Audit the codebase for semantic consistency')
    .option('-p, --project <path>', 'Path to tsconfig.json', './tsconfig.json')
    .action(async (options) => {
        console.log(chalk.blue('Starting Semantic Audit...'));

        try {
            const { Analyzer } = await import('./analyzer');
            const { checkHolonCompleteness } = await import('./rules/holon-rules');

            const projectPath = path.resolve(process.cwd(), options.project);

            const analyzer = new Analyzer(projectPath);
            console.log(chalk.gray('Loading source files...'));
            analyzer.loadFiles();

            console.log(chalk.gray('Running: Holon Completeness Check'));
            const holonResult = checkHolonCompleteness(analyzer);

            if (!holonResult.passed) {
                console.log(chalk.red('FAIL: Holon Completeness'));
                holonResult.violations.forEach(v => console.log(chalk.red(`  - ${v}`)));
                process.exitCode = 1;
            } else {
                console.log(chalk.green('PASS: Holon Completeness'));
            }

            // Check Relationships
            const { checkRelationshipCompleteness } = await import('./rules/relationship-rules');
            console.log(chalk.gray('Running: Relationship Completeness Check'));
            const relResult = checkRelationshipCompleteness(analyzer);

            if (!relResult.passed) {
                console.log(chalk.red('FAIL: Relationship Completeness'));
                relResult.violations.forEach(v => console.log(chalk.red(`  - ${v}`)));
                process.exitCode = 1;
            } else {
                console.log(chalk.green('PASS: Relationship Completeness'));
            }

            // Check Events
            const { checkEventCompleteness } = await import('./rules/event-rules');
            console.log(chalk.gray('Running: Event Completeness Check'));
            const eventResult = checkEventCompleteness(analyzer);

            if (!eventResult.passed) {
                console.log(chalk.red('FAIL: Event Completeness'));
                eventResult.violations.forEach(v => console.log(chalk.red(`  - ${v}`)));
                process.exitCode = 1;
            } else {
                console.log(chalk.green('PASS: Event Completeness'));
            }

            if (process.exitCode === 1) {
                console.log(chalk.red('\nAudit Failed. Please fix violations.'));
                process.exit(1);
            } else {
                console.log(chalk.blue('\nAudit Completed Successfully.'));
            }

        } catch (error) {
            console.error(chalk.red('Audit failed:'), error);
            process.exit(1);
        }
    });

program.parse();
