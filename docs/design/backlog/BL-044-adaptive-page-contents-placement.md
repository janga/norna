# BL-044: Adaptive Page-Contents Placement

## Outcome

Keep shallow documentation trees compact by making every page's H2/H3 outline
available beneath that page in the left navigation rail. Preserve a separate
page-contents rail for deeper branches, where combining both hierarchies would
make the page tree harder to scan.

The local source review at
`todos/page-contents-placement-study/site/pages/000-home/content.md` provides
the research background. The exact depth boundary remains a Norna product rule
rather than a universal usability standard.

## Navigation Contract

- Apply this rule only to tree navigation. Sections and top navigation keep
  their existing presentation.
- In automatic mode, any listed child page or category selects tree navigation
  throughout the site. Keep the left-rail position on Home and independent
  top-level pages instead of moving their section navigation below the sticky
  header.
- Resolve placement once for the active top-level branch so it remains stable
  while the reader moves between pages in that branch.
- Count every visible listed page and category level in that branch. Do not
  count the global top-navigation level.
- At one or two visible levels, make every qualifying page's H2/H3 outline
  available beneath its page entry in the left tree.
- At three or more visible levels, keep the left tree page-only and place the
  current page's H2/H3 outline in the separate contents rail.
- Keep each page title as the link to the page top. Group a leaf page's H2/H3
  links in one disclosure; open the current page's disclosure by default and
  keep other leaf-page disclosures closed by default. A page branch that also
  contains child pages reveals its own outline with those children. Do not make
  individual H2/H3 entries collapsible.
- Do not add a visible `Sections` label. Give the disclosure and its nested
  navigation accessible names that identify both their purpose and current
  page.
- Keep child-page disclosures independent. Opening one branch must not close a
  previously opened branch.
- Remember explicit open and closed outline choices across page navigation for
  the browser session. Do not let the current-page default overwrite an
  explicit choice.
- Keep the existing threshold: no page-contents navigation is rendered unless
  the current page has at least two H2/H3 destinations.
- Add no author-facing setting. The file structure is the source of the
  automatic decision.

## Responsive And Interaction Contract

- Keep the existing consolidated expandable mobile menu. This desktop
  placement rule must not create a second mobile navigation model.
- At intermediate widths, a deep branch may retain the existing contents list
  in normal document flow instead of showing two side rails.
- Keep source order and native links usable without JavaScript.
- Leave the current page's section disclosure open in the no-JavaScript
  fallback.
- When section tracking is enabled, update the active H2/H3 link in either
  placement without changing focus or the URL.
- Focus reading may hide navigational rails; the document headings remain the
  content structure in that mode.
- Margin notes may use a free margin only when the complete note lane fits.

## Acceptance Criteria

- One shared function derives the active branch's visible depth and placement
  from the listed page/category model.
- Categories count toward depth, and unlisted navigation nodes do not.
- Every page in a top-level branch resolves the same placement even when the
  individual page is shallower than another page in that branch.
- A shallow fixture renders every qualifying page's H2/H3 links under its
  left-tree entry and does not render a separate contents rail.
- A hierarchical fixture renders Home in the same left-rail frame, integrates
  its qualifying H2/H3 outline there, and keeps the document axis stable when
  the reader follows a global link into a nested branch.
- A deep fixture with the same H2/H3 outline keeps those links out of the page
  tree and renders the established contents rail.
- Pages below the existing heading threshold render neither placement.
- Desktop, intermediate-width, mobile, no-JavaScript, and current-section
  tracking behavior have regression coverage.
- Open and closed page-outline states persist across page navigation with
  JavaScript, while native disclosure controls remain usable without it.
- Canonical product documentation describes the approved shallow and deep
  behaviors.
