const SEPARATOR = "\n\nЂ\n\n";
const SEPARATOR_REGEX = /\n{2}Ђ\n{0,2}/;

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

        if (!node.isConnected)
            return;

        if (!depth)
            node.textContent = "";
        node.textContent += r.translation;

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

        const strings = r.translation.split(SEPARATOR_REGEX);
        while (nodes.length > 0 && strings.length > 0) {
            const node = nodes.pop();
            const text = strings.pop();

            if (node.isConnected)
                node.textContent = text;
        }
    });
}

function createTreeWalker() {
    return document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
}

function determineTargetLang() {
    let fullText = "";
    const walker = createTreeWalker();
    while (walker.nextNode())
        fullText += walker.currentNode.textContent;

    const cyrillic = (fullText.match(/\p{Script=Cyrl}/gu) || []).length;
    const nonWhitespace = (fullText.match(/\S/gu) || []).length;
    const latin = nonWhitespace - cyrillic;
    return cyrillic > latin ? "en" : "ru";
}

function promtEverything() {
    const targetLang = determineTargetLang();
    const walker = createTreeWalker();
    let chunk = "", nodes = [];

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent;

        if (!text.trim().length)
            continue;

        if (text.bytes >= BATCH_SIZE) {
            processLongString(targetLang, node, text, 0);
            continue;
        }

        if (chunk.bytes + text.bytes + SEPARATOR.bytes >= BATCH_SIZE) {
            processBatch(targetLang, nodes, chunk);
            nodes = [], chunk = "";
        }

        nodes.push(node);
        if (chunk.length)
            chunk += SEPARATOR;
        chunk += text;
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
