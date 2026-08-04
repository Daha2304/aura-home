const POPUP_WIDTH = 430;
const POPUP_HEIGHT = 960;

let popupWindowId = null;

function openAuraWindow() {
  if (popupWindowId !== null) {
    chrome.windows.update(popupWindowId, { focused: true }, () => {
      if (!chrome.runtime.lastError) return;
      popupWindowId = null;
      openAuraWindow();
    });
    return;
  }

  chrome.windows.create(
    {
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      width: POPUP_WIDTH,
      height: POPUP_HEIGHT,
      focused: true,
    },
    (window) => {
      popupWindowId = window?.id ?? null;
    },
  );
}

chrome.action.onClicked.addListener(openAuraWindow);

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) popupWindowId = null;
});
