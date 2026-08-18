---
# norna:start theme-help
# Site-wide visual defaults. Remove a value to use the engine default.
# Active values below are ordinary YAML; this marked comment block is only help text.
#
# Available structure:
# navigation:
#   brand: site-wide brand/home text; defaults to the homepage title
#   logo:
#     alt: accessible name for site/public/logo.svg
#     height: CSS length for the logo height, e.g. 2.6rem
# layout:
#   density: compact | normal | airy
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
#   rhythm: compact | normal | airy
#   overrides:
#     headings:
#       h2:
#         size: small | medium | large | xlarge
#       h3:
#         size: small | medium | large | xlarge
#         spacingBefore: CSS length, e.g. 1.2em
#         spacingAfter: CSS length, e.g. 0.45em
#       h4:
#         size: small | medium | large | xlarge
#         spacingBefore: CSS length, e.g. 0.9em
#         spacingAfter: CSS length, e.g. 0.35em
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
navigation:
  logo:
    alt: Dog Shelter
    height: 2.6rem
layout:
  density: compact
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
    headingToBlock:
      desktop: 0.65em
      mobile: 0.6em
    blockGap:
      desktop: 1.25em
      mobile: 1.1em
    imageGap:
      desktop: clamp(1.25rem, 2.8vw, 2rem)
      mobile: 1.8rem
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
  rhythm: compact
  overrides:
    headings:
      h3:
        size: medium
        spacingBefore: 1.2em
        spacingAfter: 0.45em
      h4:
        size: small
        spacingBefore: 0.9em
        spacingAfter: 0.35em
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
