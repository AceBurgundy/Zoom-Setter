//popup.js

/**
 * Represents the title element for displaying the zoom level message.
 * @type {HTMLElement}
 */
const title = document.getElementById("zoom-level-message");

/**
 * Represents the save button element for saving the new zoom level.
 * @type {HTMLElement}
 */
const saveButton = document.getElementById("save-zoom-level");

/**
 * Represents the tag element for displaying the zoom level tag.
 * @type {HTMLElement}
 */
const tag = document.getElementById("zoom-level-tag");

/**
 * Represents the previous URL visited.
 * @type {string|null}
 */
let previousURL = null;

/**
 * Executes when the window is loaded.
 */
window.onload = async () => {
    const currentZoomLevel = await getZoomLevel();
    setTitle(currentZoomLevel);

    const zoomLevelForURL = await getZoomLevelForCurrentURL();

    if (zoomLevelForURL === currentZoomLevel) {
        tag.textContent = "This urls current default zoom";
    } else {
        tag.textContent = "Mark as this urls new default";
    }
};

/**
 * Listens for tab updates and sets zoom level when switching to a new tab.
 */
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        const currentURL = changeInfo.url.hostname;
        previousURL = previousURL ?? currentURL;
        if (previousURL !== currentURL) await setZoom();
    }
});

/**
 * Listens for the click event on the save button and saves the new zoom level.
 */
saveButton.onclick = async () => saveNewZoom();

/**
 * Sets the title content with the provided zoom level.
 *
 * @param {number} zoomLevel - The zoom level to set in the title.
 */
const setTitle = (zoomLevel) => (title.textContent = parseFloat(zoomLevel * 100).toFixed(0) + "%");

/**
 * Gets the current active tab.
 *
 * @returns {Promise<browser.tabs.Tab>} - A Promise that resolves with the current active tab.
 */
const currentTab = async () => {
    const tabList = await browser.tabs.query({ active: true, currentWindow: true });
    return tabList[0];
};

/**
 * Gets the current URL of the active tab.
 *
 * @returns {Promise<string>} - A Promise that resolves with the current URL.
 */
const currentURL = async () => {
    const { url } = await currentTab();
    return new URL(url).hostname;
};

/**
 * Gets the zoom level of the current active tab.
 *
 * @returns {Promise<number>} - A Promise that resolves with the zoom level.
 */
const getZoomLevel = async () => {
    const { id } = await currentTab();
    return await browser.tabs.getZoom(id);
};

/**
 * Saves the new zoom level to local storage for the current URL and closes the popup window.
 */
async function saveNewZoom() {
    const zoomLevel = await getZoomLevel();
    const storageKey = await currentURL();

    await browser.storage.local.set({ [storageKey]: zoomLevel });
    window.close();
}

/**
 * Sets the zoom level for the current tab based on the saved zoom level for the current URL.
 */
async function setZoom() {
    const { id } = await currentTab();
    const zoomLevelForURL = await getZoomLevelForCurrentURL();

    if (!zoomLevelForURL) return;

    await browser.tabs.setZoom(id, zoomLevelForURL);
    setTitle(zoomLevelForURL);
}

/**
 * Gets the saved zoom level for the current URL from local storage.
 *
 * @returns {Promise<number|null>} - A Promise that resolves with the saved zoom level or null if not found.
 */
async function getZoomLevelForCurrentURL() {
    const storageKey = await currentURL();
    const savedZoomObject = await browser.storage.local.get(storageKey);
    const empty = Object.keys(savedZoomObject).length <= 0;

    if (empty) return null;

    const zoomLevelForURL = savedZoomObject[await currentURL()];
    return zoomLevelForURL ?? null;
}
