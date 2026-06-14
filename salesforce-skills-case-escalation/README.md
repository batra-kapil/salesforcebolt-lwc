# Salesforce Skills — Case Escalation Component

> Built by [Kapil Batra](https://www.linkedin.com/in/hellokapil) | [SF Bolt YouTube Channel](https://www.youtube.com/@salesforcebolt)

📺 **Watch the video:** Coming soon
🐙 **Repo:** [salesforcebolt-lwc/salesforce-skills-case-escalation](https://github.com/batra-kapil/salesforcebolt-lwc/tree/main/salesforce-skills-case-escalation)

---

## What Is This?

This project demonstrates how to use the official **Salesforce Skills library** (`forcedotcom/sf-skills`) with **Claude Code** to generate production-ready Salesforce code from a single natural language prompt.

A complete Case Escalation solution generated using three Skills:
- `generating-lwc-components` — LWC component
- `generating-apex` — Apex controller with guardrails enforced
- `generating-apex-test` — Test class with 75%+ coverage

---

## What the Skills Generate

### caseEscalationForm (LWC)
- Lists open Cases with CaseNumber, Subject, Status, Priority
- Escalate button per row opens inline panel
- Escalation Reason textarea (required) and New Priority picklist (High, Critical)
- Success and error toasts on completion
- Exposed on App Builder Home and Record pages

### CaseEscalationController (Apex)
- `@AuraEnabled` method: `escalateCase(Id caseId, String reason, String newPriority)`
- Updates Case Status to Escalated and Priority to new value
- Adds Case Comment with the escalation reason
- `with sharing` enforced — no exceptions
- `AuraHandledException` for proper LWC error handling
- Bulkified — no SOQL in loops

### CaseEscalationControllerTest (Apex Test)
- TestDataFactory pattern
- Bulk test with 200+ records
- Happy path and error path covered
- 100% test coverage achieved

---

## Why Salesforce Skills?

Without Skills, Claude Code is a capable developer who has never worked on Salesforce before. It writes code that works in isolation but may miss Salesforce-specific requirements:

| Without Skills | With Skills |
|---|---|
| May forget `with sharing` | Enforces `with sharing` on every class |
| May put SOQL inside loops | Validates bulkification patterns |
| May skip test class | Generates test class automatically |
| No Code Analyzer check | Runs `sf code-analyzer` before finishing |
| No test execution | Runs `sf apex run test` and verifies 75%+ coverage |

---

## One Honest Note

Skills don't always activate automatically on the first prompt. In practice the workflow is:

1. Run your prompt
2. If skills didn't activate — tell Claude Code: `"Use the installed Salesforce Skills in this project"`
3. Claude Code reads the SKILL.md files and regenerates with guardrails applied

This is expected behavior. One extra line. Still dramatically better than writing everything from scratch.

---

## Prerequisites

- **Claude Code** installed — `npm install -g @anthropic-ai/claude-code`
- **Salesforce CLI v2** — verify with `sf -v`
- **Node.js v18+**
- A Salesforce org with Cases enabled
- Developer Edition, Sandbox, or Scratch org

---

## Setup — Install Salesforce Skills

**Step 1 — Navigate to your Salesforce project**
```bash
cd your-salesforce-project
```

**Step 2 — Install the Skills library**
```bash
npx skills add forcedotcom/sf-skills
```

Select skills using spacebar:
- `generating-apex`
- `generating-apex-test`
- `generating-lwc-components`
- `debugging-apex-logs`

Press **Enter**. Select **Project** for installation scope.

Skills are saved to `skills-lock.json` in your project root.

**Step 3 — Launch Claude Code**
```bash
claude
```

---

## The Prompt

Paste this into Claude Code:

```
Create a Case Escalation Lightning Web Component called 
caseEscalationForm with an Apex class called 
CaseEscalationController and a test class with 75%+ coverage.

The Lightning Web Component should:
- Show open Cases with CaseNumber, Subject, Status, Priority
- Have an Escalate button per row
- Open an inline panel with Escalation Reason textarea 
  and New Priority picklist (High, Critical)
- Show success and error toasts
- Expose on App Builder Home and Record pages

The Apex class should:
- Have an AuraEnabled method: escalateCase(Id caseId, 
  String reason, String newPriority)
- Update Case Status to Escalated and Priority
- Add a Case Comment with the escalation reason
- Use with sharing and AuraHandledException

Generate test class using TestDataFactory pattern with 
bulk testing for 200+ records.

Deploy to my org after generating all files.
```

If skills don't activate automatically add:
```
Use the installed Salesforce Skills in this project.
```

---

## Deploy from This Repo

**Step 1 — Clone**
```bash
git clone https://github.com/batra-kapil/salesforcebolt-lwc.git
cd salesforcebolt-lwc/salesforce-skills-case-escalation
```

**Step 2 — Authorize your org**
```bash
sf org login web --alias your-org-alias
```

**Step 3 — Deploy**
```bash
sf project deploy start \
  --source-dir force-app/main/default \
  --target-org your-org-alias
```

**Step 4 — Run tests**
```bash
sf apex run test \
  --class-names CaseEscalationControllerTest \
  --target-org your-org-alias \
  --result-format human
```

**Step 5 — Add to Lightning page**

Setup → Lightning App Builder → New → Home Page → drag `caseEscalationForm` onto the canvas → Save → Activate.

---

## File Structure

```
salesforce-skills-case-escalation/
├── force-app/
│   └── main/
│       └── default/
│           ├── lwc/
│           │   └── caseEscalationForm/
│           │       ├── caseEscalationForm.html
│           │       ├── caseEscalationForm.js
│           │       ├── caseEscalationForm.css
│           │       └── caseEscalationForm.js-meta.xml
│           └── classes/
│               ├── CaseEscalationController.cls
│               ├── CaseEscalationController.cls-meta.xml
│               ├── CaseEscalationControllerTest.cls
│               └── CaseEscalationControllerTest.cls-meta.xml
├── skills-lock.json
└── sfdx-project.json
```

---

## What Skills Enforce — Code Review

**CaseEscalationController.cls**
- `with sharing` on class declaration — enforced by `generating-apex`
- SOQL outside methods — no queries inside loops
- `AuraHandledException` — correct error pattern for LWC imperative calls
- Separate DML for Case and Case Comment — avoids mixed DML errors

**CaseEscalationControllerTest.cls**
- `@TestSetup` with TestDataFactory — correct data factory pattern
- `Test.startTest()` and `Test.stopTest()` — correct boundaries
- 200+ records in bulk test — governor limit safe
- Positive and negative assertion paths — `System.assertEquals` not just `System.assert`

**caseEscalationForm.js**
- `lwc:if` not `if:true` — current directive
- No `@track` on primitives — not needed since Spring '20
- `async/await` — no `.then().catch()` chains
- Error handling in catch block fires toast

---

## Resources

- [Salesforce Skills Blog Post — Akshata Sawant](https://developer.salesforce.com/blogs/2026/06/build-production-ready-apps-in-claude-code-with-salesforce-skills)
- [sf-skills GitHub Repository](https://github.com/forcedotcom/sf-skills)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
- [Agent Skills Specification](https://agentskills.io)
- [Salesforce Code Analyzer](https://developer.salesforce.com/docs/platform/salesforce-code-analyzer/overview)

---

## About SF Bolt

SF Bolt is a YouTube channel and LinkedIn brand focused on Salesforce and AI content — Agentforce, LWC, Apex, Claude Code, and everything in between.

- YouTube: [@salesforcebolt](https://www.youtube.com/@salesforcebolt)
- LinkedIn: [hellokapil](https://www.linkedin.com/in/hellokapil)
- GitHub: [batra-kapil](https://github.com/batra-kapil)
- Website: [salesforcebolt.com](https://salesforcebolt.com)

---

*If this helped you, star the repo and subscribe to SF Bolt for more Salesforce content every week.*
