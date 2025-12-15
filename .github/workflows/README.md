# GitHub Workflows

This directory contains automated workflows for Hyle repository maintenance.

## Documentation Check Workflow

**File:** `documentation-check.yml`

**Purpose:** Automatically reviews pull requests to main branch and determines if documentation needs to be updated based on code changes.

### Features

- ✅ Analyzes PR diffs using Claude API
- ✅ Identifies which documentation files need updates
- ✅ Posts detailed analysis as PR comment
- ✅ Adds `documentation-needed` label for high/medium impact changes
- ✅ Provides direct links to relevant documentation files

### Setup

1. **Create Anthropic API key:**
   - Go to https://console.anthropic.com/
   - Create a new API key
   - Copy the key (starts with `sk-ant-...`)

2. **Add secret to GitHub repository:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `ANTHROPIC_API_KEY`
   - Value: Paste your Anthropic API key
   - Click "Add secret"

3. **Enable workflow permissions:**
   - Go to Settings → Actions → General
   - Under "Workflow permissions", select:
     - ✅ Read and write permissions
   - Click "Save"

4. **Create label (optional):**
   - Go to Issues → Labels
   - Click "New label"
   - Name: `documentation-needed`
   - Description: "PR requires documentation updates"
   - Color: Choose a color (e.g., #FFA500 for orange)
   - Click "Create label"

### Usage

The workflow runs automatically when:
- A pull request is opened to `main` branch
- A pull request to `main` is updated (new commits)
- A pull request to `main` is reopened

**No manual action required** - it runs automatically!

### What It Checks

The workflow analyzes code changes against:

**Root Documentation (8 files):**
- `.cursorrules` - AI assistant reference
- `ARCHITECTURE.md` - System architecture
- `CONVENTIONS.md` - Code standards
- `CONTEXT.md` - Domain knowledge
- `IPC_API.md` - IPC channel reference
- `DECISIONS.md` - Architectural decisions
- `TROUBLESHOOTING.md` - Common issues
- `TUTORIALS.md` - Workflow guides
- `DOCUMENTATION.md` - Documentation index

**Directory READMEs (6 files):**
- `electron/README.md`
- `src/README.md`
- `src/components/README.md`
- `src/components/Canvas/README.md`
- `src/store/README.md`
- `src/utils/README.md`

**Inline Documentation:**
- JSDoc in modified files

### Example Output

The workflow posts a comment on each PR like this:

```markdown
## 📚 Documentation Check

Claude has analyzed this PR for documentation impact.

**Documentation Impact:** High

**Files Needing Updates:**
- `IPC_API.md` - Add documentation for new `CLEAR_DRAWINGS` IPC channel
- `src/App.tsx` - Add JSDoc to new `clearDrawings` handler function
- `.cursorrules` - Update with new clear drawings pattern

**Required Changes:**
1. **IPC_API.md**: Add new section documenting CLEAR_DRAWINGS channel with usage, parameters, examples
2. **App.tsx JSDoc**: Document new button handler with rationale and cross-reference to IPC handler
3. **.cursorrules**: Add clear drawings to common tasks section

**New Documentation:**
None required

---
[View Documentation Index](DOCUMENTATION.md)
```

### Customization

**Adjust which branches trigger the workflow:**

Edit `documentation-check.yml`:

```yaml
on:
  pull_request:
    branches:
      - main
      - develop  # Add more branches
```

**Change impact threshold for labeling:**

Edit the grep pattern in the workflow:

```bash
# Only label "High" impact (not Medium)
if echo "$analysis" | grep -q "Documentation Impact: High"; then
```

**Adjust diff size limit:**

Change line limit in the workflow:

```bash
$(head -n 1000 pr_diff.txt)  # Increase from 500 to 1000 lines
```

### Troubleshooting

**Issue: Workflow not running**

- ✅ Check that workflow permissions are set to "Read and write"
- ✅ Verify the PR is targeting the `main` branch
- ✅ Check Actions tab for any error messages

**Issue: "ANTHROPIC_API_KEY not found"**

- ✅ Verify secret is named exactly `ANTHROPIC_API_KEY` (case-sensitive)
- ✅ Check that secret is in "Repository secrets", not "Environment secrets"
- ✅ Try re-creating the secret

**Issue: API rate limits**

- ✅ Anthropic has generous rate limits, but consider:
  - Caching analysis results per commit SHA
  - Only running on PRs with code changes (not docs-only PRs)

**Issue: Comment not posted**

- ✅ Check workflow permissions include "Write" for pull requests
- ✅ Verify GitHub token has correct scopes
- ✅ Check Actions logs for specific error messages

### Cost Estimates

**Claude API pricing** (as of January 2025):

- Model: Claude Sonnet 4.5
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

**Typical PR analysis:**
- Input tokens: ~2,000 (diff + prompt)
- Output tokens: ~500 (analysis)
- Cost per PR: **~$0.01** (one cent)

For a repository with 100 PRs/month: **~$1/month**

### Alternative: Manual Review

If you prefer not to use the Claude API, you can:

1. **Use the checklist manually:**
   - See `DOCUMENTATION.md` for validation checklist
   - Review changed files against documentation inventory

2. **Create a simpler rule-based workflow:**
   - Check if certain files changed (e.g., `electron/main.ts`)
   - Post reminder comment to update specific docs
   - No AI analysis, just pattern matching

**Example simple workflow:**

```yaml
- name: Check for IPC changes
  run: |
    if git diff --name-only origin/main | grep -q "electron/main.ts"; then
      echo "⚠️ electron/main.ts changed - please review IPC_API.md"
    fi
```

### Maintenance

**Update documentation list:**

When adding new documentation files, update the workflow prompt in `documentation-check.yml`:

```bash
**New Documentation:**
- NEW_FILE.md (description)
```

**Update Claude model:**

To use a newer Claude model, change the model name:

```json
"model": "claude-sonnet-4-20250514"  # Update to newer version
```

### Security Notes

- ✅ API key is stored as a secret (not in code)
- ✅ Workflow only has read access to code, write access to PR comments
- ✅ PR diffs are sent to Anthropic API (consider for sensitive repos)
- ✅ No credentials or secrets are included in diffs

### See Also

- [DOCUMENTATION.md](../../DOCUMENTATION.md) - Documentation inventory
- [CONVENTIONS.md](../../CONVENTIONS.md) - Documentation standards
- [GitHub Actions docs](https://docs.github.com/en/actions)
- [Anthropic API docs](https://docs.anthropic.com/claude/reference/messages_post)

---

**Last updated:** 2025-01-XX
