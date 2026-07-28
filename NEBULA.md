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

### Free Mode (in progress)

A freeform floating-window layer, entered via a button in the top-left of normal Discord. Turns the client
into a draggable/resizable multi-window desktop where each window shows a channel or DM of your choice, plus
desktop-shell-style widgets (clock, weather, voice room with a speaking indicator). Visual direction inspired
by rice/compositor shells like [ilyamiro/nixos-configuration](https://github.com/ilyamiro/nixos-configuration).

## Development

Same workflow as upstream Vencord:

```bash
pnpm install
pnpm build
pnpm inject
```

Userplugins live in `src/userplugins/<name>/` (gitignored by default upstream; this fork un-ignores its own
plugin directories explicitly in `.gitignore`).
