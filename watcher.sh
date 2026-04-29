nohup bash -c '
while true; do
  DUMP=$(ls -1 /tmp/mesas-beta-predeploy-*.dump 2>/dev/null | head -n 1)
  if [ -n "$DUMP" ]; then
    echo "Snapshot $DUMP detectado."
    OLD_ID=$(docker ps -q -f name=mesas-beta-frontend)
    while true; do
      NEW_ID=$(docker ps -q -f name=mesas-beta-frontend)
      if [ -n "$NEW_ID" ] && [ "$NEW_ID" != "$OLD_ID" ]; then
        break
      fi
      sleep 1
    done

    echo "Aguardando novo frontend ficar healthy..."
    while true; do
      STATUS=$(docker inspect -f "{{.State.Health.Status}}" mesas-beta-frontend 2>/dev/null || echo "missing")
      if [ "$STATUS" = "healthy" ]; then
        echo "Healthy! Injetando erro na rota de tables!"
        docker exec mesas-beta-frontend sh -c "echo \"server { listen 80; server_name localhost; location /api/v1/tables { return 500; } location / { root /usr/share/nginx/html; index index.html; } }\" > /etc/nginx/conf.d/default.conf && nginx -s reload" > /tmp/t034_nginx.log 2>&1
        break 2
      fi
      sleep 0.1
    done
  fi
  sleep 1
done
' >/tmp/t034_watcher.out 2>&1 &
echo "watcher_started"
