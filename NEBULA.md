# Nebula

A Discord client mod built on top of [Vencord](https://github.com/Vendicated/Vencord). Vencord provides the
injection framework and plugin loader; Nebula adds a set of custom userplugins on top of it. See
[README.md](README.md) for Vencord's own docs (installer, contributing, etc.) — this file covers what's
specific to this fork.

## Plugins

### LiveTheme (`src/userplugins/liveTheme`)

Dynamic/live backgrounds for Discord, with panel transparency to match:

- Background modes: static image, looping video, or an animated CSS gradient (several built-in presets)
- Panel opacity and blur sliders, applied via Discord's own CSS design tokens (e.g. `--chat-background`,
  `--panel-bg`) and semantic `<nav>` selectors rather than hashed classnames, plus a small runtime DOM walker
  that neutralizes Discord's opaque background wrapper chain — including inside modals/dialogs. This is
  intentionally more resilient to Discord client updates than the classic BetterDiscord approach of guessing
  hashed CSS class names.
- Single consolidated settings panel with a live preview.

### Free Mode (`src/userplugins/freeMode`)

A freeform floating-window layer. A small button in the top-left corner of normal Discord toggles a
full-screen overlay that turns the client into a draggable/resizable multi-window desktop. Visual direction
inspired by rice/compositor shells like
[ilyamiro/nixos-configuration](https://github.com/ilyamiro/nixos-configuration).

- **Windows**: rounded glass cards, freely draggable (grab the titlebar) and resizable (bottom-right handle).
  Each is bound to a channel/DM you pick, or one of the widgets below. Minimize vs. close are distinct.
- **Keyboard-first**: `Tab` / `Shift+Tab` cycles focus between open windows, `Ctrl+N` opens the add-window
  picker, `Ctrl+W` closes the focused window, `Esc` closes menus then the whole overlay.
- **Chat windows** use a custom lightweight message list built directly on Discord's `ChannelStore` /
  `MessageStore` / `MessageActions` (not Discord's own single-instance chat component), subscribing to Flux
  `MESSAGE_CREATE`/`UPDATE`/`DELETE` per channel so multiple open windows update live over Discord's existing
  gateway connection instead of polling.
- **Widgets**: a voice-room card (current call participants, green ring around whoever's speaking, via
  `VoiceStateStore`/`ChannelRTCStore`), a live clock, and a weather card (via the free, keyless
  [open-meteo](https://open-meteo.com) API).
- **Workspaces**: the "版面" menu saves the current window arrangement under a name and reloads it later, so a
  layout doesn't have to be rebuilt from scratch every session.

Design priorities here came out of a simulated user interview (a rice/tiling-WM power user persona) run before
implementation — see git log for that reasoning. Known gaps not yet built: unread-badge suppression for
channels open in a Free Mode window, per-window notification muting, snapping/tiling presets, and
multi-monitor window dragging.

## Development

Same workflow as upstream Vencord:

```bash
pnpm install
pnpm build
pnpm inject
```

Userplugins live in `src/userplugins/<name>/` (gitignored by default upstream; this fork un-ignores its own
plugin directories explicitly in `.gitignore`).
