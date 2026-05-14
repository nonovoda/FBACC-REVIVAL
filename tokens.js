// ui/core/tokens.js
// Design tokens for FB Bookmarklet Tools.

export const FB_TOOL_TOKENS = {
  zIndex: 2147483647,

  colors: {
    panelBg: "#0f1715",
    deepBg: "#0b1210",
    controlBg: "#121f1b",

    border: "#2b433a",
    borderSoft: "#22372f",
    borderInput: "#2f4a40",

    text: "#e8fff0",
    label: "#c7e0d2",
    muted: "#99b3a6",

    accent: "#4dff8f",
    accentText: "#052012",

    success: "#9bff7d",
    warning: "#ffd27d",
    error: "#ff8f8f",

    close: "#d3e8dc"
  },

  radius: {
    control: "9px",
    log: "10px",
    modal: "14px"
  },

  shadow: {
    modal: "0 24px 60px rgba(0,0,0,.45)"
  },

  size: {
    modalCompact: "min(420px, calc(100vw - 24px))",
    modalMedium: "min(520px, calc(100vw - 24px))",
    modalLarge: "min(720px, calc(100vw - 24px))",
    modalMaxHeight: "calc(100vh - 40px)",

    modalPadding: "14px",
    gap: "8px",
    controlPadding: "9px",

    multiSelectMinHeight: "110px",
    logMinHeight: "120px",
    logMaxHeight: "320px"
  },

  font: {
    family: 'Inter, "Segoe UI", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',

    baseSize: "13px",
    labelSize: "12px",
    noteSize: "11px",
    logSize: "12px",

    titleCompact: "32px",
    titleMedium: "28px",
    lineHeight: "1.4"
  },

  transition: {
    fast: "160ms ease"
  }
};

export function getFbToolCssVariables() {
  const t = FB_TOOL_TOKENS;

  return `
    --fbtool-panel-bg:${t.colors.panelBg};
    --fbtool-deep-bg:${t.colors.deepBg};
    --fbtool-control-bg:${t.colors.controlBg};

    --fbtool-border:${t.colors.border};
    --fbtool-border-soft:${t.colors.borderSoft};
    --fbtool-border-input:${t.colors.borderInput};

    --fbtool-text:${t.colors.text};
    --fbtool-label:${t.colors.label};
    --fbtool-muted:${t.colors.muted};

    --fbtool-accent:${t.colors.accent};
    --fbtool-accent-text:${t.colors.accentText};

    --fbtool-success:${t.colors.success};
    --fbtool-warning:${t.colors.warning};
    --fbtool-error:${t.colors.error};
    --fbtool-close:${t.colors.close};

    --fbtool-radius-control:${t.radius.control};
    --fbtool-radius-log:${t.radius.log};
    --fbtool-radius-modal:${t.radius.modal};

    --fbtool-shadow-modal:${t.shadow.modal};

    --fbtool-width-compact:${t.size.modalCompact};
    --fbtool-width-medium:${t.size.modalMedium};
    --fbtool-width-large:${t.size.modalLarge};
    --fbtool-max-height:${t.size.modalMaxHeight};

    --fbtool-padding-modal:${t.size.modalPadding};
    --fbtool-gap:${t.size.gap};
    --fbtool-padding-control:${t.size.controlPadding};

    --fbtool-font:${t.font.family};
    --fbtool-font-mono:${t.font.mono};

    --fbtool-font-size:${t.font.baseSize};
    --fbtool-label-size:${t.font.labelSize};
    --fbtool-note-size:${t.font.noteSize};
    --fbtool-log-size:${t.font.logSize};
    --fbtool-title-size:${t.font.titleCompact};
    --fbtool-line-height:${t.font.lineHeight};

    --fbtool-transition:${t.transition.fast};
  `;
}
