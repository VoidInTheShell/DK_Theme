# DK Theme staging image

Every pushed branch builds and publishes a multi-architecture nginx image as `ghcr.io/voidintheshell/dk_theme`. Pushes to `main`, `master`, `dev`, and `new-dev`, plus opt-in `staging/**` branches, deploy automatically; other branches deploy only when `workflow_dispatch` is run on that branch. The image contains the Vite output under `/dk-theme/` and a root SPA entrypoint.

The nginx routing contract is intentionally split:

- `/dk-theme/` serves immutable DK Theme assets.
- `/api`, `/ws`, subscription/theme/backend assets, and Xboard's default eight-character hexadecimal admin path proxy to `xboard-app:7001`.
- Other paths fall back to the DK Theme SPA.

After an eligible automatic or manual dispatch, the workflow uses the `staging` GitHub Environment to update only `xboard-theme` on GJHK. It takes the same remote lock as the Xboard deployment, so a panel rebuild and theme update cannot modify the Compose project at the same time. The shared staging host is not branch-isolated; the latest successful theme deployment becomes current.

Required environment secrets:

- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_SSH_KNOWN_HOSTS`

Required environment variables:

- `STAGING_SSH_HOST`
- `STAGING_SSH_PORT`
- `STAGING_SSH_USER`
- `STAGING_PANEL_URL`

If Xboard has not been deployed yet, the theme workflow only pulls and caches the exact image. Run the Xboard `master` deployment afterward to create the full stack.
