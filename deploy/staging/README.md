# DK Theme staging image

`main` builds a multi-architecture nginx image and publishes it as `ghcr.io/voidintheshell/dk_theme`. The image contains the Vite output under `/dk-theme/` and a root SPA entrypoint.

The nginx routing contract is intentionally split:

- `/dk-theme/` serves immutable DK Theme assets.
- `/api`, `/ws`, subscription/theme/backend assets, and Xboard's default eight-character hexadecimal admin path proxy to `xboard-app:7001`.
- Other paths fall back to the DK Theme SPA.

After publishing, the workflow uses the `staging` GitHub Environment to update only `xboard-theme` on GJHK. It takes the same remote lock as the Xboard deployment, so a panel rebuild and theme update cannot modify the Compose project at the same time.

Required environment secrets:

- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_SSH_KNOWN_HOSTS`

Required environment variables:

- `STAGING_SSH_HOST`
- `STAGING_SSH_PORT`
- `STAGING_SSH_USER`
- `STAGING_PANEL_URL`

If Xboard has not been deployed yet, the theme workflow only pulls and caches the exact image. Run the Xboard `master` deployment afterward to create the full stack.
