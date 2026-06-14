# salesforcebolt-lwc

> Built by [Kapil Batra](https://www.linkedin.com/in/hellokapil) | [SF Bolt YouTube Channel](https://www.youtube.com/@salesforcebolt)

This repository contains all Lightning Web Component examples built for the **SF Bolt** YouTube channel. Each subfolder is a self-contained SFDX project with its own README, covering a specific LWC topic or video.

---

## Videos & Projects

| Topic | Folder | API Version | YouTube |
|---|---|---|---|
| GraphQL Mutations in LWC | [graphql-mutations](./graphql-mutations) | 67.0 | https://www.youtube.com/watch?v=Lu7JSCnXB2g |
| Salesforce Multi-Framework React | [multiframework-casemanager](./multiframework-casemanager) | 67.0 | https://youtu.be/GAVNnXHYvGo?si=5A4tZE3rVGfBmpmE |
| Salesforce Skills — Case Escalation | [salesforce-skills-case-escalation](./salesforce-skills-case-escalation) | 67.0 | Coming soon |

---

## How to Use This Repo

Each subfolder is an independent SFDX project. Clone the repo and `cd` into the folder you want — then deploy straight to your org.

```bash
git clone https://github.com/batra-kapil/salesforcebolt-lwc.git
cd salesforcebolt-lwc/<folder-name>
sf org login web --alias your-org-alias
sf project deploy start \
  --source-dir force-app/main/default/lwc \
  --target-org your-org-alias
```

Each folder has its own README with full setup instructions, prerequisites, and deployment steps.

---

## Prerequisites

- Salesforce CLI v2 — verify with `sf -v`
- VS Code with Salesforce Extension Pack
- A Salesforce Developer Edition or Sandbox org
- API version 66.0 or later for most components

---

## Development Standards

This repo uses a `CLAUDE.md` file at the root that enforces consistent development standards across all projects — no deprecated LWC directives, correct API versions, modern patterns only.

If you are contributing or using Claude Code to extend any component in this repo, the `CLAUDE.md` will be read automatically before every task.

---

## About SF Bolt

SF Bolt is a YouTube channel and LinkedIn brand focused on Salesforce and AI content — Agentforce, LWC, Apex, and everything in between.

- YouTube: [@salesforcebolt](https://www.youtube.com/@salesforcebolt)
- LinkedIn: [hellokapil](https://www.linkedin.com/in/hellokapil)
- GitHub: [batra-kapil](https://github.com/batra-kapil)
- Website: [salesforcebolt.com](https://salesforcebolt.com)

---

*Subscribe to SF Bolt for new Salesforce content every week.*
