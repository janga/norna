---
# Site-wide visual defaults. Remove a value to use the engine default.
navigation:
  brand: Project Name
layout:
  density: compact
  pageWidth: 1120px
  gutter:
    desktop: clamp(1.25rem, 4vw, 3rem)
    mobile: 1rem
  spacing:
    firstSectionTop:
      desktop: clamp(0.9rem, 1.6vw, 1.5rem)
      mobile: 0.9rem
    sectionGap:
      desktop: clamp(0.8rem, 1.6vw, 1.5rem)
      mobile: 1rem
    finalSectionBottom:
      desktop: clamp(1rem, 2vw, 1.75rem)
      mobile: 1rem
gallery:
  width: 840px
  maxAvailableWidthPercent:
    desktop: 100
    mobile: 100
  maxAvailableHeightPercent:
    desktop: 70
    mobile: 62
typography:
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  preset: text-forward
  rhythm: compact
presentation:
  backgroundColor: "#001314"
  textColor: "#f6f1e8"
  inlineStyles:
    accent:
      color: "#8fd3ff"
    muted:
      color: "#b8b1a6"
frame:
  colors: presentation
---
