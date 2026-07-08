/**
 * Side-Effect-Modul: registriert alle Built-in-Gerätetypen genau einmal
 * beim ersten Import. Neue Typen können jederzeit über
 * {@link deviceRegistry.register} — auch dynamisch nachgeladen — dazukommen.
 */
import "./lighting";
import "./covers";
import "./openings";
import "./sensors";
import "./climate";
import "./media";
import "./security";
import "./energy";
import "./misc";
