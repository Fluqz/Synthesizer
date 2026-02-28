# Debug Guide - Event Logging

## Overview
Comprehensive logging has been added to trace the entire event flow from click to drag to release.

## Log Output Format

### Color-coded Indicators
- 🔵 **Blue circle** - `onTimelineClick` entry point
- 🟢 **Green circle** - `handleNotePointerDown` processing
- 🟡 **Yellow circle** - `onDocumentPointerMove` routing
- 🟠 **Orange circle** - `handleNotePointerMove` processing
- 🔴 **Red circle** - `onDocumentPointerUp` pointer release
- 🟣 **Purple circle** - `handleNotePointerUp` final handling
- ✅ **Checkmark** - Success/completion
- ❌ **X mark** - Failure/exit early
- ⏸️ **Pause** - Threshold not met yet

## How to Debug

### Step 1: Open Browser DevTools
1. Open your application
2. Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
3. Go to **Console** tab

### Step 2: Try Clicking a Note
Click on any note in the timeline and check the console logs.

**Expected output when clicking a note:**
```
🔵 onTimelineClick fired {clientX: 400, clientY: 150, target: div.note}
📍 Target element: note sy-note
🎯 Detection results: {dragHandle: false, noteElement: true, controlBtn: false, noteId: "1"}
▶️ NOTE BODY detected
🟢 handleNotePointerDown called <div class="note">
🔑 noteId from data-note-id: 1
📋 Found note: {id: 1, note: "C4", time: 0, length: "0.5", velocity: 1}
from sequence: [...notes]
✅ handleNotePointerDown complete {noteId: 1, isPointerDown: true, ...}
```

### Step 3: Try Dragging a Note
Click and drag a note left/right, watching the console.

**Expected output sequence:**
```
🔵 onTimelineClick fired ...
...handleNotePointerDown complete...

🟡 onDocumentPointerMove - handling note drag
🟠 handleNotePointerMove - checking conditions {isPointerDown: true, noteEle: true, ...}
📏 Movement amount: 5.2
✅ Starting actual drag, pointerMovedAmount: 5.2

🟡 onDocumentPointerMove - handling note drag
📏 Movement amount: 23.4
(continues until mouse release)

🔴 onDocumentPointerUp fired {isNoteDrag: true, dragStateActive: false}
🔴 Handling note drag end
🟣 handleNotePointerUp called {isNoteDrag: true, selectedNote: true}
```

### Step 4: Try Resizing a Note
Click and drag a resize handle (left or right edge of a note).

**Expected output:**
```
🔵 onTimelineClick fired ...
▶️ RESIZE HANDLE detected
...handleResizeStart complete...

🟡 onDocumentPointerMove - handling resize
(continues for resize movements)

🔴 onDocumentPointerUp fired {isNoteDrag: false, dragStateActive: true}
🔴 Handling resize end
```

## Common Issues to Debug

### Issue 1: Click Not Registering
**Check logs for:**
- Is `🔵 onTimelineClick fired` appearing?
  - If NO: Event handler not attached properly
  - If YES: Go to next check

- Is `🎯 Detection results` showing correct element?
  - If `noteElement: false`: Click missed the note div, check HTML structure
  - If `noteElement: true`: Continue

### Issue 2: Note Not Getting Selected
**Check logs for:**
- Is `🟢 handleNotePointerDown called` appearing?
  - If NO: `noteElement` detection failed
  - If YES: Go to next check

- Is `🔑 noteId from data-note-id` showing a value?
  - If empty/null: Check if `[data-note-id]` binding is working in template
  - If YES: Go to next check

- Is `📋 Found note` showing the correct note?
  - If empty: Check if `note.id` matches `noteId` parsing
  - If YES: Note should be selected now

### Issue 3: Drag Not Working
**Check logs for:**
- Is `🟡 onDocumentPointerMove - handling note drag` appearing?
  - If NO: `isPointerDown` is false or `noteEle` is null
  - If YES: Go to next check

- Is `🟠 handleNotePointerMove - checking conditions` showing all true?
  - If `isPointerDown: false`: Initial click didn't set it
  - If `noteEle: false`: Not captured at click
  - If `selectedNote: false`: Note lookup failed
  - If `draggedNoteElement: false`: **This is the bug** - not being set

- Is `📏 Movement amount` increasing?
  - If showing small numbers (<3): Not enough movement yet, keep dragging
  - If showing large numbers (>3): Should see ✅ Starting actual drag

### Issue 4: Resize Not Working
**Check logs for:**
- Is `▶️ RESIZE HANDLE detected` appearing?
  - If NO: Drag handle detection failed, check if element has `.drag-handle` class
  - If YES: Check `handleResizeStart` logs

## Log Key Points Explained

### onTimelineClick Phase
```javascript
🔵 onTimelineClick fired {clientX: 400, clientY: 150, target: ...}
```
- Shows when timeline received pointer event
- `clientX/Y` should match your click position

```javascript
📍 Target element: note sy-note
```
- Shows what element was actually clicked
- Should be either: `note`, `drag-handle`, `note-controls`, etc.

```javascript
🎯 Detection results: {dragHandle: false, noteElement: true, controlBtn: false, noteId: "1"}
```
- Shows DOM closest() results
- One of these should be `true` (unless clicking empty timeline)

### handleNotePointerDown Phase
```javascript
🔑 noteId from data-note-id: 1
📋 Found note: {id: 1, note: "C4", ...}
```
- Shows the note object lookup
- If note is null, check: 
  1. Is `[data-note-id]="note.id"` in template?
  2. Is `note.id` actually set in sequencer?

```javascript
✅ handleNotePointerDown complete {noteId: 1, isPointerDown: true, clickOffsetX: 42.5, ...}
```
- Shows final state when pointer down is complete
- `isPointerDown: true` is required for drag to work

### handleNotePointerMove Phase
```javascript
📏 Movement amount: 5.2
✅ Starting actual drag, pointerMovedAmount: 5.2
```
- Shows cumulative movement in pixels
- Need >3px to start actual drag
- Higher numbers = more movement

## Variables to Check in Console

While logs are running, you can also inspect variables:

```javascript
// In browser console, while hovering over timeline:
monitorEvents(document.querySelector('.timeline'), 'pointer')
```

This shows all pointer events on the timeline.

Or check component state directly:
```javascript
// Get the Angular component instance (in browser console):
ng.getComponent(document.querySelector('sy-timeline'))
```

Then inspect:
```javascript
comp.isPointerDown       // Should be true during drag
comp.draggedNoteElement  // Should reference the note element
comp.selectedNote        // Should have the note object
comp.pointerMovedAmount  // Should increase during move
```

## Removing Logs (Production)

When ready to remove logs for production, search for and remove:
- Lines containing `console.log`
- Search pattern: `console\.log\(`

Or use find/replace in VS Code:
1. `Ctrl+H` (or `Cmd+H` on Mac)
2. Find: `console\.log.*\n`
3. Replace: `` (empty)
4. Use regex mode (icon with `.*`)

## Next Steps

1. Open the app and try clicking/dragging
2. Share the console output with the logs visible
3. Use this guide to identify which step is failing
4. That will pinpoint the exact bug location
