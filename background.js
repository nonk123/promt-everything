const CONCURRENCY_LIMIT = 8;
let fetchQueue = [];
let activeFetches = 0;

async function processRequest(request) {
    let addLeft = "", addRight = "";
    let body = request.text;
    let len = body.length;

    const trimLeft = body.trimStart().length;
    if (trimLeft < len) {
        addLeft = body.substring(0, len - trimLeft);
        body = body.substring(len - trimLeft);
        len = trimLeft;
    }

    const trimRight = body.trimEnd().length;
    if (trimRight < len) {
        addRight = body.substring(trimRight);
        body = body.substring(0, trimRight);
    }

    const url = `https://q7x.ru/promt?to=${request.targetLang}`;
    try {
        const response = await fetch(url, { method: "POST", body });
        const translation = addLeft + await response.text() + addRight;
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
            target: { tabId: tab.id },
        });
    } catch (ex) {
        console.error(ex);
    }
});
