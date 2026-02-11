const CONCURRENCY_LIMIT = 8;
let fetchQueue = [];
let activeFetches = 0;

async function processRequest(request) {
    const url = `https://q7x.ru/promt?to=${request.targetLang}`;
    try {
        const response = await fetch(url, { method: "POST", body: request.text });
        const translation = await response.text();
        request.sendResponse({ success: true, translation });
    } catch (error) {
        request.sendResponse({ success: false, error });
    } finally {
        activeFetches--;
        processQueue();
    }
}

async function processQueue() { // "Google AI Overview" code :skull:
    while (fetchQueue.length > 0 && activeFetches < CONCURRENCY_LIMIT) {
        activeFetches++;
        processRequest(fetchQueue.shift());
    }
}

if (typeof browser === "undefined")
    globalThis.browser = chrome;

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "promt") {
        request.sendResponse = sendResponse;
        fetchQueue.push(request);
        processQueue();
        return true;
    } else if (request.action == "promtInProgress") {
        sendResponse(fetchQueue.length > 0 || activeFetches > 0);
    }
})

browser.action.onClicked.addListener(async (tab) => {
    try {
        await browser.scripting.executeScript({
            files: ["content.js"],
            target: {
                tabId: tab.id,
            },
        });
    } catch (ex) {
        console.error(ex);
    }
});
