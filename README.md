# Gokulakrishnan S Portfolio

A responsive static portfolio with a browser-based content studio.

The portfolio includes an animated light/dark mode switch in the header. The selected mode is saved in the current browser; the first visit follows the device color preference.

## Preview locally

From this folder, run:

```powershell
py -3.12 -m http.server 4173
```

Open `http://localhost:4173` for the portfolio or `http://localhost:4173/admin.html` for the editor.

## Edit content

The editor saves drafts in the current browser. In **Profile**, upload a JPG, PNG, or WebP profile image (up to 12 MB); it is resized and optimized automatically. Keep the editor and **Preview draft** open in tabs on the same local site to see autosaved changes appear in the portfolio automatically. To publish changes, choose **Export JSON**, replace the project's `portfolio.json` with the downloaded file, and commit/push it. Uploaded images and certificates are included in the exported JSON. Browser storage limits apply.

## Publish to GitHub Pages

1. Install GitHub CLI if needed: `winget install --id GitHub.cli`.
2. Authenticate: `gh auth login`.
3. Run **Portfolio: Publish to GitHub Pages** from VS Code Tasks. This creates or uses the public `gokulakrishnan-portfolio` repository, pushes the site, and enables the Pages workflow.

The site deploys through `.github/workflows/pages.yml`. The first deployment can take a few minutes.
