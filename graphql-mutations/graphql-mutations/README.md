# GraphQL Mutations in LWC — Contact Manager

> Built by [Kapil Batra](https://www.linkedin.com/in/hellokapil) | [SF Bolt YouTube Channel](https://www.youtube.com/@salesforcebolt)

📺 **Watch the video:** [https://www.youtube.com/watch?v=Lu7JSCnXB2g]
🐙 **Repo:** [salesforcebolt-lwc/graphql-mutations](https://github.com/batra-kapil/salesforcebolt-lwc/tree/main/graphql-mutations)

---

## What Is This?

This project demonstrates how to perform **Create, Update, and Delete** operations in a Lightning Web Component using **GraphQL mutations** — with no Apex and no `lightning/uiRecordApi`.

All data operations are handled via `executeMutation` from `lightning/graphql`, making this a fully GraphQL-first LWC component.

### What the Component Does

A single LWC component — `graphqlContactManager` — that:

- **Queries** 10 contacts using `@wire(graphql)` ordered by Last Name
- **Creates** a new contact via a simple form with First Name, Last Name, and Phone
- **Updates** a contact's phone number inline via row action
- **Deletes** a contact via row action with immediate UI removal

---

## Why GraphQL Mutations Over Apex or uiRecordApi?

| Approach | Best for |
|---|---|
| **GraphQL mutations** | Components already using `@wire(graphql)` for queries — keeps reads and writes in one consistent module |
| **lightning/uiRecordApi** | Simple single record CRUD with no complex querying |
| **Apex** | Complex business logic, multi-object transactions, callouts, or objects not supported by UI API |

**Simple rule:** if your component already uses `@wire(graphql)` — use `executeMutation` for writes and keep everything in one module.

---

## Prerequisites

- Salesforce org with API version **66.0 or later** — mutations are GA from v66.0
- Only works with **UI API supported objects**
- Salesforce CLI v2 installed — verify with `sf -v`
- VS Code with Salesforce Extension Pack

---

## Component — graphqlContactManager

### File Structure

```
graphql-mutations/
├── force-app/
│   └── main/
│       └── default/
│           └── lwc/
│               └── graphqlContactManager/
│                   ├── graphqlContactManager.js
│                   ├── graphqlContactManager.html
│                   ├── graphqlContactManager.css
│                   └── graphqlContactManager.js-meta.xml
├── sfdx-project.json
└── README.md
```

---

## Key Concepts

### Imports

```javascript
import { gql, graphql, executeMutation } from 'lightning/graphql';
```

Three things from one module:
- `graphql` — wire adapter for querying
- `gql` — template literal parser for both queries and mutations
- `executeMutation` — imperative function for all write operations

### executeMutation signature

```javascript
const { data, errors } = await executeMutation({
    query: MY_MUTATION,        // gql constant
    operationName: 'OpName',   // recommended for server-side debugging
    variables: { ... }         // GraphQL variables
});
```

**Important:** `executeMutation` returns `errors` (plural) — not `error`. This matches the GraphQL response specification. Always check `errors?.length`.

### The three mutations

**Create**
```javascript
const CREATE_CONTACT = gql`
    mutation CreateContact($firstName: String, $lastName: String!, $phone: String) {
        uiapi {
            ContactCreate(input: {
                Contact: {
                    FirstName: $firstName
                    LastName: $lastName
                    Phone: $phone
                }
            }) {
                Record { Id LastName { value } }
                errors { message statusCode }
            }
        }
    }
`;
```

**Update**
```javascript
const UPDATE_CONTACT = gql`
    mutation UpdateContact($id: ID!, $phone: String) {
        uiapi {
            ContactUpdate(input: { fields: { Id: $id, Phone: $phone } }) {
                Record { Id Phone { value } }
                errors { message statusCode }
            }
        }
    }
`;
```

**Delete**
```javascript
const DELETE_CONTACT = gql`
    mutation DeleteContact($id: ID!) {
        uiapi {
            ContactDelete(input: { fields: { Id: $id } }) {
                Record { Id }
                errors { message statusCode }
            }
        }
    }
`;
```

---

## When to Refresh After a Mutation

This is a common question — and the official Salesforce docs are explicit:

| Operation | Refresh needed? | Why |
|---|---|---|
| **Create** | ✅ Yes — call `this.wiredContacts.refresh()` | New records are not automatically added to existing query results |
| **Update** | ❌ No | LDS automatically propagates changed field values to subscribed wire adapters when cached data overlaps |
| **Delete** | ❌ No | Deleted records are automatically removed from LDS wire results |

> **Note:** AI code reviewers may flag missing `refresh()` calls after update and delete as critical issues. They are not. This behaviour is documented in the official Salesforce developer blog. Always verify against official documentation before changing working code.

---

## How to Deploy

**Step 1 — Clone the repo**
```bash
git clone https://github.com/batra-kapil/salesforcebolt-lwc.git
cd salesforcebolt-lwc/graphql-mutations
```

**Step 2 — Authorize your org**
```bash
sf org login web --alias your-org-alias
```

**Step 3 — Deploy the component**
```bash
sf project deploy start \
  --source-dir force-app/main/default/lwc/graphqlContactManager \
  --target-org your-org-alias
```

**Step 4 — Add to a Lightning page**

Go to Setup → Lightning App Builder → create or edit an App Page → drag `graphqlContactManager` onto the canvas → Save → Activate.

---

## Limitations

- GraphQL mutations only work with **UI API supported objects** — check before using on custom objects with complex sharing rules
- **Creating records with child relationships** is not currently supported
- Requires **API version 66.0 or later**

---

## Resources

- [GraphQL Mutation — LWC Developer Guide](https://developer.salesforce.com/docs/platform/lwc/guide/reference-graphql-mutation.html)
- [GraphQL Mutations Limitations](https://developer.salesforce.com/docs/platform/graphql/guide/mutations-limitations.html)
- [LWC Recipes — graphqlMutation examples](https://github.com/trailheadapps/lwc-recipes)

---

## About SF Bolt

SF Bolt is a YouTube channel and LinkedIn brand focused on Salesforce and AI content — built by Kapil Batra, Salesforce MVP and Certified Application Architect.

- YouTube: [@salesforcebolt](https://www.youtube.com/@salesforcebolt)
- LinkedIn: [hellokapil](https://www.linkedin.com/in/hellokapil)
- GitHub: [batra-kapil](https://github.com/batra-kapil)
- Website: [salesforcebolt.com](https://salesforcebolt.com)

---

*If this helped you, star the repo and subscribe to SF Bolt for more Salesforce content every week.*