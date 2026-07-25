# Reading Logger

A tiny macOS menu bar app for adding entries to the reading list on
d-gurgurov.github.io without opening an editor.

Click the book icon in the menu bar → "Add Paper..." → fill in title,
description, and link → it writes the entry into `data/reading.json`,
commits, and pushes.

## Run it without building an app (fastest way to try it)

```bash
cd tools/reading-logger-app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 menubar_app.py
```

A book icon appears in the menu bar. Leave the terminal window open while
it runs; `Ctrl+C` or the Quit menu item stops it.

## Build a real double-clickable .app

```bash
cd tools/reading-logger-app
source venv/bin/activate   # if not already active
python3 setup.py py2app
```

The app bundle appears at `dist/Reading Logger.app`. Drag it into
`/Applications`, then double-click to launch. To have it start
automatically at login, add it in System Settings → General → Login Items.

## Notes

- The repo path is hardcoded in `menubar_app.py` as
  `~/Desktop/2026-code/githubio`. Update `REPO_PATH` there if you ever move
  the repo.
- Category (research / non-research) and `linkText` ("A paper" vs "A link")
  are auto-detected from the URL (arxiv.org / aclanthology.org counts as
  research). Edit `data/reading.json` by hand afterward if it guesses wrong.
- Every add is auto-committed and auto-pushed to whatever remote/branch
  your local checkout is already tracking. Make sure `git push` works from
  the repo without any manual prompts (SSH key or credential helper already
  set up) before relying on this.
