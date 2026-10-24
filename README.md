# PinMapper

Label connector pins and wires from your phone instead of on paper. Pick a connector (DE-9, VGA, PS/2, RJ45, OBD-II…), tap a pin, and record its signal, wire colour and status.

**Live:** https://pinmapper.github.io

- Mobile first: large tap targets, pinch-zoom diagram, a "Next pin" flow for quick entry
- Front (mating face) and rear (wire side) views, with male/female mirroring handled for you
- Standard pinouts built in (RS-232, VGA, PS/2, USB, USB-C, T568A/B, RJ11, OBD-II, parallel port…)
- IDC and pin headers in any size, plus a custom grid/circular builder for anything else
- Export a map as an image, PDF or CSV and send it through the phone's share sheet
- Back up all maps to a file and restore them on another device
- Works offline; maps are stored on the device (IndexedDB)

## Development

Requires Node 24.

```sh
npm install
npm run dev          # http://localhost:5173 (add --host to try it on your phone over LAN)
npm test             # unit tests (connector geometry, schemas)
npm run e2e -w @pinmapper/web   # Playwright on Pixel / iPhone viewports
npm run lint && npm run typecheck
```

## Layout

```
apps/web          React + Vite + Tailwind site (deployed to GitHub Pages)
packages/shared   Connector library, pin-map schemas and wire colours, shared with the future API
```

### Adding a connector

Connectors are data. Add a `defineConnector({...})` in `packages/shared/src/connectors/` with pin coordinates
(roughly mm) drawn as seen on the mating face of `refGender`, then add it to `CATALOG` in `connectors/index.ts`.
Sized connectors (headers, the custom grid/circular builders) are a `ConnectorDef` with `params` and a `build()`
function; the chosen params are stored on each map.
The unit tests build every catalog entry at its default, minimum and maximum sizes and check that pin ids are
unique, everything fits in the view box, and tap areas don't overlap.

Only add a fixed connector when its pin 1 position is confirmed by a datasheet; otherwise the custom builders
let technicians match their own part.

## Deploying

Pushing to `main` runs lint, typecheck, unit tests and e2e tests, then publishes `apps/web/dist` to GitHub Pages.
One-time setup: in the `pinmapper.github.io` repo, go to **Settings → Pages → Source** and choose **GitHub Actions**.
