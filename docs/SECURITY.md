# Security-Vorbereitung

Dieser Client hat keinen eigenen Server-Runtime — alle Header und CSP-Regeln
gehören in den Reverse-Proxy (nginx, Caddy, Traefik) vor dem Static-Hosting.

## Empfohlene Header (Reverse Proxy)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Content Security Policy (Basis)

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' ws: wss:;
manifest-src 'self';
worker-src 'self';
```

`connect-src` muss die WebSocket-URL des ioBroker-Servers enthalten
(z. B. `wss://iobroker.local:8099`).

## Secret-Handling

- Keine Secrets im Client-Bundle. `VITE_*` ist öffentlich.
- Server-Credentials und Reverse-Proxy-Keys leben in der Infra, nicht im Repo.
- ioBroker-Zugangsdaten kommen zur Laufzeit vom Benutzer (Onboarding-Flow).
