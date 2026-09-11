# BL-095: Nested Navigation For Substantial Documentation

## Status And Dependencies

Ready after
[BL-092: Top navigation without a duplicate section row](BL-092-top-navigation-without-duplicate-sections.md).
Coordinate the final source/result audit with
[BL-094: Child-page descriptions that explain a choice](BL-094-child-page-choice-demonstration.md).

## Outcome

Keep the small dog-shelter progression for understanding files and navigation.
Add a compact, runnable documentation branch that demonstrates why grouping
guides and reference material becomes useful as content grows. Do not imply
that nesting requires a particular page count or encourage depth for its own
sake.

## Acceptance And Verification

- Introduce the benefit in one or two sentences: related pages form branches
  that readers can explore one topic at a time.
- Show a maintained documentation tree, exact source for the captured page,
  and a real screenshot with enough depth to demonstrate page navigation and
  the local page outline. Explain their separate roles briefly.
- Use concrete large-site evidence without reproducing proprietary material:
  [Kubernetes installation documentation](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/setup-ha-etcd-with-kubeadm/)
  and [Grafana notification documentation](https://grafana.com/docs/grafana/latest/alerting/configure-notifications/).
- Regenerate affected single-page, top, and nested screenshots using maintained
  fixtures and the registered scratch environment. Keep concise captions,
  including "On a small screen, with Menu open."
- Update the capture script/provenance and targeted documentation assertions.
  Check source and result fidelity after all preceding changes; update
  [BL-091: Final examples audit against implemented behavior](BL-091-final-examples-implementation-audit.md)
  with the new evidence and remaining visual review.
- Do not alter public complete-site examples just to match an illustration,
  introduce new navigation configuration, or clone an entire competitor site.
