# 3-Cushion Training System v3.0

## Interaction model
- +1 / -1 edits the current run.
- “失誤／本杆結束” commits the current run.
- “↶ 上一步” restores the state before the most recent action.
- Undo supports +1, -1, and run submission.
- Mobile scoring buttons suppress double-tap zoom, text selection, and long-press menus.

## Data compatibility
The existing localStorage key remains unchanged:
`threeCushionTrainingLog_v1`

Existing history records remain compatible.
