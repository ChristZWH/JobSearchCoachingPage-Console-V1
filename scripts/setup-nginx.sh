#!/usr/bin/env bash
#
# 首次安装 nginx 站点配置（主站 + 控制台两个 server 块）
#
#   sudo bash scripts/setup-nginx.sh z-career.com                    # 控制台用 console.z-career.com
#   sudo bash scripts/setup-nginx.sh z-career.com z-career-console.z-career.com
#
# 前置条件：
#   1. nginx 已安装： sudo apt update && sudo apt install -y nginx
#   2. 域名 DNS 已解析到本服务器（主域名、www、控制台子域名三条 A 记录）
#
# 做的事：
#   - 用 scripts/z-career.nginx.conf 模板生成 /etc/nginx/sites-available/z-career.conf
#   - 域名记录到 /srv/z-career/nginx-domain、nginx-console-domain（deploy.sh 健康检查用）
#   - 创建 /srv/z-career/console/releases 部署目录
#   - 禁用默认站点、启用 z-career 配置、校验并重载
#
set -euo pipefail

fail() { echo "[失败] $*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || fail "请用 sudo 运行： sudo bash scripts/setup-nginx.sh <主域名> [控制台域名]"
command -v nginx >/dev/null || fail "未安装 nginx，先执行： sudo apt update && sudo apt install -y nginx"

# 去掉用户可能手滑带上的协议和路径
DOMAIN="${1:-}"
[[ -z "$DOMAIN" ]] && { echo "用法: sudo bash scripts/setup-nginx.sh <主域名> [控制台域名]" >&2; exit 1; }
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN%%/*}"
[[ "$DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]] || fail "域名格式不对：$DOMAIN"

CONSOLE_DOMAIN="${2:-console.$DOMAIN}"
CONSOLE_DOMAIN="${CONSOLE_DOMAIN#http://}"
CONSOLE_DOMAIN="${CONSOLE_DOMAIN#https://}"
CONSOLE_DOMAIN="${CONSOLE_DOMAIN%%/*}"
[[ "$CONSOLE_DOMAIN" =~ ^[a-zA-Z0-9.-]+$ ]] || fail "控制台域名格式不对：$CONSOLE_DOMAIN"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. 生成站点配置（替换模板里的占位符）
sed -e "s/__DOMAIN__/$DOMAIN/g" -e "s/__CONSOLE_DOMAIN__/$CONSOLE_DOMAIN/g" \
    "$SCRIPT_DIR/z-career.nginx.conf" > /etc/nginx/sites-available/z-career.conf
echo "==> 已生成 /etc/nginx/sites-available/z-career.conf"
echo "    主站：   $DOMAIN / www.$DOMAIN"
echo "    控制台： $CONSOLE_DOMAIN"

# 控制台主机记录标签（console.z-career.com -> console），DNS 提示里用
CONSOLE_HOST="${CONSOLE_DOMAIN%.$DOMAIN}"
[[ "$CONSOLE_HOST" == "$CONSOLE_DOMAIN" ]] && CONSOLE_HOST="$CONSOLE_DOMAIN"

# 2. 记录域名（deploy.sh 健康检查用）+ 创建部署目录
echo "$DOMAIN" > /srv/z-career/nginx-domain
echo "$CONSOLE_DOMAIN" > /srv/z-career/nginx-console-domain
mkdir -p /srv/z-career/console/releases
echo "==> 已创建 /srv/z-career/console/releases"

# 3. 禁用默认站点，启用我们的配置
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/z-career.conf /etc/nginx/sites-enabled/z-career.conf
echo "==> 已启用 z-career 站点（默认站点已禁用）"

# 4. 校验并重载
nginx -t || fail "nginx 配置校验未通过"
systemctl enable nginx >/dev/null 2>&1 || true
systemctl reload nginx 2>/dev/null || systemctl start nginx
echo "==> nginx 已重载"

cat <<EOF

============================================
  nginx 配置完成
============================================
接下来（按顺序）：

1. DNS 解析（在域名服务商控制台添加 A 记录，指向本服务器 IP）：
     记录类型  主机记录        记录值
     A         @               <服务器公网 IP>
     A         www             <服务器公网 IP>
     A         $CONSOLE_HOST               <服务器公网 IP>   （对应 $CONSOLE_DOMAIN）

2. 后端 CORS 白名单：把控制台域名加入生产后端配置
   编辑 /srv/z-career/backend/.env，找到 ALLOWED_ORIGINS，追加：
     http://${CONSOLE_DOMAIN}
   然后：
     sudo systemctl restart zcareer-backend

3. 部署控制台（在控制台仓库执行）：
     ./deploy.sh

4. 主站已在 Docker 容器运行（:3000），无需额外操作

5. 放行 80 端口（云安全组 + 本机 ufw 两层都要看）：
     sudo ufw allow 80/tcp

6. 验证（DNS 生效后）：
     http://${DOMAIN}/          主站
     http://${CONSOLE_DOMAIN}/  控制台
   DNS 未生效时可用 curl 验证：
     curl -H "Host: ${CONSOLE_DOMAIN}" http://127.0.0.1/
EOF
