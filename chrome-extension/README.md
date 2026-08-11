# Aura Home Chrome Extension

Diese Extension zeigt Aura Home als kompaktes Chrome-Popup in Handybreite.

## Lokal in Chrome laden

1. Chrome oeffnen.
2. `chrome://extensions` aufrufen.
3. Rechts oben `Entwicklermodus` aktivieren.
4. `Entpackte Erweiterung laden` klicken.
5. Diesen Ordner auswaehlen:
   `Aura-Home-App/chrome-extension`

Standard-Adresse fuer das Chrome-Popup: `http://192.168.55.168:3000/`

Die Adresse kann ueber das Zahnrad im Popup angepasst werden.

## Hinweise

- Das Popup nutzt direkt den lokalen Aura-Home App-Port, damit Chrome im eingebetteten Popup nicht am lokalen HTTPS-Zertifikat haengen bleibt.
- Das Popup schliesst automatisch, wenn ausserhalb geklickt wird. Chrome begrenzt die maximale Popup-Hoehe selbst.
- Die Extension baut keine eigene Smart-Home-Logik, sondern laedt die echte Aura-Home-Webseite.
