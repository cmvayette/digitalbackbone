import { GoogleGenAI } from "@google/genai";
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

/**
 * =========================================================================================
 * ISSUE MANAGER CLI
 * =========================================================================================
 * Unified tool for Spec Decomposition, Auditing, and GitHub Issue Management.
 * Features:
 * - Enriched Prompts (ACs, User Stories)
 * - Quality Gates (Validation)
 * - Smart Upsert (Idempotent Publish)
 * - Interactive Confirmation
 * - Config Loader (.issue-managerrc)
 */

// --- 1. Configuration & Setup ---

const DEFAULT_CONFIG = {
    apiKey: process.env.GEMINI_API_KEY,
    project: null, // GitHub Project Name
    model: "models/gemini-3-pro-preview",
    contextFiles: [
        'docs/developer_onboarding.md',
        'docs/design/principles/principles.md',
        'docs/design/branchingStrategy.md',
        'packages/som-shared-types/src/holon.ts',
        'packages/som-shared-types/src/event.ts'
    ]
};

// Load .env
if (fs.existsSync('.env')) {
    const envConfig = fs.readFileSync('.env', 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !process.env[key.trim()]) {
            process.env[key.trim()] = value.trim();
        }
    });
}

// Load .issue-managerrc
let USER_CONFIG = {};
if (fs.existsSync('.issue-managerrc')) {
    try {
        USER_CONFIG = JSON.parse(fs.readFileSync('.issue-managerrc', 'utf-8'));
    } catch (e) {
        console.warn("⚠️ Failed to parse .issue-managerrc");
    }
}

const CONFIG = { ...DEFAULT_CONFIG, ...USER_CONFIG, apiKey: process.env.GEMINI_API_KEY || USER_CONFIG.apiKey };

// Parse Args
const ARGS = process.argv.slice(2);
const IS_DRY_RUN = ARGS.includes('--dry-run');
const AUTO_APPROVE = ARGS.includes('--auto-approve');
const DECOMPOSE_MODE = ARGS.includes('--decompose');
const AUDIT_MODE = ARGS.includes('--audit');
const PUBLISH_MODE = ARGS.includes('--publish');

// --- 2. Prompts (Enriched) ---

const CONTEXT_INJECTION_PROMPT = `
**ARCHITECTURAL CONTEXT (CRITICAL):**
---
\${contextContent}
---
`;

const ENRICHMENT_INSTRUCTIONS = `
**ENRICHMENT REQUIREMENTS (Quality Gate):**
Every Issue you define MUST include:
1.  **User Story**: A standard "As a [Role], I want [Feature], So that [Benefit]" statement.
2.  **Acceptance Criteria**: A Markdown Checkbox list (min 3 items) defining "Done".
3.  **Technical Hints**: Specific file paths, class names, or interfaces to be modified/created.
`;

const DECOMPOSE_PROMPT_TEMPLATE = (specContent, contextContent) => `
# Agent Prompt: Specification Decomposition (Enriched)

You are an expert Technical Project Manager and Software Architect.
Your goal is to decompose the following Spec into GitHub Issues, **strictly adhering to the Architecture**.

${CONTEXT_INJECTION_PROMPT.replace('\${contextContent}', contextContent)}

**INPUT SPECIFICATION:**
---
${specContent}
---

**INSTRUCTIONS:**
1.  **Analyze** the spec vs architecture (Event Sourcing, Holons).
2.  **Break down** into Epics and Issues.
3.  **Adhere** to Enrichment Requirements below.

${ENRICHMENT_INSTRUCTIONS}

**Format:** Return ONLY a JSON array.
JSON STRUCTURE:
[
  {
    "epic_title": "Title",
    "description": "Desc",
    "issues": [
      {
        "title": "Verb-Noun Title",
        "body": "User Story:\\n...\\n\\nAcceptance Criteria:\\n- [ ] Item 1...\\n\\nTechnical Hints:\\n- \`file.ts\`...",
        "labels": ["backend", "tier-0"] 
      }
    ]
  }
]
`;

const AUDIT_PROMPT_TEMPLATE = (specContent, contextContent, codeContext) => `
# Agent Prompt: Code Auditing & Gap Analysis (Enriched)

You are a Senior Principal Engineer performing a Code Audit.
Compare Spec vs Existing Code. Identify Gaps.

${CONTEXT_INJECTION_PROMPT.replace('\${contextContent}', contextContent)}

**SPECIFICATION:**
---
${specContent}
---

**EXISTING CODE:**
---
${codeContext}
---

**INSTRUCTIONS:**
1.  **Identify Gaps/Refactors**.
2.  **Ignore** fully implemented features.
3.  **Adhere** to Enrichment Requirements (User Stories for Refactors, ACs for Gaps).

${ENRICHMENT_INSTRUCTIONS}

**Format:** Return ONLY a JSON array.
JSON STRUCTURE:
[
  {
    "title": "Title",
    "description": "Desc including User Story and ACs",
    "priority": "High",
    "file_paths": ["path/to/file"]
  }
]
`;

// --- 3. Core Logic ---

function getContextContent(mode = 'decompose') {
    let contextContent = "";

    // 1. Files from Config
    for (const file of CONFIG.contextFiles) {
        if (fs.existsSync(file)) {
            contextContent += `\n\n*** FILE: ${file} ***\n`;
            contextContent += fs.readFileSync(file, 'utf-8');
        }
    }

    // 2. Auto-Discovery for AUDIT mode
    if (mode === 'audit') {
        const discovered = discoverCodebase(process.cwd());
        discovered.forEach(file => {
            contextContent += `\n\n*** ARCHITECTURE SIGNATURE: ${path.relative(process.cwd(), file)} ***\n`;
            contextContent += extractSignatures(file);
        });
    }

    return contextContent;
}

function extractSignatures(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        // Heuristic: Keep lines that look like structural declarations
        // - Imports (context)
        // - Exports (public API)
        // - Class/Interface/Type definitions
        // - Method signatures (lines with '(' and ')' inside a class potentially)
        // - Remove empty lines and comments
        return lines.filter(line => {
            const t = line.trim();
            if (!t || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) return false;
            return (
                t.startsWith('import') ||
                t.startsWith('export') ||
                t.includes('class ') ||
                t.includes('interface ') ||
                t.includes('type ') ||
                t.includes('constructor') ||
                (t.includes('(') && t.includes(')') && !t.includes('=')) // Likely method sig
            );
        }).join('\n');
    } catch (e) {
        return `(Error reading file: ${e.message})`;
    }
}

function discoverCodebase(rootDir) {
    const appsDir = path.join(rootDir, 'apps');
    if (!fs.existsSync(appsDir)) return [];

    // 1. Identify potential target app based on Spec Name (heuristic)
    const specName = process.env.SPEC_FILE ? path.basename(process.env.SPEC_FILE).toLowerCase() : "";
    const appDirs = fs.readdirSync(appsDir).filter(d => {
        return fs.statSync(path.join(appsDir, d)).isDirectory() && !d.startsWith('.');
    });

    // Strategy: If spec name contains an app name, focus on that app.
    // Otherwise, scan all apps but be efficient.
    const targetApp = appDirs.find(app => specName.includes(app.replace(/-/g, ''))); // e.g. 'somtier0' matches 'som-tier0'

    if (!targetApp) {
        console.warn(`⚠️  Target app not found in 'apps/' matching spec '${specName}'.`);
        console.warn("   Assuming GREENFIELD project (no existing code to audit).");
        return [];
    }

    const searchDirs = [path.join(appsDir, targetApp)];
    console.log(`🎯 Focused discovery on app: ${targetApp}`);

    const foundFiles = [];

    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'build' && file !== 'coverage') {
                    walk(filePath);
                }
            } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.d.ts')) {
                // Heuristic: Prefer "core" files (controllers, services, types)
                // Filter out likely irrelevant UI/config clutter if we have too many
                if (foundFiles.length < 15) {
                    foundFiles.push(filePath);
                }
            }
        });
    }

    searchDirs.forEach(d => walk(d));

    console.log(`🔍 Discovered ${foundFiles.length} files for context.`);
    foundFiles.forEach(f => console.log(`  - ${path.relative(rootDir, f)}`));
    return foundFiles;
}

async function callGenAI(prompt) {
    if (!CONFIG.apiKey) {
        console.error("❌ API Key missing. Set GEMINI_API_KEY env or .issue-managerrc");
        process.exit(1);
    }

    console.log("🤖 Asking Gemini...");
    const ai = new GoogleGenAI({ apiKey: CONFIG.apiKey });

    try {
        const result = await ai.models.generateContent({
            model: CONFIG.model,
            contents: [{ parts: [{ text: prompt }] }]
        });

        const response = result.response || result;
        let jsonStr = "";

        if (typeof response.text === 'function') {
            jsonStr = response.text();
        } else if (typeof response.text === 'string') {
            jsonStr = response.text;
        } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            jsonStr = response.candidates[0].content.parts[0].text;
        }

        console.log("DEBUG RAW RESPONSE:", jsonStr ? jsonStr.substring(0, 100).replace(/\n/g, ' ') + "..." : "Empty");

        // Robust JSON extraction
        if (!jsonStr) throw new Error("Empty response from AI");
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find JSON array if surrounded by text
        const firstBracket = jsonStr.indexOf('[');
        const lastBracket = jsonStr.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            jsonStr = jsonStr.substring(firstBracket, lastBracket + 1);
        }

        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("❌ Generator failed:", e);
        process.exit(1);
    }
}

// --- 4. Quality Gate ---

function validatePlan(epics) {
    console.log("🛡️  Running Quality Gate...");
    let passed = true;
    let warnings = [];

    epics.forEach(epic => {
        if (!epic.issues) return;
        epic.issues.forEach(issue => {
            // Check 1: Description Length
            if (!issue.body || issue.body.length < 50) {
                warnings.push(`Issue "${issue.title}": Description too short (<50 chars).`);
                passed = false;
            }
            // Check 2: Acceptance Criteria
            if (!issue.body.toLowerCase().includes('acceptance criteria')) {
                warnings.push(`Issue "${issue.title}": Missing 'Acceptance Criteria'.`);
                passed = false;
            }
        });
    });

    if (warnings.length > 0) {
        console.warn("⚠️  Quality Gate Warnings:");
        warnings.forEach(w => console.warn(`  - ${w}`));
        if (!AUTO_APPROVE) {
            console.warn("  (Proceeding anyway, but consider invalidating)");
        }
    } else {
        console.log("✅ Quality Gate Passed.");
    }
    return passed;
}

// --- 5. Output & Upsert ---

function parseMarkdownPlan(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const epics = [];
    let currentEpic = null;
    let currentIssue = null;
    let buffer = [];

    const flushBuffer = () => {
        const text = buffer.join('\n').trim();
        if (currentIssue) currentIssue.body = text;
        else if (currentEpic) currentEpic.description = text;
        buffer = [];
    };

    for (const line of lines) {
        if (line.startsWith('# Epic: ')) {
            flushBuffer();
            currentEpic = { title: line.replace('# Epic: ', '').trim(), issues: [] };
            epics.push(currentEpic);
            currentIssue = null;
        } else if (line.startsWith('## Issue: ')) {
            flushBuffer();
            currentIssue = { title: line.replace('## Issue: ', '').trim(), labels: [] };
            currentEpic.issues.push(currentIssue);
        } else if (line.trim().startsWith('**Labels**:')) {
            if (currentIssue) currentIssue.labels = line.replace('**Labels**:', '').trim().split(',').map(l => l.trim());
        } else {
            buffer.push(line);
        }
    }
    flushBuffer();
    return epics;
}

function savePlan(planData, suffix) {
    let epics = Array.isArray(planData) ? planData : [];
    // Handle Flat List (Audit)
    if (epics.length > 0 && !epics[0].epic_title && epics[0].title) {
        console.log("ℹ️ Wrapping flat audit list into Epic format.");
        epics = [{
            epic_title: "Audit Findings",
            description: "Generated by Spec Auditor",
            issues: epics.map(e => ({
                title: e.title,
                body: e.description + (e.file_paths ? `\n\n**Related Files:**\n` + e.file_paths.map(f => `- \`${f}\``).join('\n') : ""),
                labels: ["audit-finding", e.priority || "High"]
            }))
        }];
    }

    validatePlan(epics);

    let md = "";
    epics.forEach(epic => {
        md += `# Epic: ${epic.epic_title}\n\n${epic.description || ''}\n\n`;
        if (epic.issues) {
            epic.issues.forEach(issue => {
                const labels = issue.labels ? issue.labels.join(', ') : '';
                md += `## Issue: ${issue.title}\n\n${issue.body}\n\n**Labels**: ${labels}\n\n---\n\n`;
            });
        }
    });

    const issuesDir = './docs/issues';
    if (!fs.existsSync(issuesDir)) fs.mkdirSync(issuesDir, { recursive: true });

    const specPath = process.env.SPEC_FILE || 'generated';
    const specName = path.basename(specPath, path.extname(specPath));
    const outputPath = path.join(issuesDir, `${specName}_${suffix}.md`);

    fs.writeFileSync(outputPath, md);
    console.log(`✅ Plan saved: ${outputPath}`);
    return outputPath;
}

async function confirmAction(message) {
    if (AUTO_APPROVE) {
        console.log(`⏩ Auto-approving: ${message}`);
        return true;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(`❓ ${message} [y/N] `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

async function getExistingIssues() {
    try {
        const output = execSync('gh issue list --limit 1000 --state open --json number,title', { encoding: 'utf-8' });
        const issues = JSON.parse(output);
        const map = new Map();
        issues.forEach(i => map.set(i.title, i.number));
        return map;
    } catch (e) {
        console.warn("⚠️ Could not fetch existing issues.");
        return new Map();
    }
}

async function publish(planPath) {
    console.log(`🚀 Preparing to publish from: ${planPath}`);
    const epics = parseMarkdownPlan(planPath);
    const existing = IS_DRY_RUN ? new Map() : await getExistingIssues();

    let createCount = 0;
    let updateCount = 0;
    const operations = [];

    epics.forEach(epic => {
        if (!epic.issues) return;
        epic.issues.forEach(issue => {
            const exists = existing.has(issue.title);
            if (exists) updateCount++; else createCount++;
            operations.push({
                type: exists ? 'UPDATE' : 'CREATE',
                id: exists ? existing.get(issue.title) : null,
                issue,
                parent: epic.title
            });
        });
    });

    console.log(`\n📊 Plan Summary:`);
    console.log(`   - CREATE: ${createCount}`);
    console.log(`   - UPDATE: ${updateCount}`);

    if (createCount + updateCount === 0) {
        console.log("No issues found to publish.");
        return;
    }

    if (!await confirmAction("Proceed with GitHub operations?")) {
        console.log("❌ Aborted.");
        return;
    }

    for (const op of operations) {
        const { issue, type, id, parent } = op;
        const bodyWithFooter = `${issue.body}\n\n---\n**Parent Epic:** ${parent}\n**Source:** CLI`;

        let cmd = "";
        const safeTitle = issue.title.replace(/"/g, '\\"');
        const safeBody = bodyWithFooter.replace(/"/g, '\\"');
        const labels = issue.labels ? `"${issue.labels.join(',')}"` : "";

        let proj = "";
        const pIndex = ARGS.indexOf('--project');
        if (pIndex !== -1 && ARGS[pIndex + 1]) proj = ` --project "${ARGS[pIndex + 1]}"`;
        else if (CONFIG.project) proj = ` --project "${CONFIG.project}"`;

        if (type === 'UPDATE') {
            console.log(`\nDiff Preview for #${id} (${issue.title}):`);
            console.log(`  [NEW BODY PREVIEW]: ${safeBody.substring(0, 200)}...\n`);

            cmd = `gh issue edit ${id} --title "${safeTitle}" --body "${safeBody}" --add-label ${labels}`;
            console.log(`🔄 Updating #${id}: ${issue.title}`);
        } else {
            cmd = `gh issue create --title "${safeTitle}" --body "${safeBody}" --label ${labels}${proj}`;
            console.log(`✨ Creating: ${issue.title}`);
        }

        if (!IS_DRY_RUN) {
            try { execSync(cmd, { stdio: 'pipe' }); }
            catch (e) { console.error(`   ❌ Failed: ${e.message}`); }
        }
    }
}


// --- 6. Main Runner ---

async function main() {
    const specFile = ARGS.find(a => !a.startsWith('--'));
    if (specFile) process.env.SPEC_FILE = specFile;

    let savedPath = null;

    if (DECOMPOSE_MODE || AUDIT_MODE) {
        if (!specFile || !fs.existsSync(specFile)) {
            console.error("❌ Spec file required for generation.");
            process.exit(1);
        }

        const specContent = fs.readFileSync(specFile, 'utf-8');
        let prompt = "";
        let suffix = "";
        let plan = [];

        if (DECOMPOSE_MODE) {
            console.log("🧩 Mode: DECOMPOSE (Spec -> Issues)");
            const contextContent = getContextContent('decompose');
            prompt = DECOMPOSE_PROMPT_TEMPLATE(specContent, contextContent);
            suffix = "plan";
        } else {
            console.log("🕵️ Mode: AUDIT (Spec vs Code)");
            const contextContent = getContextContent('audit');
            const codeContext = contextContent;

            // Check if we actually found any code to audit (Greenfield Check)
            // If codeContext contains only the base docs (config files), it means extractSignatures found nothing
            // HACK: We check if "ARCHITECTURAL SIGNATURE" is present.
            if (!codeContext.includes("ARCHITECTURAL SIGNATURE")) {
                console.warn("⚠️  No existing code signatures found. Skipping Audit.");
                console.warn("   (Use --decompose to generate an initial Implementation Plan instead).");
                process.exit(0);
            }

            prompt = AUDIT_PROMPT_TEMPLATE(specContent, "", codeContext);
            suffix = "audit_plan";
        }

        const aiData = await callGenAI(prompt);
        plan = aiData;
        savedPath = savePlan(plan, suffix);
    } else if (PUBLISH_MODE && specFile) {
        savedPath = specFile;
    }

    if (PUBLISH_MODE) {
        if (!savedPath) { console.error("❌ Provide plan file to publish."); process.exit(1); }
        await publish(savedPath);
    } else if (!DECOMPOSE_MODE && !AUDIT_MODE) {
        console.log("Usage: node issue-manager.mjs <file> [--decompose|--audit] [--publish] [--auto-approve]");
    }
}

main().catch(console.error);
