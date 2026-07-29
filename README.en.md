# Nebula

**Language:** English · [繁體中文](README.md)

Nebula is a Discord client mod built by [orange0730](https://github.com/orange0730) on top of
[Vencord](https://github.com/Vendicated/Vencord). Vencord provides the underlying injection framework and
plugin system; Nebula adds the following custom plugins on top of it:

- **LiveTheme** — dynamic/live background system
- **Free Mode** — a freeform, draggable multi-window chat layout

## Features

### LiveTheme: dynamic live backgrounds

Brings Discord's background to life and makes the chat/sidebar panels translucent to show it through:

- Background modes: static image, looping video, or an animated CSS gradient (several built-in presets)
- Panel opacity and blur sliders with a live preview
- Panel transparency is applied via Discord's own CSS design tokens (e.g. `--chat-background`, `--panel-bg`)
  and semantic `<nav>` selectors, rather than guessing hashed classnames, plus a runtime DOM walker that
  neutralizes the app's opaque background chain (including inside modals/dialogs). This is intentionally more
  resilient to Discord client updates than the classic BetterDiscord approach of guessing hashed CSS class
  names.

### Free Mode

A small button in the top-left corner (or `Ctrl+\``) toggles "Free Mode" — a full-screen freeform overlay that
turns Discord into a mini draggable-window desktop:

- **Windows**: rounded glass cards, draggable by their titlebar and resizable from the bottom-right corner.
  Each window is bound to a channel/DM you pick, or one of the widgets below. Minimize and close are distinct
  actions.
- **Keyboard-first**: `Tab` / `Shift+Tab` cycles focus between windows, `Ctrl+N` opens the add-window picker,
  `Ctrl+W` closes the focused window, `Esc` closes menus then the whole overlay.
- **Chat windows** use a custom lightweight message renderer built directly on Discord's `ChannelStore` /
  `MessageStore` / `MessageActions` (not Discord's own single-instance chat component), subscribing to Flux
  `MESSAGE_CREATE`/`UPDATE`/`DELETE` events so multiple simultaneously open windows update live over Discord's
  existing connection instead of polling.
- **Widgets**: a voice-room card (current call participants, a green ring around whoever's speaking, via
  `VoiceStateStore`/`ChannelRTCStore`), a live clock, and a weather card (via the free, keyless
  [open-meteo](https://open-meteo.com) API).
- **Workspaces**: save the current window arrangement under a name and reload it later in one click.

Visual direction inspired by rice/compositor shells like
[ilyamiro/nixos-configuration](https://github.com/ilyamiro/nixos-configuration): warm-toned dark backgrounds,
rounded pill-shaped widgets, soft single-accent-color glow.

Known gaps not yet built: unread-badge suppression for channels open in a Free Mode window, per-window
notification muting, snapping/tiling presets, multi-monitor window dragging.

## Installation & development

Same workflow as upstream Vencord:

```bash
pnpm install
pnpm build
pnpm inject
```

For other details (finding your Discord install path, troubleshooting, etc.), see the
[official Vencord docs](https://github.com/Vendicated/Vencord).

## License & attribution

This project is a derivative work of [Vencord](https://github.com/Vendicated/Vencord) (by Vendicated and
contributors), licensed under the same **GNU General Public License v3.0 (GPL-3.0)** — full text in
[LICENSE](LICENSE).

GPL-3.0 is a copyleft license. In short:

- You may freely modify and redistribute it, including publishing publicly on GitHub, without needing separate
  permission.
- A derivative work (this project) must stay under the same GPL-3.0 license — it cannot be relicensed under
  something more restrictive or closed.
- Existing copyright notices must be preserved — the copyright headers already present in Vencord's source
  files (e.g. `Copyright (c) 2022 Vendicated and contributors`) remain untouched.
- Source code must be made available (this repo is public source, so that's satisfied).

Publishing this fork, built on Vencord, is therefore permitted and compliant, not an infringement. This repo's
git commit history only carries a single author identity (`orange0730`), rather than Vencord's original
several-thousand individual commits — that's purely a presentation choice about *this* repo's commit log and
doesn't affect the GPL compliance above: the copyright headers already embedded in the source files are fully
intact, and this document clearly states the project is derived from Vencord, satisfying the spirit of
attribution disclosure.

## What is Vencord

> The cutest Discord client mod
>
> - 100+ built-in plugins, easy to install, works on any Discord branch (Stable/Canary/PTB)
> - Works in your browser via extension or UserScript
> - Built-in CSS/theme editor, can import BetterDiscord themes
> - Privacy-friendly: blocks Discord's analytics and crash reporting by default, no telemetry of its own
> - Actively maintained, broken plugins are usually fixed within 12 hours

More info at [vencord.dev](https://vencord.dev) or the original project at
[github.com/Vendicated/Vencord](https://github.com/Vendicated/Vencord).
