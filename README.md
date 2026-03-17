# 3D Viewer Online

Static browser app for viewing and editing `STL`, `OBJ`, and `3MF` files with:

- three-pane layout
- filament presets for `PLA`, `PETG`, `TPU`, and `ABS`
- whole-model recoloring with a palette or custom color
- orbit, move, rotate, and scale tools
- split/cut workflow
- paint-on-mesh workflow
- measurement modes for distances, angles, face angles, and radius/diameter

## Run locally

Serve the folder with a simple local web server so the ES modules load correctly.

```powershell
cd d:\SELF_LEARNING\VS_CODE\3D_VIEWER_ONLINE
py -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Publish to GitHub Pages

This project is now configured for GitHub Pages with a GitHub Actions workflow in `.github/workflows/deploy-pages.yml`.

1. Create a new GitHub repository for this folder.
2. Add the remote and push `main`.

```powershell
cd d:\SELF_LEARNING\VS_CODE\3D_VIEWER_ONLINE
git add .
git commit -m "Prepare GitHub Pages deployment"
git remote add origin https://github.com/<your-username>/3d-viewer-online.git
git push -u origin main
```

3. In GitHub, open `Settings` -> `Pages`.
4. Under `Build and deployment`, set `Source` to `GitHub Actions`.
5. Wait for the `Deploy GitHub Pages` workflow to finish.

Your site URL will be:

```text
https://<your-username>.github.io/3d-viewer-online/
```

If you create the repository with the special name `<your-username>.github.io`, the site will instead publish at the root domain:

```text
https://<your-username>.github.io/
```

## Notes

- `Reset Split` restores the model state from before the cut was applied.
- Radius and diameter measurement use three picked points on a circular feature.
- Paint uses the currently selected palette color.
