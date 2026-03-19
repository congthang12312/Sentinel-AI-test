#!/usr/bin/env node

/**
 * validate-docs.cjs
 * Validates documentation files for accuracy and broken links.
 *
 * Usage: node .agent/scripts/validate-docs.cjs [docs-dir]
 * Default: docs/
 *
 * Checks:
 * - Broken internal markdown links
 * - Missing referenced files
 * - Oversized files (>800 LOC)
 * - Missing frontmatter in plan files
 * - Code references to non-existent files
 */

const fs = require('fs');
const path = require('path');

const docsDir = process.argv[2] || 'docs';
const projectRoot = path.resolve(__dirname, '..', '..');
const fullDocsDir = path.resolve(projectRoot, docsDir);

let warnings = 0;
let errors = 0;
let filesChecked = 0;

// ANSI colors
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

function warn(file, msg) {
    console.log(`${YELLOW}⚠  WARNING${RESET} [${path.relative(projectRoot, file)}]: ${msg}`);
    warnings++;
}

function error(file, msg) {
    console.log(`${RED}✖  ERROR${RESET} [${path.relative(projectRoot, file)}]: ${msg}`);
    errors++;
}

function checkFile(filePath) {
    filesChecked++;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relPath = path.relative(projectRoot, filePath);

    // Check file size (>800 LOC)
    if (lines.length > 800) {
        warn(filePath, `File has ${lines.length} lines (max recommended: 800). Consider splitting.`);
    }

    // Strip fenced code blocks to avoid false positives on example links
    const contentNoCodeBlocks = content.replace(/```[\s\S]*?```/g, '');

    // Check for broken internal links
    const linkRegex = /\[([^\]]*)\]\(\.\/([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(contentNoCodeBlocks)) !== null) {
        const linkTarget = match[2].split('#')[0]; // Remove anchors
        if (linkTarget) {
            const targetPath = path.resolve(path.dirname(filePath), linkTarget);
            if (!fs.existsSync(targetPath)) {
                error(filePath, `Broken link: [${match[1]}](./${match[2]}) → file not found`);
            }
        }
    }

    // Check for empty headers
    const headerRegex = /^(#{1,6})\s*$/gm;
    let headerMatch;
    let lineNum = 0;
    for (const line of lines) {
        lineNum++;
        if (/^#{1,6}\s*$/.test(line)) {
            warn(filePath, `Empty header at line ${lineNum}`);
        }
    }

    // Check plan files for YAML frontmatter
    if (path.basename(filePath) === 'plan.md') {
        if (!content.startsWith('---')) {
            error(filePath, 'Plan file missing YAML frontmatter');
        } else {
            const frontmatterEnd = content.indexOf('---', 3);
            if (frontmatterEnd === -1) {
                error(filePath, 'Plan file has unclosed YAML frontmatter');
            } else {
                const frontmatter = content.substring(3, frontmatterEnd);
                const requiredFields = ['title', 'status', 'priority'];
                for (const field of requiredFields) {
                    if (!frontmatter.includes(`${field}:`)) {
                        warn(filePath, `Plan file missing "${field}" in frontmatter`);
                    }
                }
            }
        }
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) {
        console.log(`${RED}Error: Directory not found: ${dir}${RESET}`);
        process.exit(1);
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
                walkDir(fullPath);
            }
        } else if (entry.name.endsWith('.md')) {
            checkFile(fullPath);
        }
    }
}

// Run validation
console.log(`\n📄 Validating docs in: ${docsDir}/\n`);
walkDir(fullDocsDir);

// Summary
console.log(`\n${'─'.repeat(50)}`);
console.log(`   Files checked: ${filesChecked}`);
console.log(`   ${GREEN}Warnings: ${warnings}${RESET}`);
console.log(`   ${errors > 0 ? RED : GREEN}Errors: ${errors}${RESET}`);
console.log(`${'─'.repeat(50)}\n`);

if (errors > 0) {
    console.log(`${RED}❌ Validation failed with ${errors} error(s)${RESET}`);
    process.exit(1);
} else if (warnings > 0) {
    console.log(`${YELLOW}⚠  Validation passed with ${warnings} warning(s)${RESET}`);
} else {
    console.log(`${GREEN}✅ All documentation validated successfully${RESET}`);
}
