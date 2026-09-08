# DK Theme production deployment

The `main` workflow deploys the immutable image digest built by the same run to the existing JPGREEN Xboard stack. It updates only `xboard-theme`, uses the panel deployment lock, and leaves `xboard-app`, its SQLite data, BunkerWeb, Xboard-Node and adjacent services untouched.

The GitHub `production` Environment needs these values:

- Variables: `PRODUCTION_SSH_HOST`, `PRODUCTION_SSH_PORT`, `PRODUCTION_SSH_USER`, `PRODUCTION_PANEL_URL`, `PRODUCTION_ADMIN_PATH`
- Secrets: `PRODUCTION_SSH_PRIVATE_KEY`, `PRODUCTION_SSH_KNOWN_HOSTS`

The script requires `/home/beihai/docker/xboard/compose.yaml` and `.deploy.env` to have been installed by the Xboard production workflow. It replaces only `DK_THEME_IMAGE` with an immutable `ghcr.io/voidintheshell/dk_theme@sha256:...` reference and recreates only the theme service.
