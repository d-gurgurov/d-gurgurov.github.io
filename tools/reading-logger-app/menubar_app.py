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
    NSApplication,
    NSMakeRect,
    NSMenu,
    NSMenuItem,
    NSPopUpButton,
    NSTextField,
    NSView,
)

REPO_PATH = Path.home() / "Desktop" / "2026-code" / "githubio"
READING_JSON = REPO_PATH / "data" / "reading.json"


def install_edit_menu():
    """Menu-bar-only apps have no Edit menu by default, which means Cmd+C /
    Cmd+V / Cmd+X have nothing to route to in text fields. Adding a bare
    Edit menu with the standard selectors fixes copy/paste everywhere.
    """
    main_menu = NSMenu.alloc().init()
    main_menu.addItem_(NSMenuItem.alloc().init())

    edit_menu_item = NSMenuItem.alloc().init()
    main_menu.addItem_(edit_menu_item)
    edit_menu = NSMenu.alloc().initWithTitle_("Edit")
    edit_menu_item.setSubmenu_(edit_menu)

    for title, action, key in [
        ("Undo", "undo:", "z"),
        ("Redo", "redo:", "Z"),
        (None, None, None),
        ("Cut", "cut:", "x"),
        ("Copy", "copy:", "c"),
        ("Paste", "paste:", "v"),
        ("Select All", "selectAll:", "a"),
    ]:
        if title is None:
            edit_menu.addItem_(NSMenuItem.separatorItem())
            continue
        edit_menu.addItem_(NSMenuItem.alloc().initWithTitle_action_keyEquivalent_(title, action, key))

    NSApplication.sharedApplication().setMainMenu_(main_menu)


def prompt_for_entry():
    """Show a native macOS form with title / description / link / link
    text / category fields.

    Returns a dict with title/url/description/linkText/category, or None
    if cancelled or left incomplete.
    """
    alert = NSAlert.alloc().init()
    alert.setMessageText_("Add to Reading List")
    alert.setInformativeText_("Title, description, link, link text, then category.")
    alert.addButtonWithTitle_("Add")
    alert.addButtonWithTitle_("Cancel")

    width, gap = 320, 8
    # heights top to bottom: title, description (taller), link, link text, category
    heights = [24, 64, 24, 24, 24]
    total_h = sum(heights) + gap * (len(heights) - 1)
    accessory = NSView.alloc().initWithFrame_(NSMakeRect(0, 0, width, total_h))

    ys = []
    cursor = total_h
    for h in heights:
        cursor -= h
        ys.append(cursor)
        cursor -= gap

    def make_field(y, h, placeholder, default=""):
        field = NSTextField.alloc().initWithFrame_(NSMakeRect(0, y, width, h))
        field.setPlaceholderString_(placeholder)
        if default:
            field.setStringValue_(default)
        accessory.addSubview_(field)
        return field

    title_field = make_field(ys[0], heights[0], "Title")

    desc_field = make_field(ys[1], heights[1], "Short description")
    desc_field.setUsesSingleLineMode_(False)
    desc_field.cell().setWraps_(True)
    desc_field.cell().setScrollable_(False)

    url_field = make_field(ys[2], heights[2], "Link (https://...)")
    link_text_field = make_field(ys[3], heights[3], "Link text (e.g. A paper)", default="A paper")

    category_popup = NSPopUpButton.alloc().initWithFrame_pullsDown_(
        NSMakeRect(0, ys[4], width, heights[4]), False
    )
    category_popup.addItemsWithTitles_(["research", "non-research"])
    accessory.addSubview_(category_popup)

    alert.setAccessoryView_(accessory)
    alert.window().setInitialFirstResponder_(title_field)

    response = alert.runModal()
    if response != NSAlertFirstButtonReturn:
        return None

    title = str(title_field.stringValue()).strip()
    description = str(desc_field.stringValue()).strip()
    url = str(url_field.stringValue()).strip()
    link_text = str(link_text_field.stringValue()).strip()
    category = str(category_popup.titleOfSelectedItem())

    if not title or not url:
        rumps.alert("Missing info", "Title and link are both required.")
        return None

    return {
        "title": title,
        "url": url,
        "description": description,
        "linkText": link_text or "A paper",
        "category": category,
    }


class ReadingLoggerApp(rumps.App):
    def __init__(self):
        super().__init__("Read", quit_button=None)
        self.menu = ["Add Paper…", None, "Open reading.html", None, "Quit"]
        install_edit_menu()

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
        new_entry = {
            "title": entry["title"],
            "url": entry["url"],
            "linkText": entry["linkText"],
            "description": entry["description"],
            "category": entry["category"],
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
    log_path = Path.home() / "Library" / "Logs" / "ReadingLogger.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(log_path, "a") as f:
            f.write(f"\n--- starting {date.today().isoformat()} ---\n")
        ReadingLoggerApp().run()
    except Exception:
        import traceback
        with open(log_path, "a") as f:
            f.write(traceback.format_exc())
        raise
