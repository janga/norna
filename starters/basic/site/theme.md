---
# norna:start theme-help
# Site-wide visual defaults. Remove a value to use the engine default.
# Active values below are ordinary YAML; this marked comment block is only help text.
#
# Available structure:
# navigation:
#   brand: site-wide brand/home text; defaults to the homepage title
# layout:
#   pageWidth: CSS length, e.g. 1180px
#   gutter:
#     desktop: CSS length or clamp(), e.g. clamp(1.25rem, 4vw, 3rem)
#     mobile: CSS length, e.g. 1rem
#   spacing:
#     firstSectionTop:
#       desktop: CSS length or clamp(), e.g. clamp(1.875rem, 3vw, 2.75rem)
#       mobile: CSS length, e.g. 1.375rem
#     sectionGap:
#       desktop: CSS length or clamp(), e.g. clamp(2.55rem, 4.2vw, 3.9rem)
#       mobile: CSS length, e.g. 2.25rem
#     finalSectionBottom:
#       desktop: CSS length or clamp(), e.g. clamp(2.55rem, 4.2vw, 3.9rem)
#       mobile: CSS length, e.g. 2.25rem
#     sectionHeadingToBody:
#       desktop: CSS length or clamp(), e.g. clamp(0.5625rem, 1.25vw, 0.75rem)
#       mobile: CSS length, e.g. 0.4375rem
#     bodyToImages:
#       desktop: CSS length or clamp(), e.g. clamp(1.25rem, 2.5vw, 2rem)
#       mobile: CSS length, e.g. 1.25rem
#     imageGap:
#       desktop: CSS length or clamp(), e.g. clamp(1.5rem, 3.5vw, 2.75rem)
#       mobile: CSS length, e.g. 2.75rem
#     subheadingTop:
#       desktop: CSS length, e.g. 2rem
#       mobile: CSS length, e.g. 1.6rem
#     subheadingRuleTop:
#       desktop: CSS length, e.g. 1rem
#       mobile: CSS length, e.g. 0.8rem
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
#   overrides:
#     headings:
#       h2:
#         align:
#           desktop: left | center | right
#           mobile: left | center | right
#         size: small | medium | large | xlarge
#         lineHeight: number from 1 through 3
#         spacing: CSS length, e.g. 0.65em
#       h3:
#         align:
#           desktop: left | center | right
#           mobile: left | center | right
#         size: small | medium | large | xlarge
#         lineHeight: number from 1 through 3
#         spacing: CSS length, e.g. 0.9rem
#       h4:
#         align:
#           desktop: left | center | right
#           mobile: left | center | right
#         size: small | medium | large | xlarge
#         lineHeight: number from 1 through 3
#         spacing: CSS length, e.g. 0.85rem
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
#       spacing: CSS length, e.g. 0.5em
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
  pageWidth: 1180px
  gutter:
    desktop: clamp(1.25rem, 4vw, 3rem)
    mobile: 1rem
  spacing:
    firstSectionTop:
      desktop: clamp(1.875rem, 3vw, 2.75rem)
      mobile: 1.375rem
    sectionGap:
      desktop: clamp(2.55rem, 4.2vw, 3.9rem)
      mobile: 2.25rem
    finalSectionBottom:
      desktop: clamp(2.55rem, 4.2vw, 3.9rem)
      mobile: 2.25rem
    sectionHeadingToBody:
      desktop: clamp(0.5625rem, 1.25vw, 0.75rem)
      mobile: 0.4375rem
    bodyToImages:
      desktop: clamp(1.25rem, 2.5vw, 2rem)
      mobile: 1.25rem
    imageGap:
      desktop: clamp(1.5rem, 3.5vw, 2.75rem)
      mobile: 2.75rem
    subheadingTop:
      desktop: 2rem
      mobile: 1.6rem
    subheadingRuleTop:
      desktop: 1rem
      mobile: 0.8rem
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
presentation:
  backgroundColor: "#000000"
  textColor: "#f7f4ee"
  inlineStyles:
    highlight:
      color: "#ffd84d"
frame:
  colors: presentation
---
