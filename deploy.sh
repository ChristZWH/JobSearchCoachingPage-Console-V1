#!/usr/bin/env bash
#
# 控制台（Vite React SPA）一键部署：构建 -> 版本化发布 -> 原子切换符号链接 -> 健康检查
#
#   ./deploy.sh                构建并部署（版本号 = git 短提交号）
#   ./deploy.sh --build-only   只构建 dist/，不部署到 /srv
#   ./deploy.sh --versions     列出 /srv 上保留的历史版本
#   ./deploy.sh --rollback     回滚到上一个版本（也可以 --rollback abc1234 指定版本）
#
# 目录布局：
#   /srv/z-career/console/
#     releases/dist-<提交号>/   历史版本（保留最近 5 个）
#     current -> releases/dist-<提交号>    nginx root 指向这个符号链接
#
# 首次部署前先执行： sudo bash scripts/setup-nginx.sh <域名>
# 依赖变更时先手动执行 npm install（脚本只构建，不装依赖）
#
set -euo pipefail

ROOT_DIR=/srv/z-career/console
RELEASES_DIR="$ROOT_DIR/releases"
SYMLINK="$ROOT_DIR/current"
KEEP_VERSIONS=5
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 域名：优先环境变量，其次读取 setup-nginx.sh 保存的域名文件（健康检查用）
DOMAIN="${DOMAIN:-}"
DOMAIN_FILE=/srv/z-career/nginx-domain
if [[ -z "$DOMAIN" && -f "$DOMAIN_FILE" ]]; then
  DOMAIN="$(cat "$DOMAIN_FILE")"
fi
CONSOLE_DOMAIN="${CONSOLE_DOMAIN:-}"
CONSOLE_DOMAIN_FILE=/srv/z-career/nginx-console-domain
if [[ -z "$CONSOLE_DOMAIN" && -f "$CONSOLE_DOMAIN_FILE" ]]; then
  CONSOLE_DOMAIN="$(cat "$CONSOLE_DOMAIN_FILE")"
fi
CONSOLE_DOMAIN="${CONSOLE_DOMAIN:-console.$DOMAIN}"

MODE=deploy
case "${1:-}" in
  --build-only) MODE=build ;;
  --rollback)   MODE=rollback ;;
  --versions)   MODE=versions ;;
  "")           ;;
  *) echo "未知参数：$1（可用：--build-only / --rollback [版本] / --versions）" >&2; exit 1 ;;
esac

# ---------- 工具函数 ----------
fail() { echo -e "\n[失败] $*" >&2; exit 1; }

health_check() {
  if ! command -v nginx >/dev/null; then
    echo "==> 本机未安装 nginx，跳过健康检查"
    return 0
  fi
  if [[ -z "$CONSOLE_DOMAIN" ]]; then
    echo "==> 未找到域名配置（/srv/z-career/nginx-console-domain），跳过健康检查"
    return 0
  fi
  echo "==> 健康检查 http://${CONSOLE_DOMAIN}/"
  for i in {1..15}; do
    if curl -fsS --max-time 3 -H "Host: ${CONSOLE_DOMAIN}" http://127.0.0.1/ >/dev/null 2>&1; then
      echo "    第 ${i} 次探测通过，服务正常"
      return 0
    fi
    sleep 1
  done
  echo "    提示：请确认 nginx 已运行、scripts/setup-nginx.sh 已执行过"
  return 1
}

# ---------- 版本列表 ----------
if [[ "$MODE" == versions ]]; then
  echo "已发布版本："
  sudo ls -1 "$RELEASES_DIR" 2>/dev/null | grep -E '^dist-' | sed 's/^/  /'
  echo
  echo "当前版本：$([[ -L "$SYMLINK" ]] && readlink "$SYMLINK" || echo "（未部署）")"
  exit 0
fi

# ---------- 回滚 ----------
if [[ "$MODE" == rollback ]]; then
  [[ -L "$SYMLINK" ]] || fail "current 不是符号链接（旧版部署），无法按版本回滚"
  TARGET="${2:-}"
  if [[ -n "$TARGET" ]]; then
    # 指定版本：支持完整目录名 dist-xxxx 或短提交号 xxxx
    [[ "$TARGET" != dist-* ]] && TARGET="dist-$TARGET"
    sudo test -d "$RELEASES_DIR/$TARGET" || fail "找不到版本 $TARGET（可用 ./deploy.sh --versions 查看）"
  else
    # 默认回滚：去掉当前版本后，取 releases 里最新的一个历史版本
    CURRENT="$(basename "$(readlink "$SYMLINK")")"
    TARGET="$(sudo ls -1 "$RELEASES_DIR" | grep -E '^dist-' | grep -vx "$CURRENT" | sort | tail -1)"
    [[ -n "$TARGET" ]] || fail "没有可回滚的历史版本"
  fi
  echo "==> 回滚到 $TARGET"
  sudo ln -s "$TARGET" "$ROOT_DIR/current.new"
  sudo mv -Tf "$ROOT_DIR/current.new" "$SYMLINK"
  health_check || fail "回滚后健康检查未通过"
  echo -e "\n回滚完成。当前运行：$TARGET"
  exit 0
fi

# ---------- 构建 ----------
cd "$REPO_DIR"
command -v npm >/dev/null || fail "找不到 npm 命令"
VERSION="$(git rev-parse --short HEAD 2>/dev/null || echo "local-$(date +%Y%m%d-%H%M%S)")"
echo "==> 构建 (node $(node -v))  版本号：$VERSION"
npm run build || fail "构建失败，线上服务未受影响"

if [[ "$MODE" == build ]]; then
  echo -e "\n仅构建模式，产物在 dist/，未部署。"
  exit 0
fi

# ---------- 发布 ----------
sudo test -d "$ROOT_DIR" || fail "$ROOT_DIR 不存在，请先执行： sudo bash scripts/setup-nginx.sh"
sudo mkdir -p "$RELEASES_DIR"
test -f "$REPO_DIR/dist/index.html" || fail "dist/index.html 不存在，构建产物异常"

echo "==> 发布版本 dist-${VERSION}"
# 每次发布都是独立目录，用 rsync --delete 保证目录内不残留旧文件
sudo rsync -a --delete "$REPO_DIR/dist/" "$RELEASES_DIR/dist-$VERSION/"
# nginx（www-data）需要对静态文件有读权限
sudo chmod -R a+rX "$RELEASES_DIR/dist-$VERSION"

echo "==> 切换符号链接 current -> dist-${VERSION}"
# 先建 .new 再整体 rename，保证任意时刻 current 都指向一个完整版本
sudo ln -s "dist-$VERSION" "$ROOT_DIR/current.new"
sudo mv -Tf "$ROOT_DIR/current.new" "$SYMLINK"

# 清理：保留最近 KEEP_VERSIONS 个版本（不含当前版本），防止 releases 无限膨胀
CURRENT_TARGET="$(basename "$(readlink "$SYMLINK")")"
OLD_VERSIONS="$(sudo ls -1 "$RELEASES_DIR" | grep -E '^dist-' | grep -vx "$CURRENT_TARGET" | sort | head -n -"$KEEP_VERSIONS")"
if [[ -n "$OLD_VERSIONS" ]]; then
  echo "==> 清理过期版本（保留最近 ${KEEP_VERSIONS} 个）"
  echo "$OLD_VERSIONS" | sed 's/^/    - /'
  echo "$OLD_VERSIONS" | xargs -I{} sudo rm -rf "$RELEASES_DIR/{}"
fi

health_check || fail "部署后健康检查未通过（15 秒内 http://${CONSOLE_DOMAIN:-<控制台域名>}/ 无响应）"

echo
echo "部署完成。当前版本：$VERSION"
echo "  访问：     http://${CONSOLE_DOMAIN:-<控制台域名>}/"
echo "  查看版本： ./deploy.sh --versions"
echo "  回滚：     ./deploy.sh --rollback"
