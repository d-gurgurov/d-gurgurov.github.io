#!/usr/bin/env python3
"""Menu bar app for quickly adding entries to the reading list.

Lives in the macOS menu bar. Click "Add Paper..." to get a small native
form (title, description, link). On submit it writes the new entry into
data/reading.json, then commits and pushes the change with git.
"""

import json
import subprocess
from datetime import date
from pathlib import Path

import rumps
from AppKit import (
    NSAlert,
    NSAlertFirstButtonReturn,
    NSMakeRect,
    NSTextField,
    NSView,
)

REPO_PATH = Path.home() / "Desktop" / "2026-code" / "githubio"
READING_JSON = REPO_PATH / "data" / "reading.json"

RESEARCH_DOMAINS = ("arxiv.org", "aclanthology.org")


def is_research(url: str) -> bool:
    return any(domain in url for domain in RESEARCH_DOMAINS)


def prompt_for_entry():
    """Show a native macOS form with title / description / link fields.

    Returns a dict with title/url/description, or None if cancelled
    or left incomplete.
    """
    alert = NSAlert.alloc().init()
    alert.setMessageText_("Add to Reading List")
    alert.setInformativeText_("Title, then a short description, then the link.")
    alert.addButtonWithTitle_("Add")
    alert.addButtonWithTitle_("Cancel")

    width, field_h, gap = 320, 24, 8
    accessory = NSView.alloc().initWithFrame_(NSMakeRect(0, 0, width, field_h * 3 + gap * 2))

    def make_field(y, placeholder):
        field = NSTextField.alloc().initWithFrame_(NSMakeRect(0, y, width, field_h))
        field.setPlaceholderString_(placeholder)
        accessory.addSubview_(field)
        return field

    title_field = make_field(field_h * 2 + gap * 2, "Title")
    desc_field = make_field(field_h + gap, "Short description")
    url_field = make_field(0, "Link (https://...)")

    alert.setAccessoryView_(accessory)
    alert.window().setInitialFirstResponder_(title_field)

    response = alert.runModal()
    if response != NSAlertFirstButtonReturn:
        return None

    title = str(title_field.stringValue()).strip()
    description = str(desc_field.stringValue()).strip()
    url = str(url_field.stringValue()).strip()

    if not title or not url:
        rumps.alert("Missing info", "Title and link are both required.")
        return None

    return {"title": title, "url": url, "description": description}


class ReadingLoggerApp(rumps.App):
    def __init__(self):
        super().__init__("\U0001F4D6", quit_button=None)
        self.menu = ["Add Paper…", None, "Open reading.html", None, "Quit"]

    @rumps.clicked("Add Paper…")
    def add_paper(self, _):
        entry = prompt_for_entry()
        if not entry:
            return
        self.save_entry(entry)

    @rumps.clicked("Open reading.html")
    def open_site(self, _):
        subprocess.run(["open", str(REPO_PATH / "reading.html")])

    @rumps.clicked("Quit")
    def quit_app(self, _):
        rumps.quit_application()

    def save_entry(self, entry):
        research = is_research(entry["url"])
        new_entry = {
            "title": entry["title"],
            "url": entry["url"],
            "linkText": "A paper" if research else "A link",
            "description": entry["description"],
            "category": "research" if research else "non-research",
            "date": date.today().isoformat(),
        }

        try:
            data = json.loads(READING_JSON.read_text())
        except Exception as e:
            rumps.alert("Error", f"Could not read reading.json:\n{e}")
            return

        data.insert(0, new_entry)
        READING_JSON.write_text(json.dumps(data, indent=2) + "\n")

        try:
            subprocess.run(
                ["git", "add", "data/reading.json"],
                cwd=REPO_PATH, check=True, capture_output=True,
            )
            subprocess.run(
                ["git", "commit", "-m", f"Add reading entry: {entry['title']}"],
                cwd=REPO_PATH, check=True, capture_output=True,
            )
            subprocess.run(
                ["git", "push"],
                cwd=REPO_PATH, check=True, capture_output=True,
            )
        except subprocess.CalledProcessError as e:
            output = (e.stderr or b"").decode(errors="ignore")
            rumps.alert("Saved, but git failed", output or str(e))
            return

        rumps.notification("Added to reading list", entry["title"], "Committed and pushed.")


if __name__ == "__main__":
    ReadingLoggerApp().run()
