# Testing Checklist with Logging

## Setup

1. ✅ Build completed successfully
2. ✅ Logging added to Timeline component
3. Open application in browser
4. Press `F12` to open DevTools
5. Go to **Console** tab

## Test 1: Click a Note ⏱️ ~1 minute

### Steps:
1. Clear console (Ctrl+L or Cmd+K)
2. Click once on any note in the timeline
3. Wait 2 seconds without moving mouse
4. Check the logs

### What should happen:
- Note should appear selected (different color)
- Note controls should appear (buttons below note)

### What to check in logs:
1. Does `🔵 onTimelineClick fired` appear?
   - [ ] YES - Event handler working
   - [ ] NO - **PROBLEM**: Handler not attached

2. Does `noteElement: true` in detection?
   - [ ] YES - Note found
   - [ ] NO - **PROBLEM**: data-note-id attribute missing

3. Does `🟢 handleNotePointerDown called` appear?
   - [ ] YES - Handler executing
   - [ ] NO - **PROBLEM**: Early return in handler

4. Does `✅ handleNotePointerDown complete` appear?
   - [ ] YES - Selection working
   - [ ] NO - **PROBLEM**: Error in handler

5. Does `isNoteDrag: false` at the end?
   - [ ] YES - Correct (no drag occurred)
   - [ ] NO - **PROBLEM**: Movement detected without intending to drag

### Expected Console Output:
```
🔵 onTimelineClick fired ...
📍 Target element: sy-note note
🎯 Detection results: {..., noteElement: true, ...}
▶️ NOTE BODY detected
🟢 handleNotePointerDown called ...
✅ handleNotePointerDown complete ...
🔴 onDocumentPointerUp fired {isNoteDrag: false, ...}
```

---

## Test 2: Drag a Note ⏱️ ~1 minute

### Steps:
1. Clear console
2. Click and hold on a note
3. Drag approximately 50 pixels to the LEFT
4. Release the mouse
5. Check logs and verify note moved

### What should happen:
- Note should move with your mouse
- When released, note should stay at new position
- Position in sequencer should update

### What to check in logs:
1. Does `▶️ NOTE BODY detected` appear?
   - [ ] YES - Note detected
   - [ ] NO - **PROBLEM**: Event delegation failed

2. Do multiple `🟠 handleNotePointerMove` logs appear?
   - [ ] YES - Movement tracking working
   - [ ] NO - **PROBLEM**: Move handler not called

3. Does `📏 Movement amount` increase from 0 to 50+?
   - [ ] YES - Distance tracking working
   - [ ] NO - **PROBLEM**: Movement calculation failed

4. Does `✅ Starting actual drag` appear?
   - [ ] YES - Drag threshold crossed
   - [ ] NO - **PROBLEM**: Movement below 3px threshold

5. Do all these conditions show `true` in movement logs?
   - [ ] `isPointerDown: true` - ✅
   - [ ] `noteEle: true` - ✅
   - [ ] `selectedNote: true` - ✅
   - [ ] `draggedNoteElement: true` - ✅
   - If any is false: **PROBLEM** - That state is missing

6. Does `isNoteDrag: true` at pointer up?
   - [ ] YES - Drag was registered
   - [ ] NO - **PROBLEM**: Not marked as drag

### Expected Console Output (Key Lines):
```
🔵 onTimelineClick fired ...
▶️ NOTE BODY detected
🟢 handleNotePointerDown called ...
🟠 handleNotePointerMove - checking conditions {isPointerDown: true, noteEle: true, selectedNote: true, draggedNoteElement: true}
📏 Movement amount: 5.2
✅ Starting actual drag, pointerMovedAmount: 5.2
(more movement logs...)
🔴 onDocumentPointerUp fired {isNoteDrag: true, dragStateActive: false}
```

---

## Test 3: Resize a Note ⏱️ ~1 minute

### Steps:
1. Clear console
2. Hover over the LEFT edge of a note
3. When cursor changes to resize cursor (⟨→⟩), click and drag RIGHT about 30 pixels
4. Release the mouse
5. Check logs and verify note start time changed

### What should happen:
- Note's start point should move right
- Note's visual position on timeline should shift

### What to check in logs:
1. Does `▶️ RESIZE HANDLE detected` appear?
   - [ ] YES - Resize detected
   - [ ] NO - **PROBLEM**: data-handle attribute missing

2. Does `🟡 onDocumentPointerMove - handling resize` appear?
   - [ ] YES - Resize tracking working
   - [ ] NO - **PROBLEM**: dragState not set

3. Does `dragStateActive: true` at pointer up?
   - [ ] YES - Resize registered
   - [ ] NO - **PROBLEM**: dragState not active

### Expected Console Output (Key Lines):
```
🔵 onTimelineClick fired ...
📍 Target element: drag-handle drag-start
🎯 Detection results: {..., dragHandle: true, ...}
▶️ RESIZE HANDLE detected
🟡 onDocumentPointerMove - handling resize
(more move logs...)
🔴 onDocumentPointerUp fired {..., dragStateActive: true}
🔴 Handling resize end
```

---

## Test 4: Open Note Controls ⏱️ ~1 minute

### Steps:
1. Clear console
2. Click a note to select it
3. Hover below the note
4. You should see buttons to change Note and Octave
5. Click the "Note" button to cycle through notes

### What should happen:
- Controls should appear/be visible after clicking
- Clicking Note button should change the note
- Octave button should change octave
- Changes should reflect in the sequencer

### What to check in logs:
1. Does `_clickedSequenceObjectID: note.id` set in logs?
   - [ ] YES - Selection state set
   - [ ] NO - **PROBLEM**: Not setting selection

2. Does `[isSelected]` binding show note as selected?
   - [ ] YES - CSS class applied
   - [ ] NO - **PROBLEM**: Binding not working

---

## Test 5: Click Empty Timeline ⏱️ ~30 seconds

### Steps:
1. Clear console
2. Click on the gray timeline background (not on a note)

### What should happen:
- Previously selected note should deselect
- Note controls should disappear

### What to check in logs:
1. Does `▶️ EMPTY TIMELINE clicked` appear?
   - [ ] YES - Empty space detected
   - [ ] NO - **PROBLEM**: Clicked on a note instead

2. Does log show `_clickedSequenceObjectID = null` being set?
   - [ ] YES - Selection cleared
   - [ ] NO - **PROBLEM**: Modifier key was held

---

## Summary Checklist

After all tests, you should have:

- [ ] Test 1: Click works, logs show proper selection
- [ ] Test 2: Drag works, movement amount increases, draggedNoteElement exists
- [ ] Test 3: Resize works, dragStateActive is true
- [ ] Test 4: Controls visible and functional
- [ ] Test 5: Empty click clears selection

## If All Tests Pass ✅

Great! The event handling system is working. Next steps:
1. Remove the console.log statements (they're for debugging)
2. Proceed with Phase 1: State management services
3. Create clipboard and selection services

## If Tests Fail ❌

Use the logs to identify which phase is failing:

1. **Click not working at all**
   - Check if `🔵 onTimelineClick fired` appears
   - If not: Template binding issue
   - If yes: Element detection issue

2. **Note found but won't drag**
   - Check if `draggedNoteElement: true` in logs
   - If false: Line 593 not executing
   - If true: Movement tracking issue

3. **Resize not working**
   - Check if `dragHandle: true` in detection
   - If false: data-handle attribute missing from template
   - If true: handleResizeStart not running

## Sharing Logs for Help

If you get stuck, share:
1. Screenshot of console output
2. Which test failed
3. What you expected to see
4. What the logs actually show

Example good report:
```
Test 2 (Drag) failed
Expected: 'isNoteDrag: true' at the end
Got: 'isNoteDrag: false'
Logs show: handleNotePointerMove running but draggedNoteElement: false

Logs indicate draggedNoteElement is not being set during handleNotePointerDown
```
