# OlchiPanel top Note + flat session list v1

## Mode and authority

- Mode: maintenance. The current OlchiPanel shell is the visual authority; no new ImageGen reference is required.
- Latest authority: Mark's 2026-09-02 request moves the common Note from the sidebar to the screen top. This explicitly overrides candidate direction `ui.20260902.001` only for Note placement.
- Existing directions retained: `ui.20260901.012` and `ui.20260901.003` against repeated rounded cards, left color bars, vendor-blue selection, and generic AI-dashboard styling.

## Human outcome

The user should read the sidebar as a quiet list of live work sessions, not as a stack of dashboard cards. Note is machine-wide and session-independent, so its entry point must be visibly separate from session-specific navigation.

## Avoid

- Rounded session cards, card backgrounds, shadows, or a thick rounded selection bar.
- A selected session changing its whole row into a colored card.
- Moving Situation, Plan, Requests, or Records out of the session sidebar.
- Adding a large new header that consumes working height.

## Prefer

- A compact top-level Note tab with a thin underline for its active state.
- Session rows separated by rhythm and hairlines, with name-first typography.
- Selected session shown by stronger text and one small square-ended marker only.
- Existing drag, rename, archive, keyboard, fold, session grouping, and common Note storage behavior unchanged.

## Acceptance checks

- Exactly five primary destinations remain: four session views in the vertical sidebar and one common Note tab at the top.
- No `rail-common-nav` remains; Note is not inside the sidebar drawer.
- Expanded session rows have no border radius, background selection card, shadow, or rounded left bar.
- The selected session still has a visible non-color-only state and keyboard focus remains visible.
- 1440x900 and 960x760 render without document horizontal overflow or clipped Note/session controls.
- Actual Electron is cold-restarted from this repository and shows one window and one 6711 listener.
