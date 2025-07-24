#!/bin/bash

echo "===== 开始清理Nginx缓存 ====="

# 如果您使用的是标准Nginx缓存目录，可以使用以下命令
# 注意：需要sudo权限，请根据您的服务器配置调整路径
# sudo rm -rf /var/cache/nginx/*

# 如果您使用的是自定义缓存目录，请调整以下路径
rm -rf /www/server/nginx/proxy_cache_dir/*

echo "===== Nginx缓存清理完成，请重启Nginx服务器 =====" 