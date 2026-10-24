# PinMapper

Label connector pins and wires from your phone instead of on paper. Pick a connector (DE-9, VGA, PS/2, RJ45, OBD-II…), tap a pin, and record its signal, wire colour and status.

**Live:** https://pinmapper.github.io

- Mobile first: large tap targets, pinch-zoom diagram, a "Next pin" flow for quick entry
- Front (mating face) and rear (wire side) views, with male/female mirroring handled for you
- Standard pinouts built in (RS-232, VGA, PS/2, T568A/B, OBD-II, parallel port…)
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
(roughly mm) drawn as seen on the mating face of `refGender`, then register it in `connectors/index.ts`.
The unit tests check that pin ids are unique, everything fits in the view box, and tap areas don't overlap.

## Deploying

Pushing to `main` runs lint, typecheck, unit tests and e2e tests, then publishes `apps/web/dist` to GitHub Pages.
One-time setup: in the `pinmapper.github.io` repo, go to **Settings → Pages → Source** and choose **GitHub Actions**.
