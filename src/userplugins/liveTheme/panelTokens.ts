/**
 * Discord renders chat/sidebar/member-list surfaces via CSS custom
 * properties (design tokens) rather than fixed classnames, so overriding
 * these directly survives Discord client updates far better than guessing
 * hashed class selectors.
 */
export const PANEL_BACKGROUND_TOKENS = [
    "--chat-background",
    "--chat-background-default",
    "--channel-background-default",
    "--channeltextarea-background",
    "--panel-bg",
    "--background-base-low",
    "--background-base-lower",
    "--background-base-lowest",
    "--background-secondary-alt",
    "--background-surface-high",
    "--background-surface-higher",
    "--background-surface-highest",
    "--bg-surface-raised",
    "--custom-channel-members-bg",
    "--card-secondary-bg",
    "--card-secondary-pressed-bg",
    "--card-primary-pressed-bg"
];
