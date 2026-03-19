#!/usr/bin/env node

/**
 * set-active-plan.cjs
 * Sets the active plan context for the current session.
 * Used by planner and other agents to share plan context.
 *
 * Usage: node .agent/scripts/set-active-plan.cjs <plan-dir>
 * Example: node .agent/scripts/set-active-plan.cjs plans/260214-GH-42-auth-feature
 */

const fs = require('fs');
const path = require('path');

const planDir = process.argv[2];

if (!planDir) {
    console.error('Usage: node set-active-plan.cjs <plan-dir>');
    console.error('Example: node set-active-plan.cjs plans/260214-GH-42-auth-feature');
    process.exit(1);
}

// Resolve paths
const projectRoot = path.resolve(__dirname, '..', '..');
const fullPlanDir = path.resolve(projectRoot, planDir);
const sessionFile = path.join(projectRoot, '.agent', '.session-state.json');

// Validate plan directory exists
if (!fs.existsSync(fullPlanDir)) {
    console.warn(`Warning: Plan directory does not exist yet: ${fullPlanDir}`);
    console.warn('Creating directory...');
    fs.mkdirSync(fullPlanDir, { recursive: true });
}

// Read existing session state or create new
let sessionState = {};
if (fs.existsSync(sessionFile)) {
    try {
        sessionState = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    } catch (e) {
        sessionState = {};
    }
}

// Update session state
sessionState.activePlan = planDir;
sessionState.reportsDir = path.join(planDir, 'reports');
sessionState.updatedAt = new Date().toISOString();

// Ensure reports directory exists
const reportsDir = path.resolve(projectRoot, sessionState.reportsDir);
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

// Write session state
fs.writeFileSync(sessionFile, JSON.stringify(sessionState, null, 2));

console.log(`✅ Active plan set to: ${planDir}`);
console.log(`   Reports dir: ${sessionState.reportsDir}`);
console.log(`   Session file: ${sessionFile}`);
