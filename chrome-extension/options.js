const DEFAULT_URL = "https://192.168.55.168/";

const input = document.getElementById("auraUrl");
const saveButton = document.getElementById("save");
const status = document.getElementById("status");

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return DEFAULT_URL;
  const url = new URL(trimmed);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Nur http oder https ist erlaubt.");
  }
  return url.toString();
}

chrome.storage.sync.get({ auraUrl: DEFAULT_URL }, (items) => {
  input.value = items.auraUrl;
});

saveButton.addEventListener("click", () => {
  try {
    const auraUrl = normalizeUrl(input.value);
    chrome.storage.sync.set({ auraUrl }, () => {
      input.value = auraUrl;
      status.textContent = "Gespeichert";
      window.setTimeout(() => {
        status.textContent = "";
      }, 2200);
    });
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Ungueltige URL";
  }
});
