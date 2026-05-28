# CLAUDE.md — SF Bolt Development Standards

This file is read automatically by Claude Code before every task.
Follow every rule in this file without exception.
If you are unsure whether something is current, check official Salesforce 
documentation before writing code. Never assume — verify.

---

## GENERAL RULES

- Always use the latest stable API version unless explicitly told otherwise
- Never use deprecated syntax, directives, commands, or patterns
- Never guess — if you are not certain something is current, say so and ask
- Always verify official Salesforce documentation before using any feature 
  marked as Beta in previous releases
- Prefer official Salesforce-native solutions over third-party workarounds
- All code must be production-ready — no TODO comments, no placeholder logic, 
  no console.log left in final output
- Always handle errors explicitly — never swallow exceptions silently

---

## SALESFORCE CLI

### Use sf — never sfdx
```bash
# CORRECT
sf project deploy start --source-dir force-app --target-org alias
sf org login web --alias alias
sf org display --target-org alias
sf data query --query "SELECT Id FROM Account" --target-org alias

# WRONG — sfdx is deprecated
sfdx force:source:deploy ...
sfdx force:org:create ...
```

### Always specify --target-org explicitly
Never rely on a default org. Always pass `--target-org` on every command.

### Project generation
```bash
# CORRECT
sf project generate --name project-name --no-namespace

# WRONG
sfdx force:project:create ...
```

---

## LIGHTNING WEB COMPONENTS (LWC)

### API version
- Always set `apiVersion` to `67.0` in every `js-meta.xml` file

### Directives — conditional rendering
```html
<!-- CORRECT — modern directives -->
<template lwc:if={condition}>...</template>
<template lwc:elseif={otherCondition}>...</template>
<template lwc:else>...</template>

<!-- WRONG — deprecated, never use -->
<template if:true={condition}>...</template>
<template if:false={condition}>...</template>
```

### Directives — iteration
```html
<!-- CORRECT — modern iteration (API 61+) -->
<template lwc:for={items} lwc:for-item="item" lwc:key={item.id}>
    <p>{item.name}</p>
</template>

<!-- ACCEPTABLE — still supported but prefer lwc:for -->
<template for:each={items} for:item="item">
    <p key={item.id}>{item.name}</p>
</template>

<!-- WRONG — deprecated -->
<template iterator:it={items}>...</template>
```

### Decorators
```javascript
// CORRECT — @track not needed for primitives or plain objects since Spring '20
export default class MyComponent extends LightningElement {
    myString = '';
    myBoolean = false;
    myObject = {};
}

// WRONG — @track on primitives is redundant and misleading
@track myString = '';
@track myBoolean = false;

// CORRECT — @track still valid only for deeply nested object mutation
@track deepObject = { nested: { value: 1 } };
```

### Imports
```javascript
// CORRECT — import only what you use
import { LightningElement, wire, api } from 'lwc';

// WRONG — never import track unless genuinely needed for deep objects
import { LightningElement, wire, track } from 'lwc';
```

### DOM access
```javascript
// CORRECT — use lwc:ref for direct element access (API 59+)
// HTML: <input lwc:ref="myInput" />
this.refs.myInput.focus();

// ACCEPTABLE — querySelector still works but prefer lwc:ref
this.template.querySelector('input').focus();
```

### Wire adapters
```javascript
// CORRECT — GraphQL wire adapter
import { gql, graphql, executeMutation } from 'lightning/graphql';

@wire(graphql, { query: MY_QUERY })
wiredResult;

// Refresh GraphQL wire correctly
this.wiredResult.refresh();

// WRONG — refreshApex is for Apex wires only, not GraphQL
import { refreshApex } from '@salesforce/apex';
await refreshApex(this.wiredResult); // NEVER do this for GraphQL
```

### GraphQL mutations
```javascript
// CORRECT — executeMutation signature
const { data, errors } = await executeMutation({
    query: MY_MUTATION,
    operationName: 'OperationName',
    variables: { ... }
});

// CORRECT — errors is plural on executeMutation
if (errors?.length) { ... }

// WRONG — executeMutation does not use @wire
@wire(executeMutation) // NEVER

// WRONG — old signature
await executeMutation(this, MY_MUTATION, { variables }); // NEVER
```

### Async patterns
```javascript
// CORRECT — async/await
async handleSave() {
    try {
        const result = await someOperation();
    } catch (error) {
        console.error(error);
    }
}

// WRONG — avoid .then().catch() chains
someOperation().then(result => {}).catch(error => {}); // avoid
```

### SLDS spacing utilities
```html
<!-- CORRECT — var versions are current standard -->
<div class="slds-var-p-around_medium slds-var-m-bottom_small">

<!-- ACCEPTABLE — still works but var versions preferred -->
<div class="slds-p-around_medium slds-m-bottom_small">
```

---

## APEX

### API version
- Always use `@apiVersion 67.0` in Apex classes

### Null safety
```java
// CORRECT
if (myList != null && !myList.isEmpty()) { }

// WRONG
if (myList.size() > 0) { } // throws NullPointerException if null
```

### SOQL
```java
// CORRECT — always filter, always limit, always handle empty
List<Account> accounts = [SELECT Id, Name FROM Account WHERE Id = :recordId LIMIT 1];
if (!accounts.isEmpty()) { }

// WRONG — no limit, no null check
Account acc = [SELECT Id FROM Account WHERE Id = :recordId];
```

### DML
```java
// CORRECT — bulkified, list-based DML
insert recordList;

// WRONG — DML inside loops
for (Account a : accounts) {
    insert a; // never
}
```

### Exception handling
```java
// CORRECT — always catch specific exceptions
try {
    insert record;
} catch (DmlException e) {
    throw new AuraHandledException(e.getMessage());
}

// WRONG — swallowing exceptions
try {
    insert record;
} catch (Exception e) { } // never swallow
```

---

## FLOWS

### Always use these flow types for the right purpose
- **Screen Flow** — user-facing, requires interaction
- **Auto-launched Flow** — background, no UI, called from Apex/Agent/Process
- **Schedule-triggered Flow** — runs on a schedule
- **Record-triggered Flow** — runs on record create/update/delete

### Best practices
- Always add fault paths on every flow element that can fail
- Never hardcode IDs — use Custom Labels or Custom Metadata
- Always add descriptions to every element
- Use Collection variables to bulkify Get Records and DML elements
- Test with both positive and negative scenarios before activating

---

## AGENTFORCE / AGENT SCRIPT

### Agent Builder
- Always use the **new Agent Builder** — not the legacy Agentforce Builder
- Always build and activate specialist agents before building orchestrators
- Always use API v67.0 for agent metadata

### Agent Script syntax
```yaml
# CORRECT — deterministic block
-> if @variables.verified == False:
   run @actions.verify_identity

# CORRECT — LLM reasoning block  
| Classify the user intent as one of: query, action, escalate

# WRONG — never mix -> and | logic in the same block
```

### Variables
```yaml
# CORRECT — typed, explicit
variables:
    verified: mutable boolean = False
    contact_id: mutable string = ""

# WRONG — untyped assumptions
```

### Connected subagents (Summer '26 Beta)
```yaml
# CORRECT — always bind system variables explicitly
connected_subagent IT_Provisioning_Agent:
    inputs:
        ContactId: string = @variables.ContactId
        RoutableId: string = @variables.RoutableId
        EndUserLanguage: string = @variables.EndUserLanguage
        EndUserId: string = @variables.EndUserId

# WRONG — leaving inputs unbound causes 24 validation errors
```

---

## METADATA & DEPLOYMENT

### Deploy order — always respect dependencies
1. Custom Objects and Fields
2. Custom Metadata Types
3. Permission Sets
4. Flows
5. Apex Classes and Triggers
6. LWC Components
7. Agents and Agent Script

### Never deploy to production directly
Always deploy to sandbox first. Use pre-release orgs for Beta features only.

### Retrieve generated metadata after UI builds
```bash
# After building agents in UI, always retrieve
sf project retrieve start \
    --metadata "GenAiPlannerBundle" \
    --target-org alias
```

### sfdx-project.json
```json
{
    "sourceApiVersion": "67.0"
}
```
Always keep `sourceApiVersion` at `67.0`.

---

## GITHUB & VERSION CONTROL

### Commit message format
```
feat: add GraphQL mutations LWC component
fix: correct executeMutation signature
chore: update API version to 67.0
docs: add README for multi-agent orchestration
```

### Repo naming convention (SF Bolt)
```
sfbolt-agentforce-[topic]    → Agentforce videos
salesforcebolt-lwc           → all LWC videos in subfolders
sfbolt-apex-[topic]          → Apex videos
```

### Never commit
- Org credentials or session tokens
- `.sfdx` folder contents with auth data
- Hardcoded org URLs or usernames

---

## CODE REVIEW CHECKLIST

Before deploying or pushing, verify every item:

**LWC**
- [ ] No `if:true` or `if:false` directives
- [ ] No `@track` on primitives
- [ ] No `refreshApex` on GraphQL wires
- [ ] No unused imports
- [ ] API version 67.0 in js-meta.xml
- [ ] `lwc:if` / `lwc:else` used throughout
- [ ] `errors` (plural) handled on `executeMutation`
- [ ] No `console.log` in production code
- [ ] No `.then().catch()` — use `async/await`

**Apex**
- [ ] No DML inside loops
- [ ] No SOQL inside loops
- [ ] All queries have LIMIT clauses
- [ ] Null checks before list operations
- [ ] Specific exception types caught

**Flows**
- [ ] Fault paths on all fallible elements
- [ ] No hardcoded IDs
- [ ] Descriptions on every element
- [ ] Tested positive and negative paths

**Deployment**
- [ ] Correct deploy order followed
- [ ] `--target-org` specified explicitly
- [ ] Deployed to sandbox before production
- [ ] Retrieved agent metadata after UI builds

**General**
- [ ] No TODO comments
- [ ] No placeholder logic
- [ ] Error handling on every async operation
- [ ] Official Salesforce docs verified for any Beta features

---

## WHEN IN DOUBT

1. Check **developer.salesforce.com/docs** first
2. Check **help.salesforce.com** second
3. Check **trailhead.salesforce.com** third
4. Never rely on third-party blogs as the source of truth
5. If a feature is marked Beta — confirm GA status before using in video demos
6. Ask before assuming — flag uncertainty explicitly rather than guessing

---

*Maintained by Kapil Batra — SF Bolt*
*Last updated: May 2026*
