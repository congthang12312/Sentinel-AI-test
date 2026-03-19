#!/usr/bin/env node

/**
 * scan-skills.cjs
 * Scans .agent/skills/ directory and outputs a summary of all available skills.
 *
 * Usage: node .agent/scripts/scan-skills.cjs [--json] [--compact]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const compact = args.includes('--compact');

const projectRoot = path.resolve(__dirname, '..', '..');
const skillsDir = path.join(projectRoot, '.agent', 'skills');

if (!fs.existsSync(skillsDir)) {
    console.error('Skills directory not found:', skillsDir);
    process.exit(1);
}

const skills = [];

const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = path.join(skillsDir, entry.name);
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillFile)) continue;

    const content = fs.readFileSync(skillFile, 'utf8');

    // Parse YAML frontmatter
    let name = entry.name;
    let description = '';

    if (content.startsWith('---')) {
        const endIndex = content.indexOf('---', 3);
        if (endIndex !== -1) {
            const frontmatter = content.substring(3, endIndex);
            const nameMatch = frontmatter.match(/name:\s*(.+)/);
            const descMatch = frontmatter.match(/description:\s*(.+)/);
            if (nameMatch) name = nameMatch[1].trim();
            if (descMatch) description = descMatch[1].trim();
        }
    }

    // Count files in skill directory
    let fileCount = 0;
    function countFiles(dir) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
            if (item.isFile()) fileCount++;
            else if (item.isDirectory()) countFiles(path.join(dir, item.name));
        }
    }
    countFiles(skillDir);

    skills.push({ name, description, dir: entry.name, fileCount });
}

// Sort alphabetically
skills.sort((a, b) => a.name.localeCompare(b.name));

if (jsonOutput) {
    console.log(JSON.stringify(skills, null, 2));
} else if (compact) {
    for (const s of skills) {
        console.log(`${s.dir}: ${s.description || s.name}`);
    }
} else {
    console.log(`\n🧠 Antigravity Skills (${skills.length} total)\n`);
    console.log('─'.repeat(70));

    for (const s of skills) {
        console.log(`  📦 ${s.dir.padEnd(30)} ${s.fileCount} files`);
        if (s.description) {
            console.log(`     ${s.description.substring(0, 65)}${s.description.length > 65 ? '...' : ''}`);
        }
    }

    console.log('─'.repeat(70));
    console.log(`  Total: ${skills.length} skills\n`);
}
