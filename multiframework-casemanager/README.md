# Salesforce Multi-Framework — React Case Manager

> Built by [Kapil Batra](https://www.linkedin.com/in/hellokapil) | [SF Bolt YouTube Channel](https://www.youtube.com/@salesforcebolt)

📺 **Watch the video:** Coming soon
🐙 **Repo:** [salesforcebolt-lwc/multiframework-casemanager](https://github.com/batra-kapil/salesforcebolt-lwc/tree/main/multiframework-casemanager)

---

## What Is This?

This project demonstrates how to build a **native Salesforce app using React** with the **Salesforce Multi-Framework Beta** — released in Spring '26.

The Case Manager app runs natively on the Salesforce platform using the `@salesforce/sdk-data` SDK for data access. Authentication, security, and governance are all handled by the platform automatically — no token management required in the app code.

### What the App Does

A single-page React app — `CaseManager` — that:

- **Queries** open Cases from the org via GraphQL using `createDataSDK()`
- **Creates** a new Case via GraphQL mutation with Subject, Status, and Priority
- **Updates** a Case status inline via GraphQL mutation
- **Deletes** a Case via GraphQL mutation with immediate UI removal

---

## Why Salesforce Multi-Framework?

Until now building on Salesforce meant LWC or Aura. You got platform features but gave up the broader JavaScript ecosystem. Multi-Framework eliminates that trade-off.

| | React (Multi-Framework) | LWC |
|---|---|---|
| **Data access** | GraphQL + Apex via `@salesforce/sdk-data` | `@wire`, Lightning Data Service |
| **Component library** | Bring your own — shadcn/ui, MUI, Ant Design | Salesforce Base Components (80+) |
| **Styling** | Tailwind CSS, CSS Modules, any CSS-in-JS | SLDS tokens and classes |
| **App Builder support** | Not yet available (planned for GA) | Full drag-and-drop support |
| **Cross-platform reuse** | Share across Salesforce and non-Salesforce | Salesforce only |
| **Ecosystem tooling** | npm, Vite, Vitest, React DevTools | Salesforce CLI, LWC Local Dev |

**Choose React** when your team has React expertise or needs the broader npm ecosystem.
**Choose LWC** when you need App Builder support, declarative `@wire` data access, or your team is already Salesforce-native.

> Source: [Build with React, Run on Salesforce — Official Blog Post](https://developer.salesforce.com/blogs/2026/04/build-with-react-run-on-salesforce-introducing-salesforce-multi-framework) by Amanda Lane, Alice Oh, and Charles Watkins.

---

## Prerequisites

- **Node.js v22+** — verify with `node -v`
- **Salesforce CLI v2** — verify with `sf -v`
- **Dev Hub org** — required to create scratch orgs
- **VS Code** with Salesforce Extension Pack
- A scratch org or sandbox — Multi-Framework is **not available in production orgs** during Beta

---

## Project Structure

```
multiframework-casemanager/
├── force-app/
│   └── main/
│       └── default/
│           └── uiBundles/
│               └── CaseManager/
│                   ├── src/
│                   │   ├── api/
│                   │   │   ├── graphqlClient.ts
│                   │   │   ├── graphql-operations-types.ts
│                   │   │   ├── queries/
│                   │   │   │   └── getCases.graphql
│                   │   │   └── mutations/
│                   │   │       ├── createCase.graphql
│                   │   │       ├── updateCase.graphql
│                   │   │       └── deleteCase.graphql
│                   │   ├── hooks/
│                   │   │   └── useCases.ts
│                   │   ├── pages/
│                   │   │   └── Cases.tsx
│                   │   └── components/ui/
│                   ├── package.json
│                   ├── vite.config.ts
│                   └── CaseManager.uibundle-meta.xml
└── sfdx-project.json
```

`uiBundles` is the new metadata type for Multi-Framework apps. Salesforce hosts the built React bundle on the platform after deployment.

---

## Key Concepts

### Authentication — createDataSDK()

```typescript
import { createDataSDK } from '@salesforce/sdk-data';

const data = await createDataSDK();
const response = await data.graphql?.({ query, variables });
```

`createDataSDK()` handles authentication automatically. No tokens, no OAuth flows in your application code. The platform manages the current user's session. This is the Multi-Framework equivalent of `@salesforce/apex` or `lightning/graphql` in LWC.

### React for LWC Developers

| LWC concept | React equivalent |
|---|---|
| `@wire` — declarative, reactive | `useState` + `useEffect` — same behaviour |
| `connectedCallback()` | `useEffect(() => {}, [])` — empty array = runs once |
| HTML template + JS + CSS | JSX — HTML-like syntax inside the JS file |
| `@salesforce/apex` or `lightning/graphql` | `@salesforce/sdk-data` — `createDataSDK()` |

### GraphQL — Same Syntax as LWC

The GraphQL query and mutation syntax is identical to LWC GraphQL — same `uiapi`, `edges`, `node` pattern:

```graphql
query GetCases {
    uiapi {
        query {
            Case(first: 10, orderBy: { CreatedDate: { order: DESC } }) {
                edges {
                    node {
                        Id
                        CaseNumber { value }
                        Subject { value }
                        Status { value }
                        Priority { value }
                        CreatedDate { value }
                    }
                }
            }
        }
    }
}
```

### useCases Hook

The custom hook manages all data logic — equivalent to a wire adapter in LWC. The Cases page component never touches GraphQL directly.

```typescript
const { cases, isLoading, error, createCase,
        updateCaseStatus, deleteCase } = useCases();
```

---

## How to Deploy

**Step 1 — Clone the repo**
```bash
git clone https://github.com/batra-kapil/salesforcebolt-lwc.git
cd salesforcebolt-lwc/multiframework-casemanager
```

**Step 2 — Authorize your Dev Hub**
```bash
sf org login web --set-default-dev-hub --alias devhub
```

**Step 3 — Create a scratch org**

Create `config/project-scratch-def.json`:
```json
{
    "edition": "Developer",
    "language": "en_US"
}
```

Then create the scratch org:
```bash
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias CaseManagementReact \
  --set-default \
  --duration-days 30
```

**Step 4 — Enable Multi-Framework in Setup**

```bash
sf org open --target-org CaseManagementReact
```

Go to Setup → search "Salesforce Multi-Framework" → click **React Development with Salesforce Multi-Framework (Beta)** → click **Enable Beta** → confirm.

> ⚠️ After you enable Salesforce Multi-Framework you cannot disable it. Only enable in scratch orgs or sandboxes.

**Step 5 — Install dependencies**
```bash
cd force-app/main/default/uiBundles/CaseManager
npm install
```

**Step 6 — Fetch GraphQL schema and run codegen**
```bash
npm run graphql:schema
npm run graphql:codegen
```

**Step 7 — Run locally**
```bash
npm run dev
```

Open `localhost:5173` to test the app locally against your live scratch org.

**Step 8 — Build and deploy**
```bash
npm run build
cd ../../../../..
sf project deploy start \
  --source-dir force-app/main/default/uiBundles/CaseManager \
  --target-org CaseManagementReact
```

**Step 9 — Open the app**
```bash
sf org open --target-org CaseManagementReact
```

App Launcher → search "CaseManager" → open the app → navigate to the Cases tab.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| React Router | v7 | Client-side routing |
| shadcn/ui | latest | UI component library |
| Tailwind CSS | v4 | Styling |
| Vite | v7 | Build tool and dev server |
| `@salesforce/sdk-data` | ^1.134.3 | Salesforce data access |
| `@salesforce/ui-bundle` | ^1.134.3 | Multi-Framework runtime |

---

## Beta Limitations

- Cannot be deployed to **production orgs**
- **Lightning App Builder** drag-and-drop not yet supported for React components
- Not available in **Developer Edition orgs** or **Trailhead Playgrounds** — scratch orgs and sandboxes only
- Some platform APIs not available in the Beta runtime
- Default org language must be **English (en_US)**

Check the [official Beta documentation](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-overview.html) for the full list of known limitations.

---

## Resources

- [Official Blog Post — Build with React, Run on Salesforce](https://developer.salesforce.com/blogs/2026/04/build-with-react-run-on-salesforce-introducing-salesforce-multi-framework)
- [Multi-Framework Beta Documentation](https://developer.salesforce.com/docs/platform/einstein-for-devs/guide/reactdev-overview.html)
- [Salesforce Multi-Framework Recipes](https://github.com/trailheadapps/multiframework-recipes) — 20+ official code samples

---

## About SF Bolt

SF Bolt is a YouTube channel and LinkedIn brand focused on Salesforce and AI content — Agentforce, LWC, React, and everything in between.

- YouTube: [@salesforcebolt](https://www.youtube.com/@salesforcebolt)
- LinkedIn: [hellokapil](https://www.linkedin.com/in/hellokapil)
- GitHub: [batra-kapil](https://github.com/batra-kapil)
- Website: [salesforcebolt.com](https://salesforcebolt.com)

---

*If this helped you, star the repo and subscribe to SF Bolt for more Salesforce content every week.*
