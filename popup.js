translate.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (!tabs || !tabs.length)
            return;
        const args = { wasted: wasted.value };
        chrome.tabs.sendMessage(tabs[0].id, { action: "promtEverything", args }).then(res => {
            if (res.success)
                log.textContent = "Enjoy!\n";
            else
                log.textContent += "ERROR: " + res.error + "\n";
        })
    });
});
