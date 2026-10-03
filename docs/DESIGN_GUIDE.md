# Design guide

Every screen was already designed in the Designathon. Your job is to make the app look like those designs. Open them while you work:

- In the running app: any unbuilt screen shows its design under the TODO list.
- As files: `web/public/design/<CODE>-<Name>.jpg` (for example `DR3-ProofOfDelivery.jpg`).
- Give the image to your AI tool together with your prompt ("make this screen look like this image").

## The design system in five rules

1. **One colour, one meaning.** Yellow = now / needs your attention (current stop, main button). Red = short, conflict, offline, problem. Green = done (delivered, loaded, synced). Blue = chilled goods only. Black ink = structure and text. Never use a colour just to decorate.
2. **Three fonts.** Big Shoulders (class `h-page`, `stencil`) for big headings and painted numbers. IBM Plex Sans for reading. IBM Plex Mono (class `mono`, `label`) for exact data: order ids, times, counts.
3. **Device first.** Driver = phone, one hand, in a truck: one main action per screen, buttons at least 48 px (`btn big block`). Loader = tablet at 04:30, gloves: dark theme, huge numbers, buttons at least 56 px. Dispatcher and store = desktop: tables and side-by-side cards.
4. **Say what happens next.** Every warning tells the person what to do or what will happen: "6 of 10 loaded. The other 4 come on the next delivery." Not just "Shortfall".
5. **Nothing is silent.** When something changes, the other screens show it live (use `useApi(path, [events])`).

## Building blocks (already in `web/src/shared/`)

| You want | Use |
|---|---|
| Page title | `<PageHead code="DP2" title="Orders for Wednesday" sub="...">buttons</PageHead>` |
| A box | `<Card title="Runs" action={<Badge>live</Badge>}>...</Card>` |
| Big number | `<Stat label="Dock shortfalls" value={2} tone="bad" />` |
| Status pill | `<StatusBadge status="delivered" />` or `<Badge tone="cold">Chilled</Badge>` |
| Main button | `<button className="btn now big">Deliver here</button>` |
| Second button | `className="btn secondary"` · danger: `btn danger` |
| Warning strip | `<div className="notice bad">...</div>` (`ok`, `cold`, or plain yellow) |
| Table | `<table className="table">` inside `<Card className="pad-0">` |
| Form field | `<label className="field"><span className="label">Name</span><input className="input" /></label>` |
| Layout | `row`, `col`, `stack`, `grid-2`, `grid-4`, `wrap`, `between`, `fill` |
| Message after an action | `const [toast, show] = useToast();` then `show("Saved")` and render `{toast}` |

Need a style that isn't there? Make `roles/<your-role>/<your-role>.css`, import it in your screen, and prefix your classes (for example `.dr-signature`). Use the colour variables: `var(--yellow)`, `var(--red)`, `var(--green)`, `var(--blue)`, `var(--ink)`, `var(--line)`, `var(--paper-2)`.

## Checking your screen

- Driver: Chrome DevTools → device toolbar → iPhone 12 Pro (390 × 844).
- Loader: 1180 × 820 (iPad Air landscape).
- Dispatcher and store: full desktop window, and once at 1280 px wide.
- Keyboard: press Tab through the screen. Every button must show the yellow focus ring.
