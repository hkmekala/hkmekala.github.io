# hkmekala.github.io

Personal site for Harikrishna Mekala, live at [hkmekala.me](https://hkmekala.me).

It has two ways in:

- **The 3D world.** You steer a panda in a hover pod around a floating circuit board. Each glowing ring is one job. Roll in to read about it, collect the tech chips, knock things over.
- **The résumé view.** A normal scrolling page with the same content, for phones, recruiters and anyone in a hurry. Link straight to it with `/#resume`.

## Run it

```bash
npm install
npm run dev
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Type-check, then build to `dist/` |
| `npm run deploy` | Build and publish `dist/` to the `gh-pages` branch |

GitHub Pages serves the `gh-pages` branch, so merging to `master` does not publish by itself. Run `npm run deploy` after merging.

## Change the content

Everything you read on the site comes from `src/data/config.json`. Edit a job there and both views update.

Adding a new job needs one more step: give it a stop in the `STOPS` list in `src/data/site.ts` (position on the board, colour, and which landmark to build).

## Layout

```
index.html            page shell: intro screen, HUD, résumé container
src/main.ts           boot and switching between intro / world / résumé
src/data/             content (config.json) and the zone map (site.ts)
src/world/            the 3D world: physics, player, landmarks, tokens
src/ui/               HUD and small DOM helpers
src/plain/            the résumé view and its scroll animations
public/               static files, including CNAME for the custom domain
```

Built with Vite, TypeScript, three.js, cannon-es and GSAP. The cover and mascot images were generated with Higgsfield.
