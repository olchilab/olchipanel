'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID } = require('crypto');
const { isDeepStrictEqual } = require('util');
const { parse } = require('smol-toml');

function targetFor(agent, home = os.homedir(), env = process.env) {
  if (agent === 'codex') return path.join(env.CODEX_HOME || path.join(home, '.codex'), 'config.toml');
  if (agent === 'claude') return path.join(env.CLAUDE_CONFIG_DIR || home, '.claude.json');
  throw new Error('지원하지 않는 에이전트입니다.');
}

function snapshot(file) {
  for (let cursor = file;; cursor = path.dirname(cursor)) {
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error(`${file}: 링크된 설정은 수동 등록이 필요합니다.`);
    if (path.dirname(cursor) === cursor) break;
  }
  try { return fs.readFileSync(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

function planRegistration({ agent, home, env, command, script }) {
  const file = targetFor(agent, home, env);
  const before = snapshot(file);
  const text = before?.toString('utf8').replace(/^\uFEFF/, '') || '';
  const entry = { command, args: [script], env: { ELECTRON_RUN_AS_NODE: '1' } };
  let data;
  try { data = text.trim() ? (agent === 'codex' ? parse(text) : JSON.parse(text)) : {}; }
  catch (_) { throw new Error(`${file}: 설정 형식 오류. 원본을 보존했습니다.`); }
  const key = agent === 'codex' ? 'mcp_servers' : 'mcpServers';
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      (data[key] !== undefined && (!data[key] || typeof data[key] !== 'object' || Array.isArray(data[key])))) {
    throw new Error(`${file}: MCP 설정 구조를 확인해주세요.`);
  }
  const existing = data[key]?.olchipanel;
  if (existing !== undefined) {
    // Claude accepts the explicit stdio discriminator; do not rewrite it.
    const comparable = { ...existing };
    if (comparable.type === 'stdio') delete comparable.type;
    if (!isDeepStrictEqual(comparable, entry)) throw new Error(`${file}: 다른 olchipanel 등록이 있습니다. 덮어쓰지 않았습니다.`);
    return { agent, file, before, after: before, changed: false };
  }
  let after;
  if (agent === 'codex') {
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const addition = ['', '[mcp_servers.olchipanel]', `command = ${JSON.stringify(command)}`,
      `args = [${JSON.stringify(script)}]`, '[mcp_servers.olchipanel.env]', 'ELECTRON_RUN_AS_NODE = "1"', ''].join(eol);
    after = Buffer.concat([before || Buffer.alloc(0), Buffer.from(addition)]);
    try { parse(after.toString('utf8').replace(/^\uFEFF/, '')); }
    catch (_) { throw new Error(`${file}: 기존 TOML 구조에 안전하게 추가할 수 없습니다.`); }
  } else {
    data[key] = { ...data[key], olchipanel: entry };
    after = Buffer.from(JSON.stringify(data, null, 2) + '\n');
  }
  return { agent, file, before, after, changed: true };
}

function applyRegistration(plan) {
  if (!plan.changed) return { agent: plan.agent, status: 'already-registered', file: plan.file };
  fs.mkdirSync(path.dirname(plan.file), { recursive: true });
  const lock = `${plan.file}.olchipanel.lock`;
  const fd = fs.openSync(lock, 'wx');
  let temporary;
  try {
    if (!isDeepStrictEqual(snapshot(plan.file), plan.before)) throw new Error(`${plan.file}: 확인 이후 설정이 변경되었습니다. 다시 시도해주세요.`);
    let backup;
    if (plan.before !== null) {
      backup = `${plan.file}.olchipanel-backup-${randomUUID()}`;
      fs.writeFileSync(backup, plan.before, { flag: 'wx', mode: 0o600 });
    }
    if (plan.before === null) fs.writeFileSync(plan.file, plan.after, { flag: 'wx', mode: 0o600 });
    else {
      temporary = `${plan.file}.olchipanel-${randomUUID()}.tmp`;
      fs.writeFileSync(temporary, plan.after, { flag: 'wx', mode: 0o600 });
      if (!isDeepStrictEqual(snapshot(plan.file), plan.before)) throw new Error(`${plan.file}: 다른 프로그램의 변경을 발견했습니다. 다시 시도해주세요.`);
      fs.renameSync(temporary, plan.file);
      temporary = null;
    }
    return { agent: plan.agent, status: 'registered', file: plan.file, backup };
  } finally {
    if (temporary) fs.unlinkSync(temporary);
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}

// Native dialogs deliberately separate selection from consent. No agent file is
// written before the second dialog. Each agent reports its own result on failure.
async function runSetup({ show, command, script, home, env, platform = process.platform }) {
  if (platform !== 'win32') return { status: 'unsupported' };
  const choice = await show({ type: 'question', title: 'OlchiPanel 연결',
    message: '어떤 에이전트에서 OlchiPanel을 사용할까요?',
    detail: '설정 등록 후 에이전트를 다시 시작해야 합니다. 패널 연결은 대화에서 요청한 세션에만 적용됩니다.\n나중에 연결하려면 Alt → 설정 → 에이전트 연결을 선택하세요.',
    buttons: ['Codex', 'Claude Code', '둘 다', '나중에'], defaultId: 3, cancelId: 3, noLink: true });
  if (![0, 1, 2].includes(choice.response)) return { status: 'deferred' };
  const agents = choice.response === 2 ? ['codex', 'claude'] : [choice.response === 0 ? 'codex' : 'claude'];
  let plans;
  try {
    if (!fs.existsSync(command) || !fs.existsSync(script)) throw new Error('설치된 MCP 실행 파일을 찾을 수 없습니다.');
    plans = agents.map(agent => planRegistration({ agent, home, env, command, script }));
  } catch (e) {
    await show({ type: 'error', title: '등록 보류', message: e.message, buttons: ['확인'] });
    return { status: 'failed' };
  }
  const consent = await show({ type: 'question', title: 'MCP 설정 등록 동의',
    message: '선택한 에이전트의 사용자 설정에 OlchiPanel을 등록할까요?',
    detail: `${plans.map(p => p.file).join('\n')}\n\n실행 파일: ${command}\n설치된 앱의 실행 엔진을 사용합니다. 기존 설정은 백업하고 다른 항목은 유지합니다. 해당 사용자의 모든 프로젝트에서 도구를 사용할 수 있습니다.`,
    buttons: ['동의하고 등록', '취소'], defaultId: 1, cancelId: 1, noLink: true });
  if (consent.response !== 0) return { status: 'deferred' };
  const results = plans.map(plan => {
    try { return applyRegistration(plan); }
    catch (e) { return { agent: plan.agent, status: 'failed', error: e.message }; }
  });
  const failed = results.some(r => r.status === 'failed');
  await show({ type: failed ? 'warning' : 'info', title: failed ? '등록 결과 확인' : 'MCP 설정 등록 완료',
    message: failed ? '일부 설정을 등록하지 못했습니다.' : '에이전트를 완전히 종료한 뒤 다시 시작해주세요.',
    detail: results.map(r => `${r.agent}: ${r.status === 'failed' ? r.error : r.status === 'registered' ? '등록 완료' : '이미 등록됨'}${r.backup ? '\n백업: ' + r.backup : ''}`).join('\n') +
      '\n\n새 대화에서 “이 프로젝트에서 올치패널 시작해”라고 요청하세요. 프로젝트 지침·스킬 등록 후 연결됩니다. 실제 에이전트 연결은 아직 확인되지 않았습니다.\n다시 설정: Alt → 설정 → 에이전트 연결',
    buttons: ['확인'] });
  return { status: failed ? 'failed' : 'registered', results };
}

module.exports = { targetFor, planRegistration, applyRegistration, runSetup };
