---
# norna:start theme-help
# Site-wide visual defaults. Remove a value to use the engine default.
# Active values below are ordinary YAML; this marked comment block is only help text.
#
# Available structure:
# presentation:
#   backgroundColor: quoted hex color, e.g. "#000000"
#   textColor: quoted hex color, e.g. "#f7f4ee"
#   inlineStyles:
#     style-name:
#       color: quoted hex color
#   typography:
#     preset: quiet-gallery | compact-gallery | text-forward | statement
#     overrides:
#       heading:
#         align:
#           desktop: left | center | right
#           mobile: left | center | right
#         size: small | medium | large | xlarge
#         lineHeight: number from 1 through 3
#         spacing: CSS length, e.g. 0.65em
#       body:
#         align:
#           desktop: left | center | right
#           mobile: left | center | right
#         size: small | medium | large | xlarge
#         lineHeight: number from 1 through 3
#         paragraphSpacing: CSS length, e.g. 0.85em
#       caption:
#         align:
#           desktop: left | center | right
#           mobile: left | center | right
#         size: small | medium | large | xlarge
#         lineHeight: number from 1 through 3
#         spacing: CSS length, e.g. 0.5em
# frame:
#   colors: presentation | theme
#   colors:
#     backgroundColor: quoted hex color
#     textColor: quoted hex color
# norna:end theme-help
presentation:
  backgroundColor: "#550000"
  textColor: "#ffffff"
  inlineStyles:
    highlight:
      color: "#ffd84d"
    alert:
      color: "#ff9a3d"
  typography:
    preset: quiet-gallery
frame:
  colors: presentation
---
