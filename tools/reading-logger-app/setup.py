"""py2app build config. Run: python3 setup.py py2app"""

from setuptools import setup

APP = ["menubar_app.py"]
OPTIONS = {
    "plist": {
        "LSUIElement": True,  # menu bar only, no Dock icon
        "CFBundleName": "Reading Logger",
        "CFBundleShortVersionString": "1.0.0",
    },
    "packages": ["rumps"],
}

setup(
    app=APP,
    options={"py2app": OPTIONS},
    setup_requires=["py2app"],
)
