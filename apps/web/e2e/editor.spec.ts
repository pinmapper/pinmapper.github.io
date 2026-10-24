import { expect, test } from '@playwright/test'

const shot = (name: string) => ({ path: `test-results/screens/${test.info().project.name}-${name}.png` })

test('create a VGA map, label pins, and keep them after reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Label connector pins, not scraps of paper.')).toBeVisible()
  await page.screenshot(shot('1-home-empty'))

  await page.getByRole('link', { name: 'New pin map' }).click()
  await page.getByRole('searchbox', { name: 'Search connectors' }).fill('vga')
  await page.screenshot(shot('2-picker'))
  await page.getByRole('button', { name: /DE-15 \(VGA\)/ }).click()

  await page.getByRole('radio', { name: 'Female (sockets)' }).click()
  await expect(page.getByRole('radio', { name: 'Female (sockets)' })).toBeChecked()
  await page.getByRole('combobox').selectOption({ label: 'VGA' })
  await page.screenshot(shot('3-create'))
  await page.getByRole('button', { name: 'Create map' }).click()

  await expect(page.getByText('of 15 pins labelled')).toBeVisible()
  await expect(page.getByText('Front · mating face')).toBeVisible()
  await page.screenshot(shot('4-editor'))

  // Tap pin 5 (preset says GND) and relabel it with a wire colour.
  await page.locator('[data-pin-id="5"]').click()
  const signal = page.getByLabel('Signal / label')
  await expect(signal).toHaveValue('GND')
  await signal.fill('GND shield')
  await page.getByRole('radio', { name: 'Black' }).click()
  await page.getByRole('radio', { name: /OK/ }).click()
  await page.screenshot(shot('5-pin-sheet'))
  await signal.press('Enter')
  await expect(page.getByText('Pin 6', { exact: true })).toBeVisible()

  await page.getByRole('radio', { name: 'Rear' }).click()
  await expect(page.getByText('Rear · wire side')).toBeVisible()
  await page.getByRole('button', { name: 'Close pin editor' }).click()
  await page.getByRole('button', { name: 'Show signal names on pins' }).click()
  await page.screenshot(shot('6-rear-signals'))

  // Autosave is debounced; give it a moment, then reload.
  await page.waitForTimeout(600)
  await page.reload()
  await page.getByRole('radio', { name: 'Table' }).click()
  await expect(page.getByText('GND shield')).toBeVisible()
  await expect(page.getByText('Rear · wire side')).toHaveCount(0) // table view hides the badge
  await page.screenshot(shot('7-table'))

  await page.goto('/')
  await expect(page.getByText('DE-15 (VGA) · Female (sockets)')).toBeVisible()
  await page.screenshot(shot('8-home-list'))
})
