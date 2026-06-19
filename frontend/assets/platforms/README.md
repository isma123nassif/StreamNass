# Platform logos

Drop the platform logo image files in this folder to show them on the
"Plataformas de Streaming" tiles of the home screen. Until a file is present,
the tile shows the platform name in its brand colour (fallback).

Expected file names (must match exactly, PNG with transparent background
recommended, ideally wider than tall, ~600×200):

- `netflix.png`
- `prime.png`
- `hbomax.png`
- `appletv.png`
- `disney.png`

These are served at `/platforms/<name>.png` (configured in
`webpack.config.js` CopyWebpackPlugin → `assets/platforms` → `platforms`).
After adding files, restart the dev server so they are copied/served.

To change a file name, ratio or add a platform, edit the `logo` field in
`src/routes/Board/usePlatformRows.js`.

Note: brand logos are trademarked assets — add only logos you have the right
to use. The app ships with no logo files; only the wiring is provided.
