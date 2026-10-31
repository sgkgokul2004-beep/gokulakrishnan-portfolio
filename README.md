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

The editor saves drafts in the current browser. In **Profile**, upload a JPG, PNG, or WebP profile image (up to 12 MB); it is resized and optimized automatically. Use **Preview draft** to see local edits; this preview is separate from the published portfolio.

To publish changes from the admin page, connect a fine-grained GitHub personal access token limited to `sgkgokul2004-beep/gokulakrishnan-portfolio` with only **Contents: Read and write** permission, then choose **Publish to all devices**. Use a short token expiration. The token is stored in this tab's session storage and is not included in portfolio exports. Publishing commits `portfolio.json` to `main`, which triggers the GitHub Pages deployment workflow. The live site normally updates within a few minutes; already-open portfolio pages check for new published content every 30 seconds. Uploaded images and certificates are included in the JSON, and browser storage limits apply.

You can still choose **Export JSON** to download a backup of the current draft. To publish manually, replace the project's `portfolio.json` with the downloaded file and commit/push it.

## Publish to GitHub Pages

1. Install GitHub CLI if needed: `winget install --id GitHub.cli`.
2. Authenticate: `gh auth login`.
3. Run **Portfolio: Publish to GitHub Pages** from VS Code Tasks. This creates or uses the public `gokulakrishnan-portfolio` repository, pushes the site, and enables the Pages workflow.

The site deploys through `.github/workflows/pages.yml`. The first deployment can take a few minutes.
