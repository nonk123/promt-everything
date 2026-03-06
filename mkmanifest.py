#!/usr/bin/env python

import json
import sys

NAME = "ProMT Everything"
DESCRIPTION = "Adds a button that feeds your whole tab into ProMT through an external public API."
VERSION = "0.1.0"

GECKO_ID = "promt-everything@nonk.dev"

ICONS = {
    "16": "icons/16.png",
    "24": "icons/24.png",
    "32": "icons/32.png",
    "48": "icons/48.png"
}

PERMISSIONS = ["activeTab"]
HOST_PERMISSIONS = ["https://q7x.ru/promt"]

ACTION = {
    "default_popup": "popup.html",
    "default_icon": ICONS,
}

WORKER_SCRIPT = "background.js"
CONTENT_SCRIPTS = [
    {
        "matches": [
            "<all_urls>"
        ],
        "js": [
            "content.js"
        ]
    }
]

generator = sys.argv[1]
if generator != "firefox" and generator != "chrome":
    print("meh")
    sys.exit(1)

browser_specifics = {} if generator == "chrome" else {
    "browser_specific_settings": {
        "gecko": {
            "id": GECKO_ID,
            "data_collection_permissions": {
                "required": ["none"]
            }
        },
    }
}

background = {
    "background": {
        "scripts": [WORKER_SCRIPT],
    }
} if generator == "firefox" else {
    "background": {
        "service_worker": WORKER_SCRIPT
    }
}

manifest = {
    "manifest_version": 3,
    "name": NAME,
    "version": VERSION,
    "description": DESCRIPTION,
    "icons": ICONS,
    "permissions": PERMISSIONS,
    "host_permissions": HOST_PERMISSIONS,
    "action": ACTION,
    "content_scripts": CONTENT_SCRIPTS,
}

manifest.update(browser_specifics)
manifest.update(background)

with open("manifest.json", "w") as f:
    json.dump(manifest, f, indent = 4)
