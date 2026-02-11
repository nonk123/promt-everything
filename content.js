function promtEverything() {
    let fullText = "";
    let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode())
        fullText += walker.currentNode.textContent;

    const cyrillic = (fullText.match(/\p{Script=Cyrl}/gu) || []).length;
    const nonWhitespace = (fullText.match(/\S/gu) || []).length;
    const latin = nonWhitespace - cyrillic;
    const targetLang = cyrillic > latin ? "en" : "ru";

    walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const txt = node.textContent.trim();
        if (!txt.length)
            continue;
        const msg = { action: "promt", targetLang, text: txt };
        browser.runtime.sendMessage(msg).then(r => {
            if (!r.success) return;
            node.textContent = r.translation;
        });
    }
}

browser.runtime.sendMessage({ action: "promtQueueFull" }).then(full => {
    if (full) alert("Please wait for ProMT to finish first!");
    else promtEverything();
});
