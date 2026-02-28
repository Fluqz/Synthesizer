# Testing Guide - Multi-Selection Features

## Quick Start

The dev server is already running at: http://localhost:4200/Synthesizer

Open this in your browser and test the features below.

---

## Testing Checklist

### 1. Basic Selection
```
✓ Click on a note
  Expected: Note gets green highlight, no other changes

✓ Click on different note
  Expected: Previous note deselected, new note selected

✓ Click empty timeline
  Expected: All notes deselected
```

### 2. Ctrl+Click Multi-Select
```
✓ Click on note A
  Expected: Note A selected

✓ Ctrl+Click on note B (while A is selected)
  Expected: Both A and B selected (green highlight on both)
  UI shows: "2 notes selected"

✓ Ctrl+Click on note B again
  Expected: Note B removed from selection, only A selected
```

### 3. Shift+Click Range Select
```
✓ Click on note A
  Expected: Note A selected

✓ Shift+Click on note C
  Expected: All notes from A to C selected (inclusive)
  UI shows: "N notes selected" (where N = notes between A and C)
```

### 4. Rectangular Selection (Drag on Empty)
```
✓ Click on empty timeline area
✓ Drag to create selection box
  Expected: Green dashed rectangle appears while dragging
  
✓ Release mouse
  Expected: All notes in box are selected, box disappears
  UI shows: "N notes selected"
```

### 5. Drag Single Note
```
✓ Click and drag a note left/right
  Expected: Note follows cursor, grid snapping works
  
✓ Release
  Expected: Note stays in new position
```

### 6. Drag Multiple Selected Notes
```
✓ Select 3 notes (using Ctrl+Click or rectangular select)
✓ Click on one of selected notes and drag
  Expected: All 3 notes move together, maintaining spacing
  
✓ Release
  Expected: All 3 notes stay in new positions, relative spacing preserved
```

### 7. Resize Single Note - Start Handle (Left)
```
✓ Hover over left edge of a note, drag left
  Expected: Note's start time moves left, duration decreases
  
✓ Drag right
  Expected: Note's start time moves right, duration decreases
```

### 8. Resize Single Note - End Handle (Right)
```
✓ Hover over right edge of a note, drag right
  Expected: Note extends right, duration increases (no jump!)
  
✓ Drag left
  Expected: Note contracts left, duration decreases
```

### 9. Resize Multiple Selected Notes
```
✓ Select 3 notes (multi-select)
✓ Drag the RIGHT handle of one selected note
  Expected: All 3 notes' durations change together
  Spacing between notes maintained

✓ Drag the LEFT handle
  Expected: All 3 notes' start times change together
  Spacing maintained
```

### 10. Copy Selected Notes (Ctrl+C)
```
✓ Select 2-3 notes
✓ Press Ctrl+C (or Cmd+C on Mac)
  Expected: Notes copied to clipboard
  Console shows: "Copied N note(s)"

✓ Check browser console for confirmation
```

### 11. Paste Notes (Ctrl+V)
```
✓ Press Ctrl+V (with notes in clipboard)
  Expected: Notes appear at start of next bar
  They are auto-selected (green highlight)
  Console shows: "Pasted N note(s)"
  
✓ Paste again
  Expected: Another copy appears at next bar
```

### 12. Copy/Paste Preserves Spacing
```
✓ Create 3 notes with specific spacing (e.g., at beats 1, 2, 3)
✓ Select all 3 and copy (Ctrl+C)
✓ Paste (Ctrl+V)
  Expected: Pasted notes have SAME spacing as originals
  Not evenly distributed, but relative positions maintained
```

### 13. Delete Selected (Delete or Backspace)
```
✓ Select 2 notes
✓ Press Delete key
  Expected: Confirmation dialog appears: "Delete N note(s)?"
  
✓ Click OK
  Expected: Notes deleted, selection cleared

✓ Undo (Ctrl+Z)
  Expected: Notes restored
```

### 14. Delete Confirmation Cancel
```
✓ Select notes
✓ Press Delete
✓ Click Cancel
  Expected: Notes are NOT deleted
```

### 15. Select All (Ctrl+A)
```
✓ Press Ctrl+A
  Expected: All notes in timeline are selected
  UI shows: "N notes selected" (N = total notes)
```

### 16. Deselect All (Escape)
```
✓ Select some notes
✓ Press Escape
  Expected: All deselected
  UI shows nothing (no "selected" text)
```

### 17. Selection Count UI
```
✓ With 0 notes selected
  Expected: No text appears (or empty indicator)

✓ Select 1 note
  Expected: UI shows "1 note selected"

✓ Select 5 notes
  Expected: UI shows "5 notes selected"

✓ Deselect all
  Expected: UI clears
```

### 18. Grid Quantization
```
✓ Drag a note normally
  Expected: Note snaps to grid lines

✓ Hold Shift while dragging
  Expected: Note can be placed between grid lines (free-form)
  
✓ Release Shift
  Expected: Snap to grid resumes on next drag
```

### 19. Note Controls Don't Appear During Drag
```
✓ Click a note (shows controls)
✓ Start dragging that note
  Expected: Controls disappear
✓ Release
  Expected: If it was a drag (movement > 3px), controls don't reappear
           If it was a click (no movement), controls appear
```

### 20. Undo/Redo Works
```
✓ Drag a note
✓ Ctrl+Z
  Expected: Note returns to original position

✓ Ctrl+Y (or Cmd+Shift+Z on Mac)
  Expected: Move is redone

✓ Copy/paste notes
✓ Ctrl+Z
  Expected: Pasted notes removed

✓ Delete notes
✓ Ctrl+Z
  Expected: Notes restored
```

---

## Edge Cases to Test

### Boundary Conditions
```
✓ Drag note to very start of timeline (time=0)
  Expected: Note stops at 0, can't go negative

✓ Try to resize note smaller than minimum duration
  Expected: Note won't resize below minimum (e.g., 0.05 bars)

✓ Drag note past end of timeline
  Expected: Note wraps or stops at boundary (depends on implementation)
```

### Multi-Note Edge Cases
```
✓ Drag 10+ selected notes
  Expected: All move smoothly together

✓ Resize 10+ selected notes
  Expected: All resize together

✓ Copy/paste with many notes
  Expected: All pasted with correct spacing
```

### Interaction Edge Cases
```
✓ Rectangular select, then Ctrl+Click additional notes
  Expected: Additional notes toggle in/out of selection

✓ Make rectangular selection, then Shift+Click range
  Expected: Range select replaces rectangular select

✓ Hold Shift and drag rectangular select
  Expected: Behaves like normal rectangular select
           (Shift+drag should add to selection, not resize)
```

---

## Performance Tests

### Responsiveness
```
✓ With 20 notes on timeline
  Expected: Dragging is smooth, no lag

✓ Rectangular select with 20 notes
  Expected: Selection box draws smoothly

✓ Multi-note drag of 15 notes
  Expected: All notes move smoothly together
```

### Visual Feedback
```
✓ During drag, all selected notes visible and moving
  Expected: No flickering, smooth animation

✓ During rectangular select, box visible
  Expected: No lag in box drawing
```

---

## Known Issues to Watch For

(None expected with current implementation, but test for):

- [ ] Notes jumping to wrong position during drag
- [ ] Selection state getting out of sync
- [ ] Copy/paste not preserving spacing
- [ ] Keyboard shortcuts not working
- [ ] Rectangular selection not detecting all notes
- [ ] Multi-note resize not working correctly
- [ ] Grid quantization snapping incorrectly

---

## How to Report Issues

If you find something broken:

1. Note the exact steps to reproduce
2. Describe expected vs actual behavior
3. Check browser console for any errors (F12 → Console tab)
4. Let me know what you found!

---

## Quick Test (2 minutes)

If you're in a hurry, test these core features:

1. **Click note** → gets highlighted ✓
2. **Ctrl+Click another** → both selected ✓
3. **Drag on empty** → selection box appears ✓
4. **Drag selected notes** → all move together ✓
5. **Resize multiple** → all resize together ✓
6. **Ctrl+C → Ctrl+V** → notes copied and pasted ✓
7. **Delete → confirm** → notes deleted ✓

If all 7 work, the core features are functional!

