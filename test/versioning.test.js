'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pkg = require('../package.json');
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
const skill = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-track', 'SKILL.md'), 'utf8');
const contract = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-track', 'references', 'recording-contract.md'), 'utf8');
const planSkill = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-plan', 'SKILL.md'), 'utf8');

assert.match(pkg.productVersion || '', /^0\.\d+(?:\.\d+)?$/, 'productVersion must be an explicit 0.x development version');
assert(changelog.includes(`Product ${pkg.productVersion}`), 'CHANGELOG must contain the current product version');
assert(skill.includes(`version: v${pkg.productVersion}`), 'agent skill contract must follow productVersion');
assert(planSkill.includes(`version: v${pkg.productVersion}`), 'plan skill contract must follow productVersion');
assert(contract.includes(`Product contract version: ${pkg.productVersion}`), 'recording contract must follow productVersion');

console.log(`VERSIONING OK: product ${pkg.productVersion}, npm ${pkg.version}`);
