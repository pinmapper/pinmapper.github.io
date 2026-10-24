import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const out = (name: string) => `test-results/exports/${test.info().project.name}-${name}`

async function createSerialMap(page: Page) {
  await page.goto('/new')
  await page.getByRole('searchbox', { name: 'Search connectors' }).fill('serial')
  await page.getByRole('button', { name: /^DE-9/ }).click()
  await page.getByRole('combobox').selectOption({ label: 'RS-232 (DTE)' })
  await page.getByLabel('Name (optional)').fill('Rack 3 / PLC-2 COM')
  await page.getByRole('button', { name: 'Create map' }).click()
  await page.locator('[data-pin-id="2"]').click()
  await page.getByRole('radio', { name: 'Red' }).click()
  await page.getByRole('radio', { name: /OK/ }).click()
  await page.getByRole('button', { name: 'Add note' }).click()
  await page.getByLabel('Notes').fill('Goes to terminal X1:4, checked with meter')
  await page.getByRole('button', { name: 'Close pin editor' }).click()
}

async function exportAs(page: Page, label: string) {
  await page.getByRole('button', { name: 'Export and share' }).click()
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).click()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download' }).click()
  const d = await download
  return d
}

test('export image, PDF and CSV', async ({ page }) => {
  await createSerialMap(page)

  const png = await exportAs(page, 'Image')
  await expect(page.getByAltText('Export preview')).toBeVisible()
  expect(png.suggestedFilename()).toBe('rack-3-plc-2-com.png')
  await png.saveAs(out('sheet.png'))
  await page.screenshot({ path: out('export-sheet-ui.png') })

  await page.getByRole('button', { name: 'Other format' }).click()
  await page.getByRole('button', { name: /^PDF/ }).click()
  const pdfDl = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download' }).click()
  const pdf = await pdfDl
  expect(pdf.suggestedFilename()).toBe('rack-3-plc-2-com.pdf')
  await pdf.saveAs(out('sheet.pdf'))
  expect((await readFile(out('sheet.pdf'))).subarray(0, 5).toString()).toBe('%PDF-')

  await page.getByRole('button', { name: 'Other format' }).click()
  await page.getByRole('button', { name: /^Spreadsheet/ }).click()
  const csvDl = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download' }).click()
  await (await csvDl).saveAs(out('sheet.csv'))
  const csv = await readFile(out('sheet.csv'), 'utf8')
  expect(csv).toContain('2,RXD,RD,Red,OK,"Goes to terminal X1:4, checked with meter"')
})

test('back up, delete and restore maps', async ({ page }) => {
  await createSerialMap(page)
  await page.getByRole('button', { name: 'Back to all maps' }).click()

  await page.getByRole('button', { name: 'Backup and restore' }).click()
  await page.getByRole('button', { name: 'Back up 1 map' }).click()
  const dl = page.waitForEvent('download')
  await page.getByRole('button', { name: /^Download pinmapper-backup/ }).click()
  await (await dl).saveAs(out('backup.json'))
  await page.keyboard.press('Escape')

  await page.getByRole('link', { name: /Rack 3 \/ PLC-2 COM/ }).click()
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'More actions' }).click()
  await page.getByRole('button', { name: 'Delete map' }).click()
  await expect(page.getByText('Label connector pins, not scraps of paper.')).toBeVisible()

  await page.getByRole('button', { name: 'Backup and restore' }).click()
  await page.getByLabel('Backup file to restore').setInputFiles(out('backup.json'))
  await expect(page.getByRole('status')).toHaveText('1 map added')
  await page.screenshot({ path: out('restore.png') })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('link', { name: /Rack 3 \/ PLC-2 COM/ })).toBeVisible()
})
