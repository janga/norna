# Child-Page List Example

This maintained source supplies the screenshot in the public Examples page.
The parent explains a choice; child descriptions distinguish the prerequisites
and working environment. This is an illustrative excerpt, not a replacement
for the installation reference.

Capture from the registered scratch environment:

```sh
npm run review:scratch -- prepare --from fixtures/child-page-list/site --replace
npm run review:start -- scratch
npm run review:capture -- scratch installation/ --viewport 1200x800
```

The image is `.local/review-captures/scratch/installation-1200x800-light.png`.
Copy it to `site/pages/030-examples/images/child-page-list.png` after checking
that headings, descriptions, and order agree with the source.
