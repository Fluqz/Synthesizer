# Expected Console Output

## Scenario 1: Click a Note (No Drag)

### What to do:
1. Open DevTools Console
2. Click once on a note
3. Don't move the mouse

### Expected Output:
```
🔵 onTimelineClick fired {clientX: 350, clientY: 200, target: div.sy-note}
📍 Target element: sy-note, note
🎯 Detection results: {dragHandle: false, noteElement: true, controlBtn: false, noteId: "2"}
▶️ NOTE BODY detected
🟢 handleNotePointerDown called <div class="note...">
🔑 noteId from data-note-id: 2
📋 Found note: {id: 2, note: "D4", time: 0.5, length: "0.5", velocity: 1} from sequence: (5) [{...}, {...}, ...]
✅ handleNotePointerDown complete {noteId: 2, isPointerDown: true, clickOffsetX: 15.3, pointerPosition: {x: 350, y: 200}}
🔴 onDocumentPointerUp fired {isNoteDrag: false, dragStateActive: false}
```

**What this means:**
- ✅ Click was registered
- ✅ Note was found in sequence
- ✅ Selection was activated
- ✅ No drag happened (minimal movement)

**Look for:**
- `isNoteDrag: false` - Correct, we didn't drag
- No `handleNotePointerMove` logs - Correct, no movement

---

## Scenario 2: Drag a Note Left/Right

### What to do:
1. Open DevTools Console
2. Clear console
3. Click and drag a note about 50 pixels left or right
4. Release the mouse

### Expected Output:
```
🔵 onTimelineClick fired {clientX: 350, clientY: 200, target: div.note}
📍 Target element: sy-note note
🎯 Detection results: {dragHandle: false, noteElement: true, controlBtn: false, noteId: "2"}
▶️ NOTE BODY detected
🟢 handleNotePointerDown called <div class="note...">
🔑 noteId from data-note-id: 2
📋 Found note: {id: 2, note: "D4", ...}
✅ handleNotePointerDown complete {noteId: 2, isPointerDown: true, clickOffsetX: 15.3, pointerPosition: {x: 350, y: 200}}

🟡 onDocumentPointerMove - handling note drag
🟠 handleNotePointerMove - checking conditions {isPointerDown: true, noteEle: true, selectedNote: true, draggedNoteElement: true}
📏 Movement amount: 2.1
⏸️ Movement below threshold (3px), not dragging yet

🟡 onDocumentPointerMove - handling note drag
🟠 handleNotePointerMove - checking conditions {isPointerDown: true, noteEle: true, selectedNote: true, draggedNoteElement: true}
📏 Movement amount: 15.4
✅ Starting actual drag, pointerMovedAmount: 15.4

🟡 onDocumentPointerMove - handling note drag
🟠 handleNotePointerMove - checking conditions {isPointerDown: true, noteEle: true, selectedNote: true, draggedNoteElement: true}
📏 Movement amount: 35.8

🟡 onDocumentPointerMove - handling note drag
🟠 handleNotePointerMove - checking conditions {isPointerDown: true, noteEle: true, selectedNote: true, draggedNoteElement: true}
📏 Movement amount: 47.2

🔴 onDocumentPointerUp fired {isNoteDrag: true, dragStateActive: false}
🔴 Handling note drag end
🟣 handleNotePointerUp called {isNoteDrag: true, selectedNote: true}
```

**What this means:**
- ✅ Click detected note
- ✅ Initial movement below threshold (3px)
- ✅ Movement exceeded threshold
- ✅ Actual drag started
- ✅ Mouse movement tracked
- ✅ Pointer release handled

**Look for:**
- `isPointerDown: true` - Required for drag
- `draggedNoteElement: true` - Required for DOM updates
- `isNoteDrag: true` at the end - Confirms drag happened
- Movement amount increasing - Shows tracking is working

---

## Scenario 3: Resize a Note (Left Handle)

### What to do:
1. Open DevTools Console
2. Clear console
3. Hover over the left edge of a note (should see cursor change)
4. Click and drag left handle to the right about 30 pixels
5. Release

### Expected Output:
```
🔵 onTimelineClick fired {clientX: 330, clientY: 200, target: div.drag-handle...}
📍 Target element: drag-handle drag-start
🎯 Detection results: {dragHandle: true, noteElement: true, controlBtn: false, noteId: "2"}
▶️ RESIZE HANDLE detected
(handleResizeStart logs - format varies based on implementation)

🟡 onDocumentPointerMove - handling resize
🟡 onDocumentPointerMove - handling resize
🟡 onDocumentPointerMove - handling resize

🔴 onDocumentPointerUp fired {isNoteDrag: false, dragStateActive: true}
🔴 Handling resize end
```

**What this means:**
- ✅ Drag handle was detected
- ✅ Resize operation started
- ✅ Multiple move events tracked
- ✅ `isNoteDrag: false` (correct, it's a resize not a drag)
- ✅ `dragStateActive: true` (correct for resize)

---

## Scenario 4: Click Empty Timeline

### What to do:
1. Open DevTools Console
2. Clear console
3. Click on the timeline background (not on any note)

### Expected Output:
```
🔵 onTimelineClick fired {clientX: 500, clientY: 200, target: div.timeline...}
📍 Target element: timeline
🎯 Detection results: {dragHandle: false, noteElement: false, controlBtn: false, noteId: undefined}
▶️ EMPTY TIMELINE clicked
```

**What this means:**
- ✅ Click registered on timeline
- ✅ No note/handle detected
- ✅ Selection should be cleared

---

## Troubleshooting Using These Outputs

### Problem: "I clicked a note but nothing shows in console"
**Solution:**
- Check if `🔵 onTimelineClick fired` appears at all
  - If not: Event handler not attached to timeline element
  - If yes: Go to next check
- Check if `noteElement: true` in detection results
  - If false: Note div might be missing `data-note-id` attribute
  - If true: Go to next check
- Check if `🟢 handleNotePointerDown called` appears
  - If not: Element detection failed
  - If yes: Check if note is found

### Problem: "Note is found but won't drag"
**Solution:**
- Check if `🟡 onDocumentPointerMove - handling note drag` appears
  - If not: `isPointerDown` or `noteEle` is false
  - If yes: Check the conditions log
- In conditions log, check if `draggedNoteElement: true`
  - If false: **BUG** - `draggedNoteElement` not being set properly
  - If true: Movement tracking issue

### Problem: "Movement logs don't appear"
**Solution:**
- Check if `📏 Movement amount` logs appear at all
  - If not: Pointer move events not firing (system issue)
  - If yes: Check if amount increasing
- If amount stays below 3: Need to drag further
- If amount jumps to large number: Large mouse movements detected

### Problem: "Everything looks good but note doesn't move visually"
**Solution:**
- Check if drag logic is running (logs show `✅ Starting actual drag`)
- But note position not changing
- Issue is in DOM update or sequencer update, not event handling
- Next debug phase: Check `handleNotePointerMove` DOM updates

---

## Key Variables to Monitor

While looking at logs, also watch these:

| Variable | Good Value | Bad Value |
|----------|-----------|----------|
| `isPointerDown` | `true` when dragging | `false` when should be true |
| `draggedNoteElement` | Points to HTMLElement | `null` or `undefined` |
| `selectedNote` | Has note object | `null` or wrong note |
| `noteId` | Integer (1, 2, 3...) | `null`, `undefined`, or NaN |
| `noteEle` | Points to element | `null` after setup |
| `pointerMovedAmount` | Increases continuously | Stays at 0 or 3 |

---

## Copy-Paste Testing

Quick way to verify logging works:

1. Open console
2. Copy-paste this command and press Enter:
```javascript
console.log('🟢 TEST: Logging is working'); console.log('✅ Color emojis display'); console.log('❌ If you see this, setup complete');
```

You should see three colored messages. If you do, logging is working and you can proceed with manual testing.
