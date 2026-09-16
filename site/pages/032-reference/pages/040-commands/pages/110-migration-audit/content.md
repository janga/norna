---
page:
  description: Understand the experimental Docusaurus inventory command and the limits of its generated report.
---

# Experimental migration audit

`migrate:check` inventories a local Docusaurus project and writes a report.
It does not convert the site or prove that the source can be migrated without
manual decisions. The broader migration workflow is not a supported Norna
publishing path.

```sh
npm exec -- norna migrate:check --source docusaurus ../source-project --report-dir ../migration-report
```

## Inputs and output

The source project path and `--report-dir` are required. `--source` accepts
only `docusaurus`. Paths resolve from the invocation directory. The report
directory must be absent or empty and separate from the source project;
Neither directory may contain the other. `-h` and `--help` show usage.

The command discovers `docs/` or `website/docs/` and corresponding
`versioned_docs/` trees, reads Markdown/MDX and records navigation files.
It does not install dependencies or execute source configuration, plugins,
React components or MDX.

It writes a Norna report site and `migration-report.json`, including source
revision metadata when available. Problem pages show up to 20 representative
occurrences; JSON retains every occurrence.

## Interpretation limits

Findings classify source constructs requiring copying, rewriting, assistance,
feature/model decisions or further investigation. Classification is heuristic
evidence for review, not an automatic migration plan. A page without detected
findings can still depend on behavior the scanner cannot evaluate.

The command does not modify the source project. Keep the generated report
separate from maintained site content and review it before acting on its
suggestions.
