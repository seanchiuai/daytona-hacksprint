---
description: Creates feature-specific agents and implementation plans based on a PRD or feature document
allowed-tools: Bash, Edit
argument-hint: [PRD.json or doc describing what agent is in charge of]
---

# Command: /agents-setup

If not already existing, create agents and plans under .claude/agents/ and .claude/plans/ for each core feature described in the mentioned document.

Rules:
- Keep in mind the default agents are not feature-specific agents. Default agents exist under the .claude/agents/default folder.
- Agents are created with kebab-case naming: `agent-feature-name.md`
- Plans follow the same convention: `plan-feature-name.md`
- Each agent should be focused on a single feature or capability
- Use skill `agent-creating` to create agents
- Use skill `researching-features` to create plans
- Always use context7 for the latest information and best practices