/**
 * The Node the project's checks run with. A hook runs under whatever `node`
 * comes first on the tool's PATH, which may be older than the project needs
 * (nvm's default, say); the checks then fail for the wrong reason. So the
 * project names the major version it needs (`"node": 22` in validate.json),
 * and the checks run with the first Node found that has it, its directory
 * put first on their PATH.
 */

import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** The major version of `v22.21.1`, or 0. */
export function majorOf(version) {
  const match = /^v?(\d+)\./.exec(version.trim());
  return match ? Number(match[1]) : 0;
}

function versionOf(executable) {
  const result = spawnSync(executable, ['--version'], {encoding: 'utf8'});
  return result.status === 0 ? result.stdout.trim() : null;
}

/**
 * The Node executables worth trying, most specific first: the one running
 * this, `DESIGN_FENCE_NODE`, nvm's (newest first), then the usual places.
 */
export function candidates(env = process.env, home = os.homedir()) {
  const found = [process.execPath];
  if (env.DESIGN_FENCE_NODE) {
    found.push(env.DESIGN_FENCE_NODE);
  }
  const nvm = path.join(env.NVM_DIR ?? path.join(home, '.nvm'), 'versions', 'node');
  if (fs.existsSync(nvm)) {
    fs.readdirSync(nvm)
      .sort((a, b) => majorOf(b) - majorOf(a))
      .forEach(version => found.push(path.join(nvm, version, 'bin', 'node')));
  }
  found.push('/opt/homebrew/bin/node', '/usr/local/bin/node', '/usr/bin/node');
  if (env.ProgramFiles) {
    found.push(path.join(env.ProgramFiles, 'nodejs', 'node.exe'));
  }
  return found;
}

/**
 * The first Node of at least `minimum` (a major version), as `{executable,
 * version}`, or null if none is found. Without a minimum, the running one.
 */
export function findNode(minimum, list = candidates()) {
  for (const executable of list) {
    if (executable !== process.execPath && !fs.existsSync(executable)) {
      continue;
    }
    const version = executable === process.execPath ? process.version : versionOf(executable);
    if (version && (!minimum || majorOf(version) >= minimum)) {
      return {executable, version};
    }
  }
  return null;
}
