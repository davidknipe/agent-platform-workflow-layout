# agent-platform-workflow-layout

## What this is
A static HTML prototype for an Optimizely agent platform workflow layout UI.

## Files
- `opal-workflow-layout.html` — the main design file (source of truth)
- `index.html` — copy of the above, served as the Cloudflare Pages root

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
1. Edit `opal-workflow-layout.html`
2. Copy to `index.html`: `cp opal-workflow-layout.html index.html`
3. Commit and push to `main` — Cloudflare deploys automatically
