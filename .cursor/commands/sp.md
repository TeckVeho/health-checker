# SP Command

Calculate and display the estimated Story Points (SP) for a specified GitHub issue directly in the Cursor chat.

## Parameters

* `issue_number` (required): GitHub issue number to evaluate and calculate SP for.

---

## Instructions

Estimate the **Story Point (SP)** value for the specified issue and **display the result directly in the chat**.
SP represents the approximate number of **hours required by a standard engineer (2–3 years experience)** using an **AI code editor** to complete the issue.

Each **1 SP = 1 hour** of work.

---

### Command Workflow

1. **Determine Issue Number**

   * Use the provided `{issue_number}` argument.
   * Validate that `docs/issues/{issue_number}/issue.md` exists.
   * If not found, display an error message in the chat.

2. **Load Issue Context**

   * Read `docs/issues/{issue_number}/issue.md` to extract:

     * Functional and non-functional requirements
     * Affected modules and files
     * Scope and estimated complexity
   * Optionally, reference related source code under `backend/` or `frontend/` if needed for context.

3. **Analyze Implementation Effort**

   * Consider:

     * **Code size & complexity**
     * **Testing workload**
     * **Architecture impact**
     * **Integration or API dependencies**
     * **Cross-layer effort (backend/frontend)**
   * Estimate total effort (in hours) assuming an AI-assisted mid-level engineer.

4. **Calculate SP**

   * 1 SP = 1 hour of development effort.
   * Round total estimated hours to the nearest integer (minimum 1).
   * Reference scale:

     | Type      | Description                           | SP Range |
     | --------- | ------------------------------------- | -------- |
     | Small fix | Simple logic or UI tweak              | 1–2      |
     | Medium    | Adds a feature or minor refactor      | 3–6      |
     | Large     | Multi-module / DB changes             | 7–12     |
     | Major     | System-wide or architectural refactor | 13–20+   |

5. **Output Result (Chat Only)**

   * Display in Cursor chat, formatted like this:

     ```
     📊 Issue #123
     Title: Fix alert model validation
     Estimated effort: ~4 hours
     🧠 Story Points (SP): 4
     ```
   * No files are written or committed.

---

## Example Usage

```bash
/sp 123
```

**Chat Output Example**

```
🔍 Analyzing docs/issues/123/issue.md ...
🧠 Estimated effort: 4.5 hours
📊 Story Points (SP): 5
✅ Result displayed in chat (no file output)
```

---

## File and Data References

| Step               | Source                                | Purpose                                     |
| ------------------ | ------------------------------------- | ------------------------------------------- |
| Input              | `docs/issues/{issue_number}/issue.md` | Parse for requirements and complexity       |
| Optional Reference | `backend/`, `frontend/`               | Identify affected modules and lines of code |
| Output             | *(none)*                              | Results printed to Cursor chat only         |

---

## Implementation Notes

* Implementation logic should be placed in `backend/utils/calcStoryPoint.ts`.
* The command should **not commit** or write to disk.
* It can later integrate with `/pr` or `/plan` for automatic SP assignment to Project custom fields via GitHub GraphQL.

---

## Issue: {issue_number or provided}

**Input**: `docs/issues/{issue_number}/issue.md`
**Output**: Displayed in Cursor chat only (no file created)