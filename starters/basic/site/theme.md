---
# norna:start theme-help
# Site-wide visual defaults. Remove a value to use the engine default.
# Active values below are ordinary YAML; this marked comment block is only help text.
#
# Available structure:
# navigation:
#   brand: site-wide brand/home text; defaults to the homepage title
# layout:
#   density: compact | normal | airy
#   pageWidth: CSS length, e.g. 1180px
#   gutter:
#     desktop: CSS length or clamp(), e.g. clamp(1.25rem, 4vw, 3rem)
#     mobile: CSS length, e.g. 1rem
#   spacing:
#     firstSectionTop:
#       desktop: CSS length or clamp(), e.g. clamp(1.875rem, 3vw, 2.75rem)
#       mobile: CSS length, e.g. 1.375rem
#     sectionGap:
#       desktop: CSS length or clamp(), e.g. clamp(1.4rem, 3vw, 2.75rem)
#       mobile: CSS length, e.g. 1.5rem
#     finalSectionBottom:
#       desktop: CSS length or clamp(), e.g. clamp(1.4rem, 3vw, 2.75rem)
#       mobile: CSS length, e.g. 1.5rem
#     bodyToImages:
#       desktop: CSS length, e.g. 1.25rem
#       mobile: CSS length, e.g. 1rem
#     imageGap:
#       desktop: CSS length or clamp(), e.g. clamp(1.25rem, 2.8vw, 2rem)
#       mobile: CSS length, e.g. 1.5rem
# gallery:
#   width: CSS length, e.g. 900px
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
#         align:
#           desktop: left | center | right
#           mobile: left | center | right
#         size: small | medium | large | xlarge
#         lineHeight: number from 1 through 3
#         spacingBefore: CSS length, e.g. 0
#         spacingAfter: CSS length, e.g. 0.55em
#       h3:
#         align:
#           desktop: left | center | right
#           mobile: left | center | right
#         size: small | medium | large | xlarge
#         lineHeight: number from 1 through 3
#         spacingBefore: CSS length, e.g. 1.5em
#         spacingAfter: CSS length, e.g. 0.5em
#       h4:
#         align:
#           desktop: left | center | right
#           mobile: left | center | right
#         size: small | medium | large | xlarge
#         lineHeight: number from 1 through 3
#         spacingBefore: CSS length, e.g. 1.1em
#         spacingAfter: CSS length, e.g. 0.4em
#     body:
#       align:
#         desktop: left | center | right
#         mobile: left | center | right
#       size: small | medium | large | xlarge
#       lineHeight: number from 1 through 3
#       paragraphSpacing: CSS length, e.g. 0.85em
#     caption:
#       align:
#         desktop: left | center | right
#         mobile: left | center | right
#       size: small | medium | large | xlarge
#       lineHeight: number from 1 through 3
#       spacingBefore: CSS length, e.g. 0.5em
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
  brand: Example Site
layout:
  density: normal
  pageWidth: 1180px
  gutter:
    desktop: clamp(1.25rem, 4vw, 3rem)
    mobile: 1rem
gallery:
  width: 900px
  maxAvailableWidthPercent:
    desktop: 100
    mobile: 100
  maxAvailableHeightPercent:
    desktop: 74
    mobile: 68
typography:
  fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif"
  preset: quiet-gallery
  rhythm: normal
presentation:
  backgroundColor: "#000000"
  textColor: "#f7f4ee"
  inlineStyles:
    highlight:
      color: "#ffd84d"
frame:
  colors: presentation
---
