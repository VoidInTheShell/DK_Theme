# DK Theme production deployment

The `main` workflow deploys the immutable image digest built by the same run through the production host's root-owned forced-command dispatcher. It updates only `xboard-theme`, uses the panel deployment lock, and leaves `xboard-app`, its SQLite data, BunkerWeb, Xboard-Node and adjacent services untouched. The restricted `xboard-ci` user cannot upload or execute arbitrary scripts and is not a Docker-group member.

The GitHub `production` Environment needs these values:

- Variables: `PRODUCTION_SSH_HOST`, `PRODUCTION_SSH_PORT`, `PRODUCTION_SSH_USER`, `PRODUCTION_PANEL_URL`, `PRODUCTION_ADMIN_PATH`
- Secrets: `PRODUCTION_DEPLOY_SSH_KEY`, `PRODUCTION_SSH_KNOWN_HOSTS`

`PRODUCTION_SSH_USER` must be `xboard-ci`. The trusted host-side script requires `/home/beihai/docker/xboard/compose.yaml` and `.deploy.env` to have been installed by the Xboard production deployment. It checks that the requested SHA is the current DK Theme `main`, checks the pulled image's revision label, replaces only `DK_THEME_IMAGE`, and recreates only the theme service.
