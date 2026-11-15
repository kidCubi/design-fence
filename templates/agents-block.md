## The process: design-fence

How work is done here is design-fence's process (`.agents/design-fence/PROCESS.md`, for why). Each kind of work has a playbook that says how: **read the playbook named, whole, before its first step**. Working from `PROCESS.md` alone skips the steps. `node .agents/design-fence/bin/design-fence.mjs route "<the request>"` says which one, and the project's files the request touches.

| The work | The playbook |
|---|---|
{{routes}}

The same playbooks are installed as skills (`.agents/skills/design-fence-*`, and `.claude/skills/design-fence-*` for Claude Code), for the agents that load skills.

### design-fence's non-negotiables

{{non-negotiables}}
