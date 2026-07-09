# Deployment

Die App ist ein statisches Bundle (TanStack Start / Vite). Kein Backend nötig
außer dem ioBroker.

## Proxmox / HTTPS / Reverse Proxy

1. `bun run build` erzeugt das Produktions-Bundle unter `dist/`.
2. Statisch ausliefern (nginx, Caddy). Beispiel Caddy:

   ```
   smarthome.local {
     encode zstd gzip
     root * /var/www/smarthome
     file_server
     try_files {path} /index.html
     header {
       Strict-Transport-Security "max-age=31536000; includeSubDomains"
       X-Content-Type-Options nosniff
       Referrer-Policy strict-origin-when-cross-origin
     }
   }
   ```

3. WebSocket zum ioBroker: entweder direkte Verbindung `wss://iob.local:8099`
   oder Proxy-Pass unter `/ws`.

## Environment

- `VITE_APP_NAME`, `VITE_APP_VERSION`, `VITE_PUBLIC_URL`
- Alles Server-seitige (TLS-Zertifikate, WS-Auth) läuft am Reverse Proxy.

## Capacitor (optional)

`capacitor.config.ts` ist vorbereitet. Für Android:

```
bunx cap add android
bun run build && bunx cap sync android
bunx cap open android
```

Keine nativen Plugins nötig — die Web-Runtime enthält alle Features.
