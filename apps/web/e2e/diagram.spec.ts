import { expect, test, type Page } from '@playwright/test'

async function createMap(page: Page, search: string, card: RegExp) {
  await page.goto('/new')
  await page.getByRole('searchbox', { name: 'Search connectors' }).fill(search)
  await page.getByRole('button', { name: card }).click()
  await page.getByRole('button', { name: 'Create map' }).click()
  await expect(page.getByText(/pins labelled/)).toBeVisible()
}

/**
 * Screenshot each pin and find the bounding box of its bright label pixels, so
 * the check measures what is actually drawn (font metrics differ by engine).
 */
async function inkOffsets(page: Page) {
  const shapes = page.locator('main svg').first().locator('g:has(> [data-pin-id]) > :is(circle, rect):first-of-type')
  const results: { id: number; dx: number; dy: number; size: number }[] = []
  for (let i = 0; i < (await shapes.count()); i++) {
    const png = (await shapes.nth(i).screenshot()).toString('base64')
    const ink = await page.evaluate(async (b64) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const { data } = ctx.getImageData(0, 0, c.width, c.height)
      let minX = c.width, minY = c.height, maxX = -1, maxY = -1
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++) {
          const k = (y * c.width + x) * 4
          if (0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2] > 200) {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x)
            minY = Math.min(minY, y); maxY = Math.max(maxY, y)
          }
        }
      return { cx: (minX + maxX + 1) / 2, cy: (minY + maxY + 1) / 2, w: c.width, h: c.height, inkH: maxY - minY + 1 }
    }, png)
    results.push({ id: i, dx: (ink.cx - ink.w / 2) / ink.w, dy: (ink.cy - ink.h / 2) / ink.h, size: ink.inkH })
  }
  return results
}

for (const [name, search, card] of [
  ['DE-9', 'serial', /^DE-9/],
  ['USB-C', 'usb-c', /^USB-C/],
  ['RJ45', 'rj45', /^RJ45/],
] as const) {
  test(`${name}: pin numbers are centred and the same size`, async ({ page }) => {
    await createMap(page, search, card)
    const sizes = await page.locator('main text.pm-pin-label').evaluateAll((els) => els.map((e) => e.getAttribute('font-size')))
    expect(new Set(sizes).size).toBe(1)

    for (const p of await inkOffsets(page)) {
      // Within 6% of the pin's size, i.e. about 2 px on a phone.
      expect.soft(Math.abs(p.dx), `pin #${p.id} horizontal offset`).toBeLessThan(0.06)
      expect.soft(Math.abs(p.dy), `pin #${p.id} vertical offset`).toBeLessThan(0.06)
    }
    await page.screenshot({ path: `test-results/screens/${test.info().project.name}-labels-${name}.png` })
  })
}
