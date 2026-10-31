# Gokulakrishnan S Portfolio

A responsive static portfolio with a browser-based content studio.

## Preview locally

From this folder, run:

```powershell
py -3.12 -m http.server 4173
```

Open `http://localhost:4173` for the portfolio or `http://localhost:4173/admin.html` for the editor.

## Edit content

The editor saves drafts in the current browser. Use **Export JSON** to download the updated `portfolio.json`, replace the project's `portfolio.json`, and commit/push it to publish changes. Image uploads are optimized; PDFs and certificates are included in the exported JSON. Browser storage limits apply, so keep uploaded files small.

## Publish to GitHub Pages

1. Install GitHub CLI if needed: `winget install --id GitHub.cli`.
2. Authenticate: `gh auth login`.
3. Run **Portfolio: Publish to GitHub Pages** from VS Code Tasks. This creates or uses the public `gokulakrishnan-portfolio` repository, pushes the site, and enables the Pages workflow.

The site deploys through `.github/workflows/pages.yml`. The first deployment can take a few minutes.
