# Timeline & Note Controls Handoff

## Summary
This thread focused on fixing note-controls visibility, drag behavior, and implementing a multi-row layout system for the Timeline component.

## What's Been Completed ✅

### 1. Note Controls Behavior
- **Problem**: Controls were opening on mousedown instead of mouseup
- **Solution**: Restructured to only open controls on pure clicks (pointerup without drag)
- **Files Modified**: `Timeline.component.ts`, `Note.component.ts`
- **Key Changes**:
  - Added `dragWasActivated` flag to track when 3px threshold is exceeded
  - Added `clickedNoteIdOnPointerDown` to track which note was clicked
  - Controls only show during drag if `isDragging = false` (via `[class.selected]="isSelected && !isDragging"`)
  - Controls open on pointerup ONLY if it was a pure click (no drag)

### 2. Drag & Selection Logic
- **Problem**: Dragging an unselected note would drag previously selected notes instead
- **Solution**: Determine which notes to drag based on whether clicked note is in selection
- **Key Logic** (Timeline.component.ts ~line 754):
  - If dragging already-selected note → drag whole selection
  - If dragging unselected note → drag only that note (don't select it yet)
  - Selection only happens on pure click (pointerup)

### 3. Selection Behavior
- **Problem**: Previous selection stayed when dragging different note
- **Solution**: Clear selection when drag starts (line 1000 in Timeline.component.ts)
- Notes stay selected if they were being dragged, but get deselected when drag threshold is met

### 4. Synthesizer Key Handling
- **Problem**: Notes would get stuck when pressing keys with Cmd/Ctrl held (copy/paste)
- **Solution**: Ignore keydown when `metaKey || ctrlKey` is pressed (Key.component.ts line 127)

### 5. Drag Boundary
- **Problem**: Notes could be dragged beyond the right edge of the timeline
- **Solution**: Added boundary check in `updateDrag()` (timeline-input.service.ts line 256)
- Formula: `const maxTime = this.bars - original.length; newTime = Math.max(0, Math.min(newTime, maxTime));`

### 6. Multi-Row Layout Foundation
- **Completed**:
  - Added `rowIndex?: number` property to SequenceObject
  - Created `autoArrangeRows()` function in TimelineInputService (line 407)
  - Updated `getNoteY()` to use rowIndex for positioning
  - Auto-arrange is called on drag end (line 365 in timeline-input.service.ts)

- **Partially Working**: Auto-arrange detects overlaps correctly but needs improvements

## Current Issues to Address 🔴

1. **Auto-arrange currently called in wrong place**: It's in `endDrag()` but should only be triggered by manual row management, not automatic drag end
2. **No UI for row management**: Need button to create rows, double-click to add notes
3. **No drag-to-row feature**: Notes can't be dragged between rows yet
4. **No overlap cutting**: When notes overlap on drag end, should cut the overlapping note instead of moving it to new row

## Next Steps 📋

### Phase 1: Manual Row Management UI
- [ ] Add "Add Row" button in Timeline header
- [ ] Add double-click handler on empty row space to create new note
- [ ] Add visual row markers/headers
- [ ] Show max rows count and allow deletion of empty rows

### Phase 2: Drag Between Rows
- [ ] Detect which row pointer is over during drag
- [ ] Update note's rowIndex while dragging to show preview
- [ ] On drag end, assign note to target row

### Phase 3: Overlap Handling
- [ ] On drag end, detect if note overlaps with others in target row
- [ ] If overlap: cut the overlapping note to fit (reduce its length)
- [ ] Or: move overlapping note to next row if space available
- [ ] Implement conflict resolution strategy

### Phase 4: Cleanup
- [ ] Remove auto-arrange logic that's not needed
- [ ] Clean up debug logs
- [ ] Test edge cases (drag to end of timeline, drag between rows, etc.)

## Key Files Modified

1. **Timeline.component.ts** (1592 lines)
   - `onTimelineClick()` - Updated drag handle detection and selection logic
   - `onDocumentPointerMove()` - Threshold checking and drag state
   - `onDocumentPointerUp()` - Controls visibility and selection on pointer up
   - `getNoteY()` - Uses rowIndex for positioning
   - Added flags: `dragWasActivated`, `clickedNoteIdOnPointerDown`

2. **Note.component.ts**
   - Added `isDragging` input (line 256)
   - Updated controls binding: `[class.selected]="isSelected && !isDragging"` (line 39)

3. **TimelineInputService** (462 lines)
   - `autoArrangeRows()` - Detects overlaps and assigns notes to rows (line 407)
   - Updated `endDrag()` to call `autoArrangeRows()` (line 365)
   - Added boundary check in `updateDrag()` (line 256)

4. **Sequencer.ts**
   - Added `rowIndex?: number` to SequenceObject type (line 15)

5. **Key.component.ts**
   - Added metaKey/ctrlKey check in `onKeyDown()` (line 127)

## Debug Logs Available
- 🎯 onDocumentPointerUp called
- 🔴 SET _clickedSequenceObjectID = null on pointerdown
- 🟠 Closing controls - drag started
- 📌 onDocumentPointerUp note element check
- 🔄 Auto-arranged notes into rows
- 💫 Dragging selected notes / unselected note

## Testing Checklist
- [x] Pure click on unselected note → select & show controls
- [x] Drag already-selected note → stays selected, controls hide during drag
- [x] Drag unselected note when another is selected → only drag unselected note
- [x] Don't select note while Cmd/Ctrl pressed → no stuck keys
- [x] Can't drag note past right timeline boundary
- [ ] Can drag note between rows (TO DO)
- [ ] Double-click row creates note (TO DO)
- [ ] Overlapping notes get resolved correctly (TO DO)

## Code Snippets for Reference

### Determine notes to drag (line 754)
```typescript
if (isClickedNoteSelected) {
  notesToDrag = selectedIds; // Drag whole selection
} else {
  notesToDrag = [this.clickedNoteIdOnPointerDown]; // Drag only this note
}
```

### Auto-arrange function (line 407)
```typescript
autoArrangeRows(): void {
  // Sorts notes by time, assigns to first row without overlaps
  // Detects overlaps: noteTime < otherEnd && noteEnd > otherTime
}
```

### Controls visibility (Note.component.ts line 39)
```html
<div class="note-controls" [class.selected]="isSelected && !isDragging" ...>
```
