const DEFAULT_URL = "http://192.168.55.168:3000/";
const LEGACY_URLS = new Set(["https://192.168.55.168/", "http://192.168.55.168/"]);

const frame = document.getElementById("auraFrame");
const fallback = document.getElementById("fallback");
const reloadButton = document.getElementById("reload");
const openButton = document.getElementById("open");
const settingsButton = document.getElementById("settings");
const fallbackOpenButton = document.getElementById("fallbackOpen");

let auraUrl = DEFAULT_URL;
let loaded = false;

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return DEFAULT_URL;
  if (LEGACY_URLS.has(trimmed)) return DEFAULT_URL;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return DEFAULT_URL;
    return url.toString();
  } catch {
    return DEFAULT_URL;
  }
}

function openAura() {
  chrome.tabs.create({ url: auraUrl });
}

function loadAura() {
  loaded = false;
  fallback.hidden = true;
  frame.hidden = false;
  frame.src = auraUrl;

  window.setTimeout(() => {
    if (!loaded) {
      frame.hidden = true;
      fallback.hidden = false;
    }
  }, 7000);
}

chrome.storage.sync.get({ auraUrl: DEFAULT_URL }, (items) => {
  auraUrl = normalizeUrl(items.auraUrl);
  if (auraUrl !== items.auraUrl) {
    chrome.storage.sync.set({ auraUrl });
  }
  loadAura();
});

frame.addEventListener("load", () => {
  loaded = true;
  fallback.hidden = true;
  frame.hidden = false;
});

reloadButton.addEventListener("click", () => {
  loadAura();
});

openButton.addEventListener("click", openAura);
fallbackOpenButton.addEventListener("click", openAura);

settingsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
