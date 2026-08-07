---
# norna:start theme-help
# Site-wide visual defaults. Remove a value to use the engine default.
# Active values below are ordinary YAML; this marked comment block is only help text.
#
# Available structure:
# navigation:
#   brand: site-wide brand/home text; defaults to the homepage title
# layout:
#   pageWidth: CSS length, e.g. 2048px
#   gutter:
#     desktop: CSS length or clamp(), e.g. clamp(1.25rem, 4vw, 3rem)
#     mobile: CSS length, e.g. 16px
#   spacing:
#     firstSectionTop:
#       desktop: CSS length or clamp(), e.g. clamp(1.25rem, 2.5vw, 2rem)
#       mobile: CSS length, e.g. 1rem
#     sectionGap:
#       desktop: CSS length or clamp(), e.g. clamp(1.8rem, 3vw, 2.75rem)
#       mobile: CSS length, e.g. 1.65rem
#     subheadingTop:
#       desktop: CSS length, e.g. 1.35rem
#       mobile: CSS length, e.g. 1.1rem
# gallery:
#   width: CSS length, e.g. 55vw
#   maxAvailableWidthPercent:
#     desktop: number from 1 through 100
#     mobile: number from 1 through 100
#   maxAvailableHeightPercent:
#     desktop: number from 1 through 100
#     mobile: number from 1 through 100
# typography:
#   fontFamily: CSS font-family stack
#   preset: quiet-gallery | compact-gallery | text-forward | statement
#   overrides:
#     headings:
#       h2:
#         size: small | medium | large | xlarge
#       h3:
#         size: small | medium | large | xlarge
#       h4:
#         size: small | medium | large | xlarge
# presentation:
#   backgroundColor: quoted hex color, e.g. "#000000"
#   textColor: quoted hex color, e.g. "#f7f4ee"
#   inlineStyles:
#     style-name:
#       color: quoted hex color
# frame:
#   colors: presentation | theme
#   colors:
#     backgroundColor: quoted hex color
#     textColor: quoted hex color
# norna:end theme-help
layout:
  pageWidth: 2048px
  gutter:
    desktop: clamp(1.25rem, 4vw, 3rem)
    mobile: 16px
  spacing:
    firstSectionTop:
      desktop: clamp(1.25rem, 2.5vw, 2rem)
      mobile: 1rem
    sectionGap:
      desktop: clamp(1.8rem, 3vw, 2.75rem)
      mobile: 1.65rem
    finalSectionBottom:
      desktop: clamp(1.8rem, 3vw, 2.75rem)
      mobile: 1.65rem
    sectionHeadingToBody:
      desktop: 0.55rem
      mobile: 0.45rem
    bodyToImages:
      desktop: 1.25rem
      mobile: 1rem
    imageGap:
      desktop: clamp(1.25rem, 2.8vw, 2rem)
      mobile: 1.8rem
    subheadingTop:
      desktop: 1.35rem
      mobile: 1.1rem
    subheadingRuleTop:
      desktop: 0.65rem
      mobile: 0.55rem
gallery:
  width: 55vw
  maxAvailableWidthPercent:
    desktop: 100
    mobile: 100
  maxAvailableHeightPercent:
    desktop: 74
    mobile: 68
typography:
  fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif"
  preset: quiet-gallery
  overrides:
    headings:
      h3:
        size: medium
        spacing: 0.7rem
      h4:
        size: small
        spacing: 0.55rem
presentation:
  backgroundColor: "#550000"
  textColor: "#ffffff"
  inlineStyles:
    highlight:
      color: "#ffd84d"
    alert:
      color: "#ff9a3d"
frame:
  colors: presentation
---
