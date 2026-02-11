const SEPARATOR = "\n\n----";
const BATCH_SIZE = 4096;

Object.defineProperty(String.prototype, "bytes", {
    get: function () {
        return new TextEncoder().encode(this).length;
    }
})

function processLongString(targetLang, node, remainder, depth) {
    if (!remainder.length)
        return;

    const chunk = remainder.bytes > BATCH_SIZE ? remainder.substring(0, BATCH_SIZE) : remainder;
    remainder = remainder.bytes > BATCH_SIZE ? remainder.substring(BATCH_SIZE) : "";

    const msg = { action: "promt", targetLang, text: chunk };
    browser.runtime.sendMessage(msg).then(r => {
        if (!r.success) {
            console.error(r.error);
            return;
        }
        node.textContent = depth ? r.translation : node.textContent + r.translation;
        processLongString(targetLang, node, remainder, depth + 1);
    });
}

function processBatch(targetLang, nodes, chunk) {
    if (!nodes.length || !chunk.length)
        return;

    const msg = { action: "promt", targetLang, text: chunk };
    browser.runtime.sendMessage(msg).then(r => {
        if (!r.success) {
            console.error(r.error);
            return;
        }

        const strings = r.translation.trim().split(SEPARATOR);
        while (nodes.length) {
            const node = nodes.shift();
            const text = strings.shift();
            if (node.isConnected)
                node.textContent = text;
        }
    });
}

function determineTargetLang() {
    let fullText = "";
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode())
        fullText += walker.currentNode.textContent;

    const cyrillic = (fullText.match(/\p{Script=Cyrl}/gu) || []).length;
    const nonWhitespace = (fullText.match(/\S/gu) || []).length;
    const latin = nonWhitespace - cyrillic;
    return cyrillic > latin ? "en" : "ru";
}

function promtEverything() {
    const targetLang = determineTargetLang();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let chunk = "", nodes = [];

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent;

        if (!text.length)
            continue;

        const long = text.bytes >= BATCH_SIZE;
        const batchFull = chunk.bytes + text.bytes + SEPARATOR.bytes >= BATCH_SIZE;

        if (long || batchFull) {
            processBatch(targetLang, nodes, chunk);
            nodes = [], chunk = "";
        }

        if (long) {
            processLongString(targetLang, node, text, 0)
        } else {
            nodes.push(node);
            chunk += text + SEPARATOR;
        }
    }

    processBatch(targetLang, nodes, chunk);
}

if (typeof browser === "undefined")
    window.browser = chrome;

browser.runtime.sendMessage({ action: "promtInProgress" }).then(inProgress => {
    if (inProgress)
        alert("Please wait for ProMT to finish first!");
    else
        promtEverything();
});
