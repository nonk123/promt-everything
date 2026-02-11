let fullText = "";
let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (walker.nextNode())
    fullText += walker.currentNode.textContent;

const cyrillic = (fullText.match(/\p{Script=Cyrl}/gu) || []).length;
const nonWhitespace = (fullText.match(/\S/gu) || []).length;
const latin = nonWhitespace - cyrillic;
const targetLang = cyrillic > latin ? "en" : "ru";

const queue = []
walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
    const node = walker.currentNode;
    const txt = node.textContent.trim();
    if (!txt.length)
        continue;
    const msg = { action: "promt", targetLang, text: txt };
    const promise = browser.runtime.sendMessage(msg).then(r => {
        if (!r.success) return;
        node.textContent = r.translation;
    });
    queue.push(promise);
}

Promise.all(queue);
