const SEPARATOR = "\n\n----";
const BATCH_SIZE = 3072;

function processChunk(targetLang, nodes, chunk) {
    const msg = { action: "promt", targetLang, text: chunk };
    browser.runtime.sendMessage(msg).then(r => {
        if (!r.success) {
            console.error(r.error);
            return;
        }

        const strings = r.translation.split(SEPARATOR);
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
        const txt = node.textContent.trim();
        if (!txt.length)
            continue;
        if (chunk.length + txt.length + SEPARATOR.length >= BATCH_SIZE) {
            processChunk(targetLang, nodes, chunk);
            nodes = [], chunk = "";
        }
        nodes.push(node);
        chunk += txt + SEPARATOR;
    }
    processChunk(targetLang, nodes, chunk);
}

if (typeof browser === "undefined")
    window.browser = chrome;

browser.runtime.sendMessage({ action: "promtInProgress" }).then(inProgress => {
    if (inProgress)
        alert("Please wait for ProMT to finish first!");
    else
        promtEverything();
});
