# agent-platform-workflow-layout

## What this is
A single-file, dependency-free browser tool that fixes the canvas layout of Optimizely Opal workflow agents. It takes a pasted Opal workflow JSON export and returns the same JSON with `agent_metadata.nodes` and `agent_metadata.edges` rebuilt so the workflow renders cleanly in the Opal UI (no overlapping nodes, no tangled edges).

See `application.md` for the full specification: JSON schema, layout algorithm details, Axiom design system tokens, behavioural contract, security requirements, and known unknowns.

## Files
- `index.html` — the entire tool (engine + UI + styles, all inline, no dependencies), served as the Cloudflare Pages root
- `application.md` — full application spec and history (written by Claude chat)

## Hosting
- **Cloudflare Pages project:** `workflow-layout`
- **Production URL:** https://workflow-layout.pages.dev
- **Custom domain:** workflow-layout.davidknipe.com (configured in Cloudflare dashboard)
- **GitHub repo:** https://github.com/davidknipe/agent-platform-workflow-layout
- **Cloudflare account:** knipey@me.com

## Deployment
Connected to GitHub — every push to `main` auto-deploys via Cloudflare Pages.
No build step (static HTML only). Build output directory: `.`

## To deploy changes
1. Edit `index.html`
2. Commit and push to `main` — Cloudflare deploys automatically
