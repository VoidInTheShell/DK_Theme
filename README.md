# DK Theme for XBoard

基于 React + Vite + TypeScript 的 XBoard 用户面板主题，是 Xboard Compose
套件的公网入口：对外服务用户前端，把面板 API 代理到后端，并把管理后台
（Xboard-Admin）路由到 `/<管理员路径>/`。

演示站：
- https://dk-theme.vercel.app/
- 账号密码随意填写
![](https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/landscape/webp/20260418-2f94ebb2.webp)
![](https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/landscape/webp/20260418-7aaf7182.webp)
![](https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/landscape/webp/20260418-7cdc6df1.webp)
![](https://pub-56954302827c4850ac0f10fdb853206b.r2.dev/landscape/webp/20260418-7debfa7e.webp)

## 在 Xboard 套件中的角色

默认部署（见 [Xboard Docker Compose 文档](../Xboard/docs/en/installation/docker-compose.md)）中：

- 用户访问 `https://面板域名/`，由本主题服务；
- `/<管理员路径>/` 被路由到独立的 Xboard-Admin 容器，`/<管理员路径>/original`
  保留后端内置管理视图；管理员路径令牌由后端与主题共享
  （`ADMIN_ROUTE_TOKEN_FILE`），路径变更无需重新构建镜像；
- `/api/*` 由主题代理到后端容器；
- 入口 HTTPS 与证书由 Caddy 入口（`compose.entry.sample.yaml`）或既有反向代理
  终结，主题本身仅提供 HTTP。

发布镜像：`ghcr.io/voidintheshell/dk_theme:VERSION`（必须使用准确版本 tag，
版本来自 Xboard 发布清单的 component suite）。主题的升级由面板更新器执行，
在 Admin「版本更新」页面选择版本。

## 本地开发

```bash
npm install
cp .env.example .env
npm run dev
```

`.env` 常用项：

```env
VITE_APP_NAME=Site Name
VITE_API_BASE_URL=/          # 或指向本地后端 http://127.0.0.1:7001
VITE_ENABLE_MOCK=true        # mock 模式本地预览，无需后端
```

- `VITE_SUPPORT_TELEGRAM_*`：客服 / 群组入口；
- `VITE_DOWNLOAD_*`：各平台客户端下载链接；
- `VITE_NODE_STATUS_API_PATH` / `VITE_NODE_STATUS_REFRESH_INTERVAL_MS`：节点状态
  轮询。

## 构建

```bash
npm run build              # 产物输出到 dist/
npm run export:release     # 导出独立静态发布目录
```

修改 `.env` 后需重启开发服务器或重新构建。

## 独立静态部署（套件之外）

镜像内为 nginx：静态资源 + API 反代 + 管理路径路由（由
`xboard-admin-route-sync` 从共享令牌文件生成）。套件之外自行部署时，可用
`npm run export:release` 的静态产物配合自己的反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/dk-theme/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 面板 API 转发到 Xboard 后端
    location /api/ {
        proxy_pass http://127.0.0.1:7001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 如何确认配置已生效

1. 检查页面标题和侧边栏品牌名是否变化；
2. 打开浏览器 Network，确认请求发往你自己的 `VITE_API_BASE_URL`；
3. 如果仍显示演示数据，确认 `VITE_ENABLE_MOCK=false`；
4. 运行 `npm run build`，确认成功产出 `dist/`。

## 发布与版本

发布流程见 [.github/README.md](.github/README.md)：dev 推送发布
`vNEXT-dev.RUN_ID.RUN_ATTEMPT` 预发布；正式版由工作流输入
`release_version` 发布。发布物为 schema 2 的 `release-manifest.json` 与双架构
镜像，发布不自动部署。

## 主题定制 / 技术咨询

- [TG@derrickill](https://t.me/derrickill)
- [官方TG群组](https://t.me/DK_Theme)

## License

MIT

## 说明

本仓库仅提供前端主题工程，不包含任何生产后端凭据、账号数据或私有服务信息。
