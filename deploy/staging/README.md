# DK Theme staging image

Every pushed branch builds and publishes a multi-architecture nginx image as `ghcr.io/voidintheshell/dk_theme`. Pushes to `dev` deploy automatically; other branches deploy only when `workflow_dispatch` is run on that branch. After feature-branch acceptance, dispatch `dev` again to restore the shared development baseline. The image contains the Vite output under `/dk-theme/` and a root SPA entrypoint.

Each publish run adds a `build-<run_id>-<run_attempt>` version tag and reports the complete image reference in its `Report staging image tag` step and job summary. Staging pulls and stores that tag directly, without resolving or comparing image SHA256 values. Before a full Xboard rebuild, set that repository's `staging` Environment Variable `STAGING_DK_THEME_IMAGE` to the published reference, for example `ghcr.io/voidintheshell/dk_theme:build-123456789-1`.

The nginx routing contract is intentionally split:

- `/dk-theme/` serves immutable DK Theme assets.
- `/api`, `/ws`, subscription/theme/backend assets proxy to `xboard-app:7001`.
- A small in-container synchronizer reads the current secure path from Xboard using a Docker secret. Only that precise public path routes to `xboard-admin`; its `/original` child is the explicit compatibility fallback to the built-in Xboard panel.
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

If Xboard has not been deployed yet, the theme workflow only pulls and caches the exact image. Run the Xboard `dev` deployment afterward to create the full stack.
