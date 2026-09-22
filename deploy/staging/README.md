# DK Theme staging image

Every pushed branch builds and publishes a multi-architecture nginx image as `ghcr.io/voidintheshell/dk_theme`. **CI deployment is suspended (since 2026-09-15):** the staging deploy job is hard-disabled with a `false &&` guard, so pushes and manual dispatches only build, test, and publish releases; GJHK is updated through the panel's Admin version-update UI (or MCP update tasks) by selecting an exact published version, and the deploy assets in this directory are retained as the documented manual emergency/recovery path. Historically, pushes to `dev` deployed automatically, other branches deployed through `workflow_dispatch`, and a final `dev` dispatch restored the shared development baseline. The image contains the Vite output under `/dk-theme/` and a root SPA entrypoint.

Each publish run adds a `build-<run_id>-<run_attempt>` version tag and reports the complete image reference in its `Report staging image tag` step and job summary. Staging pulls and stores that tag directly, without resolving or comparing image SHA256 values. Before a full Xboard rebuild, set that repository's `staging` Environment Variable `STAGING_DK_THEME_IMAGE` to the published reference, for example `ghcr.io/voidintheshell/dk_theme:build-123456789-1`.

The nginx routing contract is intentionally split:

- `/dk-theme/` serves immutable DK Theme assets.
- `/api`, `/ws`, subscription/theme/backend assets proxy to `xboard-app:7001`.
- A small in-container synchronizer reads the current secure path from Xboard using a Docker secret. Only that precise public path routes to `xboard-admin`; its `/original` child is the explicit compatibility fallback to the built-in Xboard panel.
- Other paths fall back to the DK Theme SPA.

The suspended deploy job used the `staging` GitHub Environment to update only `xboard-theme` on GJHK under the same remote lock as the Xboard deployment, so a panel rebuild and theme update could not modify the Compose project at the same time. The shared staging host is not branch-isolated; the latest successful deployment becomes current.

Required environment secrets:

- `STAGING_SSH_PRIVATE_KEY`
- `STAGING_SSH_KNOWN_HOSTS`

Required environment variables:

- `STAGING_SSH_HOST`
- `STAGING_SSH_PORT`
- `STAGING_SSH_USER`
- `STAGING_PANEL_URL`

If Xboard has not been deployed yet, the theme workflow only pulls and caches the exact image; the full stack is created by the Xboard deployment (currently the manual recovery path or a fresh Compose install).
