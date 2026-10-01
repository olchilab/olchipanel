'use strict';
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'skills', 'olchipanel-track');
const BEGIN = '<!-- olchipanel:project-start:v1 -->';
const END = '<!-- /olchipanel:project-start:v1 -->';

function safePath(root, relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) throw new Error('Setup path escaped project');
  let cursor = root;
  for (const part of relative.split(/[\\/]/)) {
    cursor = path.join(cursor, part);
    try {
      if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`Setup refuses linked path: ${cursor}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return target;
}

function sourceFiles(dir = SOURCE, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Linked skill source: ${relative}`);
    if (entry.isDirectory()) return sourceFiles(path.join(dir, entry.name), relative);
    return [{ relative, bytes: fs.readFileSync(path.join(dir, entry.name)) }];
  });
}

function instructionBlock(skillPath) {
  return `${BEGIN}\n## OlchiPanel 사용\n\n` +
    `- 현재 세션에서 사용자가 OlchiPanel 시작·연결·사용·추적을 명시적으로 요청했을 때만 활성화한다. 프로젝트 진입이나 MCP 초기 연결만으로 패널을 만들지 않는다.\n` +
    `- 시작할 때 프로젝트 지침과 작업 범위를 먼저 확인하고, 지침·상세 스킬 등록을 진행한다고 알린 뒤 MCP \`start_project\`를 호출한다. 충돌은 덮어쓰지 않고 보고한다.\n` +
    `- 상세 사용법: [olchipanel-track](${skillPath}/SKILL.md). 스킬을 읽고 목표·진행·결정·막힌 점·결과를 실제 상태 변화가 있을 때 갱신한다.\n` +
    `- 이전 작업은 인수 대상을 확인한 뒤 이어받는다. 다음 작업이 불명확하면 사용자에게 확인한다. 대화 전문·무변경 상태를 반복 기록하지 않는다.\n` +
    `- 등록된 지침은 미래 세션의 자동 연결 승인이 아니다. 전역 설정·자동 시작 훅·다른 프로젝트는 수정하지 않는다.\n${END}\n`;
}

function setupProject(project = process.cwd(), { dryRun = false } = {}) {
  const requested = path.resolve(project);
  const root = fs.realpathSync(requested);
  if (root === path.parse(root).root) throw new Error('A filesystem root is not a project');
  if (!fs.statSync(root).isDirectory()) throw new Error('Project must be a directory');
  if (!['.git', 'AGENTS.md', 'CLAUDE.md', 'package.json'].some(name => fs.existsSync(path.join(root, name)))) {
    throw new Error('Project identity missing: choose a directory with .git, AGENTS.md, CLAUDE.md, or package.json');
  }
  const buildPlan = () => {
    const plan = [];
    for (const vendor of ['.agents', '.claude']) {
      for (const source of sourceFiles()) {
        const relative = path.join(vendor, 'skills', 'olchipanel-track', source.relative);
        const target = safePath(root, relative);
        const exists = fs.existsSync(target);
        if (exists && !fs.readFileSync(target).equals(source.bytes)) throw new Error(`Existing skill differs; preserved: ${target}`);
        plan.push({ relative, target, action: exists ? 'unchanged' : 'create', bytes: source.bytes });
      }
    }
    for (const [relative, vendor] of [['AGENTS.md', '.agents'], ['CLAUDE.md', '.claude']]) {
      const target = safePath(root, relative);
      const before = fs.existsSync(target) ? fs.readFileSync(target) : null;
      const text = before ? before.toString('utf8') : '';
      const block = instructionBlock(`${vendor}/skills/olchipanel-track`);
      const start = text.indexOf(BEGIN), end = text.indexOf(END);
      if (start !== -1 || end !== -1) {
        if (start < 0 || end < start || text.indexOf(BEGIN, start + BEGIN.length) !== -1 ||
            text.slice(start, end + END.length).replace(/\r\n/g, '\n') !== block.trimEnd()) {
          throw new Error(`Existing instruction block differs; preserved: ${target}`);
        }
        plan.push({ relative, target, action: 'unchanged' });
      } else {
        plan.push({ relative, target, action: before ? 'append' : 'create', before,
          bytes: Buffer.from((text ? (text.endsWith('\n') ? '\n' : '\n\n') : '') + block) });
      }
    }
    return plan;
  };
  let plan = buildPlan(); // Reject all known conflicts before any write.
  if (!dryRun) {
    const lock = safePath(root, '.olchipanel-setup.lock');
    const fd = fs.openSync(lock, 'wx');
    try {
      plan = buildPlan();
      for (const item of plan) {
        if (item.action === 'unchanged') continue;
        safePath(root, item.relative);
        fs.mkdirSync(path.dirname(item.target), { recursive: true });
        if (item.action === 'append') {
          if (!fs.readFileSync(item.target).equals(item.before)) throw new Error(`Instructions changed during setup: ${item.target}`);
          fs.appendFileSync(item.target, item.bytes);
        } else fs.writeFileSync(item.target, item.bytes, { flag: 'wx' });
      }
    } finally { fs.closeSync(fd); fs.unlinkSync(lock); }
  }
  return { schema: 'olchipanel.project-setup.v1', project: root, dryRun,
    changed: plan.filter(item => item.action !== 'unchanged').length,
    files: plan.map(({ relative, action }) => ({ path: relative.replace(/\\/g, '/'), action })),
    next: 'Read the project-local olchipanel-track skill. Then name this session and confirm its goal or previous handoff. Registration is not automatic consent for future sessions.' };
}
module.exports = { setupProject };
