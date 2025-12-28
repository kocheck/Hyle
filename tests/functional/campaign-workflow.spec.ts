/**
 * Campaign Workflow Functional Tests
 *
 * Tests core campaign management workflows:
 * - Creating new campaigns
 * - Adding maps and tokens
 * - Exporting and importing campaigns
 *
 * These tests focus on BEHAVIOR, not appearance.
 * They should survive UI redesigns.
 */

import { test, expect } from '@playwright/test';
import { bypassLandingPageAndInjectState } from '../helpers/bypassLandingPage';
import { createNewCampaign, exportCampaign, importCampaign } from '../helpers/campaignHelpers';

test.describe('Campaign Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass landing page and start with empty campaign
    await bypassLandingPageAndInjectState(page);
  });

  test('should create new campaign with user-provided name', async ({ page }) => {
    // Create campaign
    await createNewCampaign(page, 'Epic Adventure');

    // Verify campaign was created
    await expect(
      page.locator('[data-testid="main-canvas"]'),
      'Main canvas should be visible after campaign creation'
    ).toBeVisible();

    // Verify campaign name appears in UI
    await expect(
      page.locator('[data-testid="campaign-title"]'),
      'Campaign title should display the user-provided name'
    ).toHaveText('Epic Adventure');
  });

  test('should allow updating campaign name', async ({ page }) => {
    // Create initial campaign
    await createNewCampaign(page, 'Initial Name');

    // Open campaign settings/edit
    await page.click('[data-testid="edit-campaign-button"]');

    // Update name
    const nameInput = page.locator('[data-testid="campaign-name-input"]');
    await nameInput.clear();
    await nameInput.fill('Updated Name');
    await page.click('[data-testid="save-campaign-name"]');

    // Verify name updated
    await expect(
      page.locator('[data-testid="campaign-title"]'),
      'Campaign title should reflect the updated name'
    ).toHaveText('Updated Name');
  });

  test('should preserve campaign data through export/import cycle', async ({ page }) => {
    // Create campaign with specific name
    await createNewCampaign(page, 'Export Test Campaign');

    // Export campaign
    const downloadPath = await exportCampaign(page);
    expect(downloadPath, 'Campaign should download successfully').toBeTruthy();

    // Clear current state (simulate fresh session)
    await page.evaluate(() => {
      localStorage.clear();
      return indexedDB.deleteDatabase('hyle-storage');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Import campaign
    await importCampaign(page, downloadPath);

    // Verify campaign was restored
    await expect(
      page.locator('[data-testid="campaign-title"]'),
      'Campaign name should be preserved after export/import'
    ).toHaveText('Export Test Campaign');
  });

  test('should show empty state when no maps exist', async ({ page }) => {
    // Create new campaign (no maps)
    await createNewCampaign(page, 'Empty Campaign');

    // Verify empty state is shown
    await expect(
      page.locator('[data-testid="empty-map-state"]'),
      'Empty state message should appear when no maps exist'
    ).toBeVisible();

    // Verify call-to-action is present
    await expect(
      page.locator('[data-testid="add-first-map-button"]'),
      'Add first map button should be visible in empty state'
    ).toBeVisible();
  });

  test('should navigate between multiple maps', async ({ page }) => {
    // Note: This test assumes you have test assets
    // You may need to adjust based on your actual implementation

    // Create campaign
    await createNewCampaign(page, 'Multi-Map Campaign');

    // Add first map
    // await addMapBackground(page, './test-assets/dungeon.webp');

    // Add second map
    // await addMapBackground(page, './test-assets/tavern.webp');

    // Verify map count
    const mapTabs = page.locator('[data-testid^="map-tab-"]');
    await expect(
      mapTabs,
      'Should have 2 map tabs after adding 2 maps'
    ).toHaveCount(2);

    // Switch to second map
    await page.click('[data-testid="map-tab-1"]');

    // Verify active map changed
    const activeMapTab = page.locator('[data-testid="map-tab-1"][aria-selected="true"]');
    await expect(
      activeMapTab,
      'Second map tab should be marked as active'
    ).toBeVisible();
  });

  test('should delete campaign and return to home', async ({ page }) => {
    // Create campaign
    await createNewCampaign(page, 'To Be Deleted');

    // Open campaign menu
    await page.click('[data-testid="campaign-menu-button"]');

    // Click delete
    await page.click('[data-testid="delete-campaign-button"]');

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify returned to home/campaign list
    await expect(
      page.locator('[data-testid="campaign-list"]'),
      'Should return to campaign list after deletion'
    ).toBeVisible();

    // Verify campaign no longer exists
    const deletedCampaign = page.locator('[data-testid="campaign-card"]', {
      hasText: 'To Be Deleted',
    });
    await expect(
      deletedCampaign,
      'Deleted campaign should not appear in campaign list'
    ).toHaveCount(0);
  });
});

test.describe('Campaign Creation Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await bypassLandingPageAndInjectState(page);
  });

  test('should handle empty campaign name gracefully', async ({ page }) => {
    // Click new campaign
    await page.click('[data-testid="new-campaign-button"]');

    // Try to submit without name
    await page.click('[data-testid="create-campaign-submit"]');

    // Verify validation error
    await expect(
      page.locator('[data-testid="campaign-name-error"]'),
      'Validation error should appear for empty campaign name'
    ).toBeVisible();

    // Verify campaign was not created
    const mainCanvas = page.locator('[data-testid="main-canvas"]');
    await expect(
      mainCanvas,
      'Main canvas should not appear when validation fails'
    ).toHaveCount(0);
  });

  test('should handle very long campaign names', async ({ page }) => {
    const longName = 'A'.repeat(200); // 200 character name

    // Create campaign with long name
    await page.click('[data-testid="new-campaign-button"]');
    await page.fill('[data-testid="campaign-name-input"]', longName);
    await page.click('[data-testid="create-campaign-submit"]');

    // Verify campaign created (or truncated appropriately)
    await expect(
      page.locator('[data-testid="main-canvas"]'),
      'Main canvas should appear even with long campaign name'
    ).toBeVisible();

    // Verify name is displayed (may be truncated)
    const titleText = await page.locator('[data-testid="campaign-title"]').textContent();
    expect(
      titleText,
      'Campaign title should display at least part of the long name'
    ).toBeTruthy();
  });

  test('should handle special characters in campaign name', async ({ page }) => {
    const specialName = 'Campaign #1: "The Dragon\'s Lair" & More!';

    // Create campaign with special characters
    await createNewCampaign(page, specialName);

    // Verify special characters are preserved
    await expect(
      page.locator('[data-testid="campaign-title"]'),
      'Special characters should be preserved in campaign name'
    ).toHaveText(specialName);
  });
});
