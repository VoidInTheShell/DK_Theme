# DK Theme production deployment

The `main` workflow may deploy production only by manual dispatch. It passes the run-specific `build-<run_id>-<run_attempt>` version tag through the production host's root-owned forced-command dispatcher. It updates only `xboard-theme`, uses the panel deployment lock, and leaves `xboard-app`, `xboard-admin`, SQLite data, Xboard-Node and adjacent services untouched. After replacing Theme it validates the dynamic standalone-Admin route and gracefully reloads BunkerWeb so the generated upstream immediately follows the new container IP; the BunkerWeb container is not restarted. The restricted `xboard-ci` user cannot upload or execute arbitrary scripts and is not a Docker-group member.

The GitHub `production` Environment needs these values:

- Variables: `PRODUCTION_SSH_HOST`, `PRODUCTION_SSH_PORT`, `PRODUCTION_SSH_USER`, `PRODUCTION_PANEL_URL`, `PRODUCTION_ADMIN_PATH`
- Secrets: `PRODUCTION_DEPLOY_SSH_KEY`, `PRODUCTION_SSH_KNOWN_HOSTS`

`PRODUCTION_SSH_USER` must be `xboard-ci`. The trusted host-side script requires the three-container `/home/beihai/docker/xboard/compose.yaml` and `.deploy.env` installed by the Xboard production deployment. It treats the source SHA as an audit identifier, validates the exact DK Theme GHCR repository and Docker tag, requires both `xboard-app` and `xboard-admin` to exist, replaces only `DK_THEME_IMAGE`, and recreates only the Theme service. It does not resolve, compute, or compare image SHA256/digest values.

The final acceptance is executed by the allowlisted host verifier through the local BunkerWeb TLS listener with the real `panel.uegov.org` SNI. This verifies Theme/Admin health, a non-empty PNG MIME, the standalone administrator at the active dynamic path, the explicit `/original` fallback, and runtime isolation.
