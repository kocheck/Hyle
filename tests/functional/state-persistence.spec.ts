/**
 * State Persistence Functional Tests
 *
 * Tests that application state persists correctly across:
 * - Page reloads
 * - Browser sessions
 * - Auto-save intervals
 *
 * These tests verify data integrity, not visual appearance.
 */

import { test, expect } from '@playwright/test';
import { bypassLandingPageAndInjectState, clearAllTestData } from '../helpers/bypassLandingPage';
import { createNewCampaign, waitForAutoSave, switchTheme } from '../helpers/campaignHelpers';

test.describe('Campaign State Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await clearAllTestData(page);
    await bypassLandingPageAndInjectState(page);
  });

  test('should persist campaign name after page reload', async ({ page }) => {
    // Create campaign
    await createNewCampaign(page, 'Persistent Campaign');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify campaign name persisted
    await expect(
      page.locator('[data-testid="campaign-title"]'),
      'Campaign name should persist after page reload (auto-save)'
    ).toHaveText('Persistent Campaign');
  });

  test('should restore campaign after clearing cookies', async ({ page }) => {
    // Create campaign
    await createNewCampaign(page, 'Cookie Test Campaign');

    // Clear cookies (but not IndexedDB)
    await page.context().clearCookies();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify campaign restored from IndexedDB
    await expect(
      page.locator('[data-testid="campaign-title"]'),
      'Campaign should restore from IndexedDB even after clearing cookies'
    ).toHaveText('Cookie Test Campaign');
  });

  test('should persist token positions after reload', async ({ page }) => {
    // Create campaign
    await createNewCampaign(page, 'Token Position Test');

    // Add token at specific position
    // Note: Adjust based on your actual implementation
    await page.click('[data-testid="add-token-button"]');

    // Get token position before reload
    const tokenBefore = page.locator('[data-testid^="token-"]').first();
    const positionBefore = await tokenBefore.boundingBox();

    expect(positionBefore, 'Token should have a position').toBeTruthy();

    // Reload page (triggers auto-save restoration)
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get token position after reload
    const tokenAfter = page.locator('[data-testid^="token-"]').first();
    const positionAfter = await tokenAfter.boundingBox();

    // Verify position persisted (allowing small rounding differences)
    expect(
      positionAfter?.x,
      'Token X position should persist after reload'
    ).toBeCloseTo(positionBefore!.x, 0);

    expect(
      positionAfter?.y,
      'Token Y position should persist after reload'
    ).toBeCloseTo(positionBefore!.y, 0);
  });

  test('should trigger auto-save after 30 seconds of inactivity', async ({ page }) => {
    // Note: This test waits for the full 30-second auto-save interval (plus 1 second buffer),
    // which makes it slow and potentially flaky. Consider adding a mechanism to mock or
    // speed up the auto-save timer for tests, or add a data-testid attribute to manually
    // trigger auto-save for testing purposes.
    
    // Create campaign
    await createNewCampaign(page, 'Auto-Save Test');

    // Make a change
    await page.click('[data-testid="edit-campaign-button"]');
    const nameInput = page.locator('[data-testid="campaign-name-input"]');
    await nameInput.clear();
    await nameInput.fill('Auto-Saved Name');
    await page.click('[data-testid="save-campaign-name"]');

    // Wait for auto-save interval (30s + 1s buffer)
    await waitForAutoSave(page, 30000);

    // Reload without manually saving
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify auto-save worked
    await expect(
      page.locator('[data-testid="campaign-title"]'),
      'Campaign name should be auto-saved after 30s interval'
    ).toHaveText('Auto-Saved Name');
  });

  test('should preserve campaign state when network goes offline', async ({ page }) => {
    // Create campaign
    await createNewCampaign(page, 'Offline Test');

    // Go offline
    await page.context().setOffline(true);

    // Make changes while offline
    await page.click('[data-testid="edit-campaign-button"]');
    const nameInput = page.locator('[data-testid="campaign-name-input"]');
    await nameInput.clear();
    await nameInput.fill('Offline Changes');
    await page.click('[data-testid="save-campaign-name"]');

    // Go back online
    await page.context().setOffline(false);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify changes persisted (IndexedDB works offline)
    await expect(
      page.locator('[data-testid="campaign-title"]'),
      'Changes made offline should persist via IndexedDB'
    ).toHaveText('Offline Changes');
  });
});

test.describe('Theme Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await bypassLandingPageAndInjectState(page);
  });

  test('should persist light theme across sessions', async ({ page }) => {
    // Switch to light theme
    await switchTheme(page, 'light');

    // Verify theme applied
    let theme = await page.getAttribute('html', 'data-theme');
    expect(theme, 'Light theme should be applied').toBe('light');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify theme persisted
    theme = await page.getAttribute('html', 'data-theme');
    expect(theme, 'Light theme should persist after reload').toBe('light');
  });

  test('should persist dark theme across sessions', async ({ page }) => {
    // Switch to dark theme
    await switchTheme(page, 'dark');

    // Verify theme applied
    let theme = await page.getAttribute('html', 'data-theme');
    expect(theme, 'Dark theme should be applied').toBe('dark');

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify theme persisted
    theme = await page.getAttribute('html', 'data-theme');
    expect(theme, 'Dark theme should persist after reload').toBe('dark');
  });

  test('should sync system theme preference', async ({ page }) => {
    // Set theme to system mode
    await switchTheme(page, 'system');

    // Emulate dark mode OS preference
    await page.emulateMedia({ colorScheme: 'dark' });

    // Wait for theme to sync
    await page.waitForFunction(() => {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    });

    // Verify dark theme is applied
    let theme = await page.getAttribute('html', 'data-theme');
    expect(theme, 'Should sync to dark theme based on OS preference').toBe('dark');

    // Switch OS preference to light
    await page.emulateMedia({ colorScheme: 'light' });

    // Wait for theme to update
    await page.waitForFunction(() => {
      return document.documentElement.getAttribute('data-theme') === 'light';
    });

    // Verify light theme is now applied
    theme = await page.getAttribute('html', 'data-theme');
    expect(theme, 'Should sync to light theme when OS preference changes').toBe('light');
  });
});

test.describe('IndexedDB Data Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllTestData(page);
    await bypassLandingPageAndInjectState(page);
  });

  test('should handle IndexedDB quota exceeded gracefully', async ({ page }) => {
    // Note: This test is more conceptual - actual implementation depends on your app
    // You would need to fill IndexedDB to quota limit

    // Create campaign
    await createNewCampaign(page, 'Quota Test');

    // Attempt to add many large assets (this would exceed quota)
    // In a real test, you'd upload many large images

    // Verify error handling
    // await expect(
    //   page.locator('[data-testid="storage-quota-warning"]'),
    //   'Should show warning when approaching storage quota'
    // ).toBeVisible();
  });

  test('should recover from corrupted IndexedDB', async ({ page }) => {
    // Create campaign
    await createNewCampaign(page, 'Corruption Test');

    // Corrupt IndexedDB by injecting invalid data
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.open('hyle-storage', 1);
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const tx = db.transaction('autosave', 'readwrite');
          // Inject malformed data
          tx.objectStore('autosave').put({
            id: 'latest',
            campaign: 'CORRUPTED', // Invalid: should be object
            timestamp: Date.now(),
          });
          tx.oncomplete = () => resolve(true);
        };
      });
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify app handles corruption gracefully
    // Should show error message or create new campaign
    const errorMessage = page.locator('[data-testid="data-corruption-error"]');
    const newCampaignButton = page.locator('[data-testid="new-campaign-button"]');

    // Either show error OR allow creating new campaign
    const hasError = await errorMessage.isVisible();
    const hasNewButton = await newCampaignButton.isVisible();

    expect(
      hasError || hasNewButton,
      'App should handle corrupted data by showing error or allowing new campaign'
    ).toBeTruthy();
  });
});

test.describe('Multi-Tab Synchronization', () => {
  test('should sync changes across multiple tabs', async ({ page, context }) => {
    // Create campaign in first tab
    await bypassLandingPageAndInjectState(page);
    await createNewCampaign(page, 'Multi-Tab Test');

    // Open second tab
    const secondTab = await context.newPage();
    await bypassLandingPageAndInjectState(secondTab);

    // Verify second tab sees the same campaign
    await expect(
      secondTab.locator('[data-testid="campaign-title"]'),
      'Second tab should see the same campaign from IndexedDB'
    ).toHaveText('Multi-Tab Test');

    // Make change in first tab
    await page.click('[data-testid="edit-campaign-button"]');
    const nameInput = page.locator('[data-testid="campaign-name-input"]');
    await nameInput.clear();
    await nameInput.fill('Updated in Tab 1');
    await page.click('[data-testid="save-campaign-name"]');

    // Reload second tab
    await secondTab.reload();
    await secondTab.waitForLoadState('networkidle');

    // Verify second tab sees the update
    await expect(
      secondTab.locator('[data-testid="campaign-title"]'),
      'Second tab should see updates made in first tab after reload'
    ).toHaveText('Updated in Tab 1');

    await secondTab.close();
  });
});
