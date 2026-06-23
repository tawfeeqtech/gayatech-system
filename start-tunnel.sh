#!/usr/bin/env bash
# ==============================================================
# سكريبت إدارة نفق Cloudflare لمشروع غايتك
# ==============================================================
set -e

PROJECT="غايتك"
PORT=5173
URL_FILE="/data/gayatech-system/.tunnel_url.txt"
LOG_FILE="/data/gayatech-system/tunnel.log"
PID_FILE="/data/gayatech-system/.tunnel.pid"
OLD_URL_FILE="/data/gayatech-system/.tunnel_old_url.txt"

log() { echo "[$(date '+%H:%M:%S')] $1" >> "$LOG_FILE"; echo "[$(date '+%H:%M:%S')] $1"; }

# === بدء النفق ===
start_tunnel() {
    log "🔄 تشغيل نفق TryCloudflare..."
    (
        ~/cloudflared tunnel --url http://localhost:$PORT 2>&1 | while IFS= read -r line; do
            echo "$line" >> "$LOG_FILE"
            URL=$(echo "$line" | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' | head -1)
            if [ -n "$URL" ]; then
                echo "$URL" > "$URL_FILE"
                log "✅ الرابط الجديد: $URL"
            fi
        done
    ) &
    echo $! > "$PID_FILE"

    for i in $(seq 1 30); do
        if [ -s "$URL_FILE" ]; then
            log "✅ النفق شغال: $(cat "$URL_FILE")"
            return 0
        fi
        sleep 1
    done
    log "⚠️ لم نتحصل على رابط (قد يحتاج وقت)"
    return 1
}

# === إيقاف النفق ===
stop_tunnel() {
    log "🛑 إيقاف..."
    [ -f "$PID_FILE" ] && { kill "$(cat "$PID_FILE")" 2>/dev/null || true; rm -f "$PID_FILE"; }
    pkill -f "cloudflared.*localhost:$PORT" 2>/dev/null || true
    log "✅ تم"
}

# === حالة النفق ===
get_url() {
    cat "$URL_FILE" 2>/dev/null || echo ""
}

is_running() {
    local PID
    [ -f "$PID_FILE" ] && { PID=$(cat "$PID_FILE"); kill -0 "$PID" 2>/dev/null && return 0; }
    return 1
}

# === وضع المراقب (watchdog) ===
# يستخدم من cron job, يطبع فقط إذا تغير الرابط
watchdog() {
    local OLD_URL NEW_URL
    OLD_URL=$(cat "$OLD_URL_FILE" 2>/dev/null || echo "")
    
    if is_running && [ -n "$(get_url)" ]; then
        # اختبر الرابط الحالي
        local CODE
        CODE=$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' "$(get_url)" 2>/dev/null || echo "000")
        if [ "$CODE" != "000" ]; then
            log "✅ النفق يعمل"
            NEW_URL=$(get_url)
            if [ "$NEW_URL" != "$OLD_URL" ]; then
                echo "$NEW_URL" > "$OLD_URL_FILE"
                echo "🔗 الرابط الجديد: $NEW_URL"
            fi
            return 0
        fi
        log "⚠️ النفق لا يستجيب، إعادة تشغيل..."
    else
        log "⚠️ النفق لا يعمل، إعادة تشغيل..."
    fi

    # إعادة تشغيل
    stop_tunnel > /dev/null 2>&1
    sleep 1
    start_tunnel
    return $?
}

# === التحقق من السيرفرات ===
ensure_servers() {
    local SERVER_OK CLIENT_OK
    curl -s --max-time 2 -o /dev/null http://localhost:5000/ && SERVER_OK=1 || SERVER_OK=0
    curl -s --max-time 2 -o /dev/null http://localhost:$PORT/ && CLIENT_OK=1 || CLIENT_OK=0
    
    [ "$SERVER_OK" = "0" ] && { log "⚠️ Express ساكت، أشغله..."; (cd /data/gayatech-system/server && node server.js &); }
    [ "$CLIENT_OK" = "0" ] && { log "⚠️ Vite ساكت، أشغله..."; (cd /data/gayatech-system/client && npx vite --host 0.0.0.0 --port $PORT &); }
    sleep 2
}

# === التنفيذ ===
case "${1:-start}" in
    start)
        ensure_servers
        stop_tunnel > /dev/null 2>&1
        sleep 1
        start_tunnel
        ;;
    stop)
        stop_tunnel
        ;;
    restart)
        ensure_servers
        stop_tunnel
        sleep 1
        start_tunnel
        ;;
    status)
        if is_running && [ -n "$(get_url)" ]; then
            echo "✅ يعمل: $(get_url)"
            curl -s --max-time 5 -o /dev/null -w "(HTTP %{http_code})" "$(get_url)" 2>/dev/null
            echo ""
        else
            echo "❌ لا يعمل"
            exit 1
        fi
        ;;
    url)
        get_url
        [ -z "$(get_url)" ] && { echo "لا يوجد رابط"; exit 1; }
        ;;
    watch)
        ensure_servers
        watchdog
        ;;
    *)
        echo "الاستخدام: $0 {start|stop|restart|status|url|watch}"
        exit 1
        ;;
esac
