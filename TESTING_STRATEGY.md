# Hyle E2E Testing Strategy
**Playwright Testing Suite for Dual-Target Application (Web & Electron)**

---

## Table of Contents
1. [Overview](#overview)
2. [Configuration Strategy](#1-configuration-strategy-playwrightconfigts)
3. [Descriptive Error Pattern](#2-descriptive-error-pattern)
4. [Visual Testing & Bypass Strategy](#3-visual-testing--bypass-strategy)
5. [The Quality Gate (CI/CD)](#4-the-quality-gate-cicd)
6. [Repository Setup & Enforcement](#5-repository-setup--enforcement)
7. [Testing Best Practices](#6-testing-best-practices)

---

## Overview

This document outlines the comprehensive testing strategy for the Hyle application, which supports two deployment targets:
- **Web (SPA)**: Browser-based application served via Vite
- **Electron (Desktop)**: Native desktop application with IPC integration

### Testing Goals
- ✅ **Visual Regression Testing**: Catch UI regressions with pixel-perfect snapshots
- ✅ **Descriptive Failures**: Every test failure should tell you *exactly* what broke
- ✅ **CI Enforcement**: Block broken PRs from merging via GitHub Actions
- ✅ **Fast Feedback**: Parallel test execution with sharding
- ✅ **Rich Debugging**: Automatic traces, videos, and HTML reports on failure

---

## 1. Configuration Strategy (`playwright.config.ts`)

### 1.1 Dual-Project Architecture

The Playwright config defines **two distinct projects** to test both deployment modes:

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Prevent .only() in CI
  retries: process.env.CI ? 2 : 0, // Retry flaky tests in CI
  workers: process.env.CI ? 1 : undefined, // Controlled parallelism in CI

  // Global timeout settings
  timeout: 30000, // 30s per test
  expect: {
    timeout: 10000, // 10s for assertions
  },

  // Reporter configuration
  reporter: [
    ['html', { open: 'never' }], // HTML report (always generated)
    ['list'], // Console output during test run
    ['json', { outputFile: 'test-results/results.json' }] // Machine-readable results
  ],

  use: {
    // Tracing configuration - only capture on failure/retry
    trace: 'on-first-retry', // Saves video/DOM/network on retry
    screenshot: 'only-on-failure', // Screenshots on assertion failures

    // Base URL for web tests
    baseURL: process.env.CI
      ? 'http://localhost:4173' // Vite preview (production build)
      : 'http://localhost:5173', // Vite dev server

    // Viewport settings
    viewport: { width: 1280, height: 720 },

    // Video recording (only on retry to save disk space)
    video: 'retain-on-failure',
  },

  projects: [
    // ===== PROJECT 1: Web-Chromium (Visual Regression) =====
    {
      name: 'Web-Chromium',
      use: {
        ...devices['Desktop Chrome'],

        // Visual snapshot consistency
        deviceScaleFactor: 1, // Force 1x scaling for consistent snapshots

        // Font rendering consistency (critical for cross-OS snapshots)
        launchOptions: {
          args: [
            '--font-render-hinting=none', // Disable font hinting
            '--disable-font-subpixel-positioning', // Consistent font positioning
            '--disable-skia-runtime-opts', // Disable runtime optimizations
          ],
        },
      },

      // Only run visual snapshot tests in this project
      testMatch: /.*\.visual\.spec\.ts/,
    },

    // ===== PROJECT 2: Electron-App (Integration Testing) =====
    {
      name: 'Electron-App',
      use: {
        // Launch actual Electron executable
        // Note: Requires Electron build to exist (npm run build)
        // @ts-ignore - _electron is a valid Playwright context
        _electron: {
          executablePath: require('electron'),
          args: ['./dist-electron/main.js'], // Entry point after build
        },

        // Disable web-specific features
        baseURL: undefined,
      },

      // Only run Electron-specific tests
      testMatch: /.*\.electron\.spec\.ts/,

      // Electron tests require build, skip if not available
      grep: process.env.SKIP_ELECTRON ? /never-match/ : /.*/,
    },
  ],

  // Web server for Web-Chromium tests
  webServer: process.env.CI
    ? {
        command: 'npm run preview:web', // Production preview
        port: 4173,
        reuseExistingServer: false, // Always fresh server in CI
        timeout: 120000, // 2 minutes startup timeout
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : {
        command: 'npm run dev:web', // Dev server locally
        port: 5173,
        reuseExistingServer: true, // Reuse if already running
        timeout: 120000,
      },
});
```

### 1.2 Why Two Projects?

| Project | Purpose | Test Types | Build Required |
|---------|---------|------------|----------------|
| **Web-Chromium** | Visual regression, UI functionality | Snapshots, component tests | ✅ Yes (`npm run build:web`) |
| **Electron-App** | IPC, native features, startup | Integration tests | ✅ Yes (`npm run build`) |

### 1.3 Trace Configuration Deep Dive

```typescript
trace: 'on-first-retry'
```

**What this does:**
- ✅ **Normal test run**: No trace overhead
- ❌ **First failure**: Test retries automatically
- 📹 **During retry**: Captures full trace (video, DOM snapshots, network, console)
- 💾 **Result**: Rich debugging info **only if test actually fails**

**Trace contents:**
- Video recording of the retry attempt
- DOM snapshots at each step
- Network activity (XHR, fetch, WebSocket)
- Console logs and errors
- Timeline of actions

**Viewing traces:**
```bash
npx playwright show-trace test-results/trace.zip
```

---

## 2. Descriptive Error Pattern

### 2.1 The Problem with Generic Assertions

❌ **Bad - No context:**
```typescript
await expect(settingsButton).toBeVisible();
// Error: expect(locator).toBeVisible()
// ❓ Which button? Why is it important?
```

✅ **Good - Descriptive message:**
```typescript
await expect(settingsButton, 'Settings gear icon should be visible in top-right header after app loads').toBeVisible();
// Error: Settings gear icon should be visible in top-right header after app loads
// ✅ Immediately understand what broke and why
```

### 2.2 Soft Assertions for Multi-Step Validation

Use **soft assertions** when validating multiple related conditions:

```typescript
test('Token library modal displays all required sections', async ({ page }) => {
  // Open library
  await page.click('[data-testid="token-library-button"]');

  // Soft assertions - all will be checked even if one fails
  await expect.soft(
    page.locator('[data-testid="library-search"]'),
    'Library search input should appear at top of modal'
  ).toBeVisible();

  await expect.soft(
    page.locator('[data-testid="library-grid"]'),
    'Token grid should display below search bar'
  ).toBeVisible();

  await expect.soft(
    page.locator('[data-testid="library-upload-button"]'),
    'Upload button should be present for adding new tokens'
  ).toBeVisible();

  // Hard assertion at end - test fails if any soft assertion failed
  // But we get ALL failures, not just the first one
});
```

### 2.3 Custom Error Message Guidelines

**Format:** `[Component] should [expected behavior] [context]`

**Examples:**

| Scenario | Message |
|----------|---------|
| Button visibility | `'Primary action button should appear in bottom-right after map loads'` |
| Text content | `'Welcome message should display username after login completes'` |
| Navigation | `'URL should change to /campaign after clicking "New Campaign" button'` |
| State persistence | `'Token position should persist after page reload (auto-save verification)'` |
| Error handling | `'Error toast should appear with clear message when upload fails'` |

### 2.4 Test Naming Convention

```typescript
test.describe('Campaign Management', () => {
  test('should create new campaign with user-provided name', async ({ page }) => {
    // Test name becomes part of the error report
    // ✅ Clear what functionality is being tested
  });

  test('should auto-save campaign every 30 seconds', async ({ page }) => {
    // ✅ Describes expected behavior
  });

  test('should restore campaign from .hyle file upload', async ({ page }) => {
    // ✅ User story format
  });
});
```

---

## 3. Visual Testing & Bypass Strategy

### 3.1 The Challenge: Landing Page Gateway

The production web build includes a "Download Landing Page" that appears before the main app. This is problematic for visual testing because:

1. **Extra clicks**: Every test must navigate past the landing page
2. **Flakiness**: Landing page animations can cause timing issues
3. **Irrelevant snapshots**: We want to test the *app*, not the landing page

### 3.2 Solution: `beforeEach` Hook with State Injection

**Strategy:**
- Bypass the landing page by **injecting mock state** directly into `IndexedDB` and `localStorage`
- Simulate a "returning user" who has already dismissed the landing page
- Mock the `WebStorageService` state to preload test data

**Implementation:**

```typescript
// tests/helpers/bypassLandingPage.ts
export async function bypassLandingPageAndInjectState(page: Page) {
  // 1. Mock Electron APIs (for compatibility)
  await page.addInitScript(() => {
    window.ipcRenderer = {
      on: () => {},
      off: () => {},
      send: () => {},
      invoke: () => Promise.resolve({}),
    };

    window.themeAPI = {
      getThemeState: () => Promise.resolve({ mode: 'light', effectiveTheme: 'light' }),
      setThemeMode: () => Promise.resolve(),
      onThemeChanged: () => () => {},
    };
  });

  // 2. Inject IndexedDB state to skip onboarding
  await page.addInitScript(() => {
    // Mock IndexedDB with pre-configured state
    const request = indexedDB.open('hyle-storage', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains('autosave')) {
        db.createObjectStore('autosave', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('library')) {
        db.createObjectStore('library', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Insert mock campaign (simulates "returning user")
      const tx = db.transaction('autosave', 'readwrite');
      tx.objectStore('autosave').put({
        id: 'latest',
        campaign: {
          name: 'Test Campaign',
          maps: {},
          currentMapId: null,
          tokenLibrary: [],
        },
        timestamp: Date.now(),
      });
    };
  });

  // 3. Set localStorage flags
  await page.addInitScript(() => {
    localStorage.setItem('hyle-onboarding-completed', 'true');
    localStorage.setItem('hyle-theme', 'light'); // Consistent theme for snapshots
  });

  // 4. Navigate to app (landing page logic will detect "returning user" and skip)
  await page.goto('/');

  // 5. Wait for main app to render
  await page.waitForSelector('[data-testid="main-canvas"]', { timeout: 10000 });
}
```

**Usage in tests:**

```typescript
// tests/visual/campaign.visual.spec.ts
import { test, expect } from '@playwright/test';
import { bypassLandingPageAndInjectState } from '../helpers/bypassLandingPage';

test.describe('Campaign Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await bypassLandingPageAndInjectState(page);
  });

  test('Main canvas should render without UI elements overlapping', async ({ page }) => {
    await expect(page, 'Canvas should match baseline snapshot').toHaveScreenshot('main-canvas.png', {
      maxDiffPixels: 100, // Allow minor anti-aliasing differences
    });
  });
});
```

### 3.3 Snapshot Consistency Across Operating Systems

**Challenge:** Font rendering and anti-aliasing differ between macOS, Linux, and Windows.

**Solutions:**

#### Option A: Docker Container (Recommended for CI)

Run tests in a **Ubuntu Docker container** with standardized fonts:

```dockerfile
# .github/docker/Dockerfile.playwright
FROM mcr.microsoft.com/playwright:v1.57.0-jammy

# Install standardized fonts
RUN apt-get update && apt-get install -y \
  fonts-liberation \
  fonts-noto-color-emoji \
  fonts-roboto \
  && rm -rf /var/lib/apt/lists/*

# Set font configuration to disable hinting
RUN echo '<?xml version="1.0"?>' > /etc/fonts/local.conf && \
  echo '<!DOCTYPE fontconfig SYSTEM "fonts.dtd">' >> /etc/fonts/local.conf && \
  echo '<fontconfig>' >> /etc/fonts/local.conf && \
  echo '  <match target="font">' >> /etc/fonts/local.conf && \
  echo '    <edit mode="assign" name="hinting"><bool>false</bool></edit>' >> /etc/fonts/local.conf && \
  echo '    <edit mode="assign" name="hintstyle"><const>hintnone</const></edit>' >> /etc/fonts/local.conf && \
  echo '    <edit mode="assign" name="antialias"><bool>true</bool></edit>' >> /etc/fonts/local.conf && \
  echo '  </match>' >> /etc/fonts/local.conf && \
  echo '</fontconfig>' >> /etc/fonts/local.conf

WORKDIR /app
```

**CI Workflow:**
```yaml
- name: Run visual tests in Docker
  run: |
    docker build -t playwright-tests -f .github/docker/Dockerfile.playwright .
    docker run --rm -v $(pwd):/app playwright-tests npm run test:visual
```

#### Option B: CSS Font Standardization (Simpler)

Force specific web fonts to ensure consistency:

```css
/* tests/fixtures/test-fonts.css */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');

* {
  font-family: 'Roboto', sans-serif !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
}
```

Inject in `beforeEach`:
```typescript
await page.addStyleTag({ path: './tests/fixtures/test-fonts.css' });
```

### 3.4 Snapshot Update Workflow

**Updating snapshots after intentional UI changes:**

```bash
# Update all snapshots
npm run test:visual -- --update-snapshots

# Update specific test
npm run test:visual -- campaign.visual.spec.ts --update-snapshots

# Review changes in Git
git diff tests/**/*.png
```

**CI Policy:**
- ❌ Snapshots should **never** be updated automatically in CI
- ✅ Developers must update snapshots locally and commit them
- ✅ CI fails if snapshots don't match (forcing explicit review)

---

## 4. The Quality Gate (CI/CD)

### 4.1 GitHub Actions Workflow

**File:** `.github/workflows/e2e.yml`

```yaml
name: E2E Tests (Playwright)

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

# Cancel in-progress runs when new commit is pushed
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ===== JOB 1: Web Tests (Sharded) =====
  test-web:
    name: Web Tests (Shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
    runs-on: ubuntu-latest
    timeout-minutes: 20

    strategy:
      fail-fast: false # Run all shards even if one fails
      matrix:
        shardIndex: [1, 2, 3]
        shardTotal: [3]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build web app
        run: npm run build:web

      - name: Run Playwright tests (Web-Chromium)
        run: npx playwright test --project=Web-Chromium --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          CI: true

      - name: Upload test results (on failure)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-web-shard-${{ matrix.shardIndex }}
          path: playwright-report/
          retention-days: 7

      - name: Upload trace files (on failure)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces-web-shard-${{ matrix.shardIndex }}
          path: test-results/
          retention-days: 7

  # ===== JOB 2: Electron Tests (No Sharding) =====
  test-electron:
    name: Electron Tests
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build Electron app
        run: npm run build

      - name: Run Playwright tests (Electron-App)
        run: npx playwright test --project=Electron-App
        env:
          CI: true

      - name: Upload test results (on failure)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-electron
          path: playwright-report/
          retention-days: 7

      - name: Upload trace files (on failure)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces-electron
          path: test-results/
          retention-days: 7

  # ===== JOB 3: Merge Report (Optional) =====
  merge-reports:
    name: Merge Test Reports
    if: always()
    needs: [test-web, test-electron]
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Download all reports
        uses: actions/download-artifact@v4
        with:
          path: all-reports/

      - name: Merge HTML reports
        run: |
          npx playwright merge-reports --reporter html all-reports/playwright-report-*
        continue-on-error: true

      - name: Upload merged report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-merged
          path: playwright-report/
          retention-days: 14
```

### 4.2 Sharding Strategy

**Why shard?**
- 🚀 **Speed**: 3 shards run in parallel → 3x faster
- 💰 **Cost**: GitHub Actions has limited free minutes
- 🎯 **Focus**: Faster feedback on PRs

**How it works:**
```bash
# Shard 1 runs tests 1, 4, 7, 10, ...
npx playwright test --shard=1/3

# Shard 2 runs tests 2, 5, 8, 11, ...
npx playwright test --shard=2/3

# Shard 3 runs tests 3, 6, 9, 12, ...
npx playwright test --shard=3/3
```

**Adjusting shard count:**
- 📈 More tests? Increase `shardTotal: [4]` or `[5]`
- 📉 Fewer tests? Decrease to `[2]` or remove sharding

### 4.3 Artifact Upload Strategy

**Only upload on failure** to save storage:

```yaml
- name: Upload playwright-report (on failure)
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report-web-shard-${{ matrix.shardIndex }}
    path: playwright-report/
    retention-days: 7 # Auto-delete after 7 days
```

**What gets uploaded:**
- 📊 HTML report (`playwright-report/`)
- 📹 Trace files (`test-results/`)
- 📸 Screenshots (included in traces)

**Viewing artifacts:**
1. Go to failed workflow run
2. Scroll to "Artifacts" section at bottom
3. Download `playwright-report-web-shard-X.zip`
4. Unzip and open `index.html` in browser

---

## 5. Repository Setup & Enforcement

### 5.1 Required GitHub Repository Settings

Navigate to: **Settings → Branches → Branch Protection Rules → `main`**

#### ✅ Step-by-Step Configuration

1. **Click "Add rule"**
   - Branch name pattern: `main`

2. **Enable "Require status checks to pass before merging"**
   - ✅ Check this box
   - Search for and select:
     - `test-web (1, 3)` ← Web Tests Shard 1
     - `test-web (2, 3)` ← Web Tests Shard 2
     - `test-web (3, 3)` ← Web Tests Shard 3
     - `test-electron` ← Electron Tests

3. **Enable "Require branches to be up to date before merging"**
   - ✅ Check this box
   - Ensures tests run against latest `main` code

4. **Enable "Do not allow bypassing the above settings"**
   - ✅ Check this box
   - Prevents admins from force-merging broken code

5. **Enable "Require linear history"** (Optional but recommended)
   - ✅ Check this box
   - Prevents messy merge commits

6. **Click "Create" or "Save changes"**

### 5.2 Verification

**Test the protection:**

1. Create a test PR with a failing test:
   ```typescript
   test('intentional failure', async ({ page }) => {
     expect(true).toBe(false); // This will fail
   });
   ```

2. Push to PR branch
3. Check PR status page:
   - ❌ "Some checks were not successful"
   - 🚫 "Merge" button should be **disabled**

4. Fix the test and push again
5. Check PR status page:
   - ✅ "All checks have passed"
   - ✅ "Merge" button should be **enabled**

### 5.3 Optional: Auto-Comment on PR Failures

Add to workflow to post test results as PR comment:

```yaml
# Add to test-web job after tests run
- name: Comment on PR with results
  if: failure() && github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const fs = require('fs');
      const results = fs.existsSync('test-results/results.json')
        ? JSON.parse(fs.readFileSync('test-results/results.json', 'utf8'))
        : null;

      const comment = results
        ? `## ❌ Playwright Tests Failed\n\n**Failed Tests:** ${results.failed}\n\n[View full report](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID})`
        : '## ❌ Playwright Tests Failed\n\nCheck the workflow logs for details.';

      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: comment
      });
```

---

## 6. Testing Best Practices

### 6.1 Test Organization

```
tests/
├── visual/
│   ├── campaign.visual.spec.ts       # Campaign UI snapshots
│   ├── token-library.visual.spec.ts  # Library modal snapshots
│   └── settings.visual.spec.ts       # Settings panel snapshots
├── electron/
│   ├── startup.electron.spec.ts      # App launch tests
│   ├── ipc.electron.spec.ts          # IPC communication tests
│   └── native-dialogs.electron.spec.ts
├── integration/
│   ├── campaign-workflow.spec.ts     # Full user workflows
│   └── token-drag-drop.spec.ts       # Multi-user sync tests
├── helpers/
│   ├── bypassLandingPage.ts          # State injection utilities
│   ├── mockElectronAPIs.ts           # API mocks
│   └── testFixtures.ts               # Reusable test data
└── accessibility.spec.ts             # WCAG compliance (existing)
```

### 6.2 Page Object Model (POM)

**Avoid test duplication** by extracting common interactions:

```typescript
// tests/pages/CampaignPage.ts
export class CampaignPage {
  constructor(private page: Page) {}

  async createNewCampaign(name: string) {
    await this.page.click('[data-testid="new-campaign-button"]');
    await this.page.fill('[data-testid="campaign-name-input"]', name);
    await this.page.click('[data-testid="create-button"]');
  }

  async openTokenLibrary() {
    await this.page.click('[data-testid="token-library-button"]');
    await expect(
      this.page.locator('[data-testid="library-modal"]'),
      'Token library modal should open after clicking library button'
    ).toBeVisible();
  }
}

// Usage in tests
test('should create campaign and add token', async ({ page }) => {
  const campaign = new CampaignPage(page);
  await campaign.createNewCampaign('Adventure #1');
  await campaign.openTokenLibrary();
  // ... rest of test
});
```

### 6.3 Test Data Management

**Use fixtures for consistent test data:**

```typescript
// tests/helpers/testFixtures.ts
export const TEST_CAMPAIGNS = {
  empty: {
    name: 'Empty Campaign',
    maps: {},
    currentMapId: null,
    tokenLibrary: [],
  },
  withTokens: {
    name: 'Campaign with Tokens',
    maps: {
      'map-1': {
        id: 'map-1',
        name: 'Test Map',
        tokens: [
          { id: 'token-1', src: '/test-assets/hero.webp', x: 100, y: 100 },
        ],
      },
    },
    currentMapId: 'map-1',
    tokenLibrary: [
      { id: 'lib-1', name: 'Hero Token', src: '/test-assets/hero.webp' },
    ],
  },
};

// Usage
import { TEST_CAMPAIGNS } from '../helpers/testFixtures';

test.beforeEach(async ({ page }) => {
  await injectCampaignState(page, TEST_CAMPAIGNS.withTokens);
});
```

### 6.4 Visual Snapshot Naming Convention

```typescript
// ❌ Bad - generic name
await expect(page).toHaveScreenshot('screenshot-1.png');

// ✅ Good - descriptive name
await expect(page).toHaveScreenshot('campaign-empty-state-light-theme.png');

// ✅ Good - component-specific
await expect(modal).toHaveScreenshot('token-library-modal-with-10-items.png');

// ✅ Good - state-specific
await expect(page).toHaveScreenshot('settings-panel-dark-theme-expanded.png');
```

### 6.5 Handling Flaky Tests

**Common causes and solutions:**

| Issue | Solution |
|-------|----------|
| Animation timing | Use `page.waitForLoadState('networkidle')` |
| Font loading | Inject CSS to preload fonts |
| Hover effects | Force element state: `page.locator('button').evaluate(el => el.classList.add('hover'))` |
| Async state updates | Use `page.waitForFunction()` with specific condition |
| Canvas rendering | Wait for specific canvas state, not just visibility |

---

## Summary Checklist

Before going live with this strategy, ensure:

- ✅ `playwright.config.ts` defines both `Web-Chromium` and `Electron-App` projects
- ✅ All tests use descriptive error messages
- ✅ `beforeEach` hooks inject state to bypass landing page
- ✅ `.github/workflows/e2e.yml` configured with sharding
- ✅ Branch protection rules enabled on `main` branch
- ✅ Team trained on snapshot update workflow
- ✅ Test failure artifacts are reviewed in PR comments

---

## Next Steps

**Ready to proceed?**

1. **Review this document** and provide feedback
2. **Generate actual files:**
   - Updated `playwright.config.ts`
   - New `.github/workflows/e2e.yml`
   - Helper utilities (`bypassLandingPage.ts`)
3. **Write initial test suite** (visual + Electron integration)
4. **Configure GitHub repository** (branch protection)
5. **Test the workflow** with a sample PR

---

**Document Version:** 1.0
**Last Updated:** 2025-12-28
**Author:** QA Automation Architect (via Claude Code)
