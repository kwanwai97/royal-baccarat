# Royal Baccarat Safe Version Markers
# These are the known good versions that can be restored if needed

## safe-b3c8154 (CURRENT)
- Date: 2026-09-05
- Git commit: 3157fb9
- Description: Landscape fix - server-toolbar spans full width above roadpanel
- Layout:
  - Section 1: server username / AI leaderboard / account
  - Section 2: rooms / topup / shop / chat buttons (compact horizontal toolbar)
  - Section 3: 大路 title / road map / betting area
- Both portrait and landscape use the same layout above 大路
- Chat route: /chat.html
- Server port: 8899

## Restore command
git checkout safe-b3c8154 -- index.html server.py
