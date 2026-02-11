const CONCURRENCY_LIMIT = 8;
let fetchQueue = [];
let activeFetches = 0;

async function processRequest(request) {
    const url = `https://q7x.ru/promt?to=${request.targetLang}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            body: request.text,
        });
        request.sendResponse({
            success: true,
            translation: await response.text(),
        });
    } catch (error) {
        request.sendResponse({
            success: false,
            translation: "",
        })
    } finally {
        activeFetches--;
        processQueue();
    }
}

async function processQueue() { // "Google AI Overview" code :skull:
    while (fetchQueue.length > 0 && activeFetches < CONCURRENCY_LIMIT) {
        const request = fetchQueue.shift();
        activeFetches++;
        processRequest(request);
    }
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "promt") {
        request.sendResponse = sendResponse;
        fetchQueue.push(request);
        processQueue();
        return true;
    } else if (request.action == "promtQueueFull")
        sendResponse(fetchQueue.length > 0);
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
