# CLAUDE.md

## What this project is

A single-file, dependency-free browser tool that tidies the canvas layout of Optimizely Opal workflow agents. Opal workflow exports are JSON; when the `agent_metadata` block is missing or messy, the Opal UI renders nodes overlapping or with tangled edges. This tool takes a pasted workflow JSON export and returns the same JSON with `agent_metadata.nodes` and `agent_metadata.edges` rebuilt so the workflow renders cleanly (straight lines, parallelism, no overlaps, no edge crossings).

The browser tool lives in `index.html` — engine, UI and styles all inline, no build step, no npm dependencies, no network access at runtime (strict CSP meta tag). Keep it that way unless explicitly asked otherwise.

The layout engine is also available as a standalone TypeScript module: `opal-workflow-layout.ts`. Use this for programmatic re-use in other applications.

## Files

- `index.html` — the complete browser tool (source of truth for the live site)
- `opal-workflow-layout.ts` — the layout engine extracted as a reusable TypeScript module

## How to work on it

### Browser tool (`index.html`)
- Two `<script>` blocks:
  1. The **layout engine** (pure functions, no DOM): `buildGraph`, `assignRanks`, `chainOrder`, `layoutChain`, `layoutLayered`, `computeLayout`, `buildOutput`, `layoutStats`, `readExistingMetadata`.
  2. The **UI** (an IIFE): paste/copy handling, controls, SVG preview rendering, stats chips, toasts.
- To verify changes headlessly, use jsdom: load the file with `runScripts: 'dangerously'`, stub `navigator.clipboard`, dispatch `click` events on `#sampleBtn` / `#runBtn` / `#copyBtn` and assert on `#output`, `#svgAfter`, `.toast` etc. Always re-run an XSS probe (a step name like `<img src=x onerror=alert(1)>` must render as text only) after touching the rendering code.

### TypeScript module (`opal-workflow-layout.ts`)
- Pure TypeScript, no DOM, no dependencies — works in Node or browser.
- Exports: `computeLayout`, `buildOutput`, `buildGraph`, `readExistingMetadata`, `layoutStats` plus all type definitions (`LayoutOptions`, `LayoutResult`, `Graph`, `GraphNode`, `GraphEdge`, `Point`, `Size`, etc.).
- **Keep in sync with `index.html`** — any algorithm change in one must be reflected in the other.

```ts
import { computeLayout, buildOutput } from './opal-workflow-layout';

const layout = computeLayout(workflowDoc, { direction: 'LR' });
const updated = buildOutput(workflowDoc, layout, () => crypto.randomUUID());
```

## Opal workflow JSON schema (learned from real exports, schema_version 1.2)

- Top level: `steps[]`, `triggers[]`, `agent_metadata`, `specialized_agents[]`, `workflow_type`, `internal_version`, plus other fields we never touch.
- **Only ever rewrite `agent_metadata.nodes` and `agent_metadata.edges`.** Preserve every other byte, including `internal_version` (Opal manages that itself) and any other keys inside `agent_metadata`.
- `agent_metadata` can be `null` (no layout at all - this is the common "messy" case; Opal stacks all nodes on top of each other).
- `agent_metadata.nodes`: `{ id, measured: { width, height }, position: { x, y } }`. Default node size is 248x108. Preserve existing `measured` values when present.
- `agent_metadata.edges`: `{ id, source, target }`. UUIDs and React Flow `xy-edge__...` ids are both accepted by Opal; handle-free edges (`sourceHandle`/`targetHandle` omitted) import fine, so we emit clean UUID ids via `crypto.randomUUID()`.
- Node ids = `trigger_id`s + `step_id`s. The logical graph is derived from:
  - each step's `next_step_id` (string or null)
  - **conditional steps**: `step_type: "conditional"` with a `conditions[]` array (`matching_condition`, `match_type`, `target_step_id`, `priority`, `case_sensitive`). Crucially, the Opal canvas renders a **synthetic extra node** with id `<step_id>-condition`; edges route step -> `<step_id>-condition` -> each condition target. The tool must synthesise this node.
  - triggers connect to entry steps (steps with in-degree 0). If none exist (cycle), fall back to the first step in the array with a warning.
- Step names like "Parallel Translator" do not imply graph branching - parallelism can live inside specialized agents. Only `conditional` steps branch (as far as observed; if new `step_type`s appear, inspect a real export before assuming).

## Layout algorithm

- **Chain detection**: if every node has <=1 in and <=1 out with a single start, it's a pure chain. Chains get the user-selected mode: snake (default width 3, boustrophedon - matches the hand-tidied reference layout), horizontal or vertical.
- **Everything else** gets a layered (Sugiyama-style) layout: longest-path ranking (cycle-safe with BFS fallback), 4 barycentre sweeps for crossing minimisation, slot-based cross coordinates, then parent-centring passes with collision resolution.
- **Preserve where possible**: when existing metadata has positions, they seed the in-layer ordering (so deliberate branch arrangements survive) but everything snaps to the uniform grid.
- Default pitches: x 400, y 240 (derived from the hand-tidied reference file). Auto mode: chains -> snake; branched -> layered top-to-bottom.
- Output is normalised so the bounding box top-left sits at (0,0).
- Quality gates measured by `layoutStats`: overlapping node rectangles and straight-line edge crossings must both be 0 for every fixture and mode.

## UI and styling: Optimizely Axiom design system

The UI mimics an Optimizely product using **real Axiom v3 tokens** extracted from the `@optiaxiom/globals` npm package (not eyeballed). They live as CSS custom properties at the top of the style block (`--ax-*`). Key values (light mode):

- Page `#F9FCF8`, cards white with border `#D8E4CB`, radius 12px, shadow sm
- Text: default `#202320`, secondary `#484E46`, tertiary `#616755`, disabled `#A1AC8D`
- Accent lime: `#ABFF44` bg with black text; hover `#99F141`, pressed `#7DDD3D`; subtle `#EEFFD9`
- Inverse surface `#252825` (toasts), focus ring `#197A94` (2px, 2px offset)
- Status: success strong `#226B1E` / subtle `#EEFFD9`; warning strong `#B54707` / subtle `#FEF1C6` / border `#F79008`; error strong `#5D2E41` / subtle `#FFDFE8` / border `#A95A77`
- Fonts (token stacks verbatim; Die Grotesk B and VC Nudge are licensed so they only render where installed, falling back to Roboto/system-ui): sans "Die Grotesk B", heading "VC Nudge"/"Roboto Condensed" (buttons use the heading font - that is authentic Axiom behaviour), mono "Roboto Mono"
- Buttons: primary = accent lime variant; secondary = white with `border.control` `#A1AC8D`; radius 8px, height 36px
- Badges/chips: subtle variants (neutral sage, lime success, amber warning)
- Toasts: dark inverse surface, white text, light-lime tick (`#CEFF93`), top-right, fade+translate in, 3s auto-dismiss, click to dismiss, `aria-live` region, reduced-motion respected

If more Axiom fidelity is needed, install `@optiaxiom/globals` and read `dist/esm/tokens/*.js` rather than guessing values, and check component CSS in `@optiaxiom/react/dist/esm/assets/`.

## Behavioural contract (do not regress)

- Paste JSON in, copy JSON out. No file upload/download flows.
- Full-width page layout (no max-width container).
- Side-by-side Before/After SVG previews. Before uses existing metadata positions when present; otherwise shows a stacked cascade with a warning pill explaining there is no layout metadata. Stats chips under each canvas: nodes, edges, overlaps, crossings (lime when zero, amber otherwise).
- Controls: layout mode (Auto/Snake/Horizontal/Vertical/Layered), flow direction (TB/LR), snake width, x/y spacing. Changing any control re-runs the layout if input is present.
- "Load sample" uses a neutral built-in sample (trigger + conditional + rejoin). Never embed real client workflow content in the file.
- Errors (invalid JSON, missing steps) show as Axiom-style error banners and clear the output. A 5 MB input guard exists.
- Clipboard failure fallback: select the output text and show an inline message instead of a success toast.

## Security requirements (Optimizely secure-coding standards apply)

- All user-derived strings (step names, workflow name, warnings) must be inserted via `textContent` / `createElementNS` - never `innerHTML`, never string-built SVG/HTML. This is the XSS boundary; test it after any rendering change.
- Keep the CSP meta tag (`default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:`). No network calls, no external resources, no eval.
- Treat pasted JSON as untrusted: validate structure, clamp control inputs, cap input size, fail with clear messages that expose no internals.

## Writing and style conventions

- British English throughout (UI copy and docs).
- No em dashes and no comma before "and" in any authored copy.
- Sentence case for UI labels. Buttons say exactly what they do.
- Prefer dependency-free, single-file deliverables.

## Known unknowns / next steps

- Round-trip into the Opal UI has not yet been verified for: (a) re-importing a workflow that already had metadata, (b) whether the `-condition` node reattaches correctly on import. If Opal renders oddly, compare the emitted metadata shape against a fresh Opal export and adjust `buildOutput`.
- Only `message` and `webhook` triggers and `specialized`/`conditional` step types have been observed. New step or trigger types should be added to `buildGraph` from real exports, not assumptions.
- Edge routing in the preview is centre-to-edge cubic curves; the crossing counter approximates edges as straight segments. Good enough for a quality signal, not a guarantee of visually crossing-free curves in extreme graphs.
- Possible enhancements discussed but not built: max-width fit for very long chains, per-branch spacing control, drag-to-reorder within a rank.
