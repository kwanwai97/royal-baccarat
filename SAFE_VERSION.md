# Royal Baccarat Safe Version Markers
# These are the known good versions that can be restored if needed

## safe-b3c8154
- Date: 2026-09-05
- Description: Buttons in correct positions - rooms/topup/shop/chat buttons in brand area (vertical), server-toolbar between topbar and roadpanel
- Layout: Portrait - new buttons in brand area (vertical stack)
- Layout: Landscape - new buttons in brand area (horizontal row), server-toolbar hidden
- Files: index.html
- Restore command: git checkout -- index.html (from this commit)

## Known good states:
- index.html: buttons added in brand area + server-toolbar between topbar and roadpanel
- server.py: Flask server with SQLite, rooms/chat/leaderboard APIs
- All pages: /rooms.html, /chat.html, /shop.html, /topup.html, /transactions.html, /admin.html working
