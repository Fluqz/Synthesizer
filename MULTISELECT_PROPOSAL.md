# Multi-Selection & Copy/Paste Proposal

## Overview
Implement DAW-like multi-selection behavior where:
- Multiple notes can be selected and moved together
- Copy/paste preserves spacing and positions notes intelligently
- Visual feedback clearly shows selected and dragging notes

---

## 1. Selection Behavior (Like Ableton, FL Studio, etc.)

### Single Selection
```
Click on note → Select that note
  - Note highlight changes color
  - Show note controls
  - Click empty space → Deselect
```

### Multi-Selection
```
Ctrl+Click (Cmd+Click on Mac) on note → Toggle note in selection
  - Add/remove note from selection set
  - Keep previously selected notes

Shift+Click on note → Range select from last click to this note
  - Select all notes between two notes (by time order)
  - Clear previous selection first
```

### Visual States
```
.note {
  .selected {
    border: 2px solid #00FF00;        // Bright green for selected
    background: rgba(0, 255, 0, 0.1);
  }
  
  .selected.dragging {
    background: rgba(0, 255, 0, 0.2); // Brighter during drag
    opacity: 0.9;
  }
  
  .selected.copying {
    opacity: 0.5;                      // Dimmed while copying
    border: 2px dashed #00FF00;        // Dashed border
  }
}
```

---

## 2. Multi-Note Drag Behavior

### Selecting and Dragging
```
User clicks on note A (selected) → Drag start
  - Is note A selected? YES → Drag ALL selected notes
  - Is note A NOT selected? 
    - If Ctrl/Cmd held → Add note A to selection, drag all
    - If not held → Select only note A, drag it

Result: All selected notes move together, maintaining relative spacing
```

### Drag Mechanics
```
Original positions:
  Note A: time=0.5,  length=0.25
  Note B: time=1.0,  length=0.25
  Note C: time=2.0,  length=0.25
  
User drags Note A right by 0.5 bars:
  Note A: time=1.0,  length=0.25  (0.5 + 0.5)
  Note B: time=1.5,  length=0.25  (1.0 + 0.5)
  Note C: time=2.5,  length=0.25  (2.0 + 0.5)

All move by same delta: ✓ Relative spacing preserved
```

### Visual Feedback During Drag
```
- All selected notes change opacity/color slightly (0.85 opacity)
- Show ghost/preview at target position (lighter color)
- Cursor shows "+N" indicator (e.g., "+3 clips")
- Boundary check: prevent notes from going < 0 or too far right
```

---

## 3. Copy/Paste Behavior

### Copy Selected
```
Ctrl+C (Cmd+C on Mac) → Copy all selected notes
  - Store in clipboard with metadata:
    {
      notes: [...copiedNotes],
      minTime: 0.5,              // Leftmost note time
      maxTime: 2.25,             // Rightmost note end time
      duration: 1.75,            // Total span
      sourceSequencerId: 1,      // Track they came from
      relativeTimes: [0, 0.5, 1.5]  // Each note's offset from minTime
    }
```

### Paste at Playhead (Smart)
```
Ctrl+V → Paste at playhead position

Option A: "Align to playhead"
  - Paste minTime at playhead
  - Preserves original spacing
  Example:
    Original: A(0.5) B(1.0) C(2.0)
    Playhead: 4.0
    Pasted:   A(4.0) B(4.5) C(5.0) ✓ Maintains 0.5 bar spacing

Option B: "Snap to grid"
  - Paste at nearest grid position ≥ playhead
  - If playhead = 3.7, grid = quarter notes (0.25)
  - Paste at 4.0 (next grid line)
  
Option C: "Next bar" (Default, most DAW-like)
  - Calculate next bar boundary from playhead
  - Paste at start of that bar
  Example:
    Playhead: 3.5 (middle of bar 4)
    Next bar: 4.0
    Pasted: At time 4.0
```

### Visual Feedback During Paste
```
1. Before paste: Show ghost preview of where notes will be pasted
2. During paste: Notes appear with light highlighting
3. After paste: New notes selected automatically
4. Tooltip shows: "Pasted 3 notes at bar 5"
```

---

## 4. Implementation Architecture

### TimelineStateService (NEW)
```typescript
interface SelectionState {
  selectedNoteIds: Set<number>;
  lastClickedNoteId: number | null;  // For shift-click range select
}

interface ClipboardData {
  notes: SequenceObject[];
  minTime: number;
  maxTime: number;
  duration: number;
  relativeTimes: number[];
}

export class TimelineStateService {
  // Selection methods
  selectNote(noteId: number, clearOthers: boolean = true)
  toggleSelectNote(noteId: number)
  selectRange(fromNoteId: number, toNoteId: number)
  clearSelection()
  isNoteSelected(noteId: number): boolean
  getSelectedNoteIds(): number[]
  getSelectedNotes(): SequenceObject[]
  
  // Clipboard methods
  copySelected()
  pasteAtTime(time: number): SequenceObject[]
  pasteAtNextBar(fromTime: number): SequenceObject[]
  hasClipboard(): boolean
}
```

### TimelineInputService (EXTEND)
```typescript
interface DragState {
  active: boolean;
  type: "move" | "resize-start" | "resize-end" | null;
  noteIds: number[];  // ALL selected notes being dragged
  originalPositions: Map<number, {time, length}>;
  startTime: number;
  endTime: number;
  deltaX: number;
  // ... existing fields
}

export class TimelineInputService {
  // Single note drag
  startDrag(noteId: number, event: PointerEvent)
  
  // Multi-note drag (new)
  startDragMultiple(noteIds: number[], event: PointerEvent)
  
  // Handle both cases automatically
  updateDrag(event: PointerEvent): DragUpdate
  endDrag(event: PointerEvent)
}
```

### Timeline.component.ts (REFACTOR)
```typescript
export class TimelineComponent {
  
  onTimelineClick(event: PointerEvent) {
    const dragHandle = event.target.closest('.drag-handle');
    const noteElement = event.target.closest('.note');
    
    if (dragHandle && noteElement) {
      // Handle resize...
    } else if (noteElement) {
      const noteId = parseInt(noteElement.getAttribute('data-note-id'));
      
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+Click: Toggle selection
        this.timelineState.toggleSelectNote(noteId);
      } else if (event.shiftKey) {
        // Shift+Click: Range select
        this.timelineState.selectRange(this.lastClickedNoteId, noteId);
      } else {
        // Single click: Select only this note
        this.timelineState.selectNote(noteId, true);
      }
      
      this.lastClickedNoteId = noteId;
      
      // If selected notes exist, prepare to drag them
      const selected = this.timelineState.getSelectedNoteIds();
      if (selected.size > 0) {
        this.inputHandler.startDragMultiple(Array.from(selected), event);
      }
    } else {
      // Empty timeline: Clear selection
      this.timelineState.clearSelection();
    }
  }
  
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Ctrl+C / Cmd+C: Copy
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      event.preventDefault();
      this.timelineState.copySelected();
      // Show toast: "Copied N notes"
    }
    
    // Ctrl+V / Cmd+V: Paste at playhead or next bar
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
      event.preventDefault();
      const newNotes = this.timelineState.pasteAtNextBar(
        this.sequencer.currentTime
      );
      if (newNotes.length > 0) {
        // Select pasted notes
        this.timelineState.selectNotes(newNotes.map(n => n.id));
        // Show toast: "Pasted N notes"
      }
    }
    
    // Delete / Backspace: Remove selected
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      const selected = this.timelineState.getSelectedNotes();
      for (let note of selected) {
        this.sequencer.removeNote(note.id);
      }
      this.timelineState.clearSelection();
      this.saveUndo();
    }
    
    // Ctrl+A / Cmd+A: Select all
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      this.timelineState.selectAll();
    }
  }
}
```

---

## 5. Visual Feedback Details

### CSS Classes
```css
/* Base note */
.note {
  border: 1px solid var(--c-gr);
  background: linear-gradient(...);
  transition: all 0.1s ease;
}

/* Selected */
.note.selected {
  border: 2px solid var(--c-hl);      /* Highlight color */
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  background: linear-gradient(...);
  z-index: 10;
}

/* Multiple selected */
.note.selected.multi {
  border: 2px solid var(--c-hl);
  opacity: 0.95;
}

/* During drag */
.note.selected.dragging {
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.5);
  opacity: 0.9;
  cursor: grabbing;
}

/* Ghost/preview (new position during drag) */
.note.ghost-preview {
  opacity: 0.4;
  border: 2px dashed var(--c-hl);
  pointer-events: none;
}

/* Copy feedback */
.note.copied {
  opacity: 0.6;
  border: 2px dashed var(--c-hl);
}
```

### Selection Indicator UI
```html
<!-- Show count when multi-selected -->
<div class="selection-info" *ngIf="selectedCount > 1">
  {{ selectedCount }} notes selected
</div>

<!-- Show drag preview -->
<div class="drag-preview" *ngIf="isDragging && selectedCount > 1">
  Moving {{ selectedCount }} notes (Δ{{ deltaInBars }}b)
</div>

<!-- Paste preview (before releasing) -->
<div class="paste-preview" *ngIf="showPastePreview">
  Paste {{ clipboardCount }} notes at {{ pasteTime | timeFormat }}
</div>
```

---

## 6. Implementation Roadmap

### Phase 1A: Selection State Service (2-3 hours)
```
Create: TimelineStateService
- SelectionState management
- ClipboardData structure
- Methods: select, toggle, range, clear, copy, paste
- Test: Manual selection scenarios
```

### Phase 1B: Extend Input Service (2-3 hours)
```
Extend: TimelineInputService
- Support multi-note drag
- Track all selected notes in DragState
- Update drag calculations for multiple notes
- Test: Drag multiple selected notes
```

### Phase 1C: Timeline Component Integration (2-3 hours)
```
Update: Timeline.component.ts
- Hook selection state into click handler
- Implement Ctrl+Click, Shift+Click logic
- Add keyboard shortcuts
- Connect to services
```

### Phase 1D: Visual Feedback (1-2 hours)
```
Update: Note.component.ts
- Add @Input isSelected
- Add @Input isDragging (multi)
- Apply CSS classes
- Show selection highlight
```

### Phase 1E: Testing & Polish (1-2 hours)
```
Manual test all scenarios:
- Single select
- Multi-select (Ctrl+Click)
- Range select (Shift+Click)
- Multi-note drag
- Copy/paste
- Keyboard shortcuts
- Edge cases
```

---

## 7. Detailed Example: Complete User Flow

### Scenario: Copy 3-note pattern to next bar

```
1. User clicks on Note A (beat 1)
   → TimelineStateService: selectNote(A.id, clearOthers=true)
   → Timeline renders: Note A highlighted green

2. User Ctrl+Clicks Note B (beat 2)
   → TimelineStateService: toggleSelectNote(B.id)
   → Timeline renders: Notes A + B highlighted

3. User Ctrl+Clicks Note C (beat 3)
   → TimelineStateService: toggleSelectNote(C.id)
   → Timeline renders: Notes A + B + C highlighted
   → UI shows: "3 notes selected"

4. User presses Ctrl+C
   → TimelineStateService.copySelected()
   → Clipboard:
     {
       notes: [A, B, C],
       minTime: 0.0,    // A's time
       maxTime: 0.75,   // C's end time
       relativeTimes: [0.0, 0.25, 0.5]  // Spacing
     }

5. User clicks on timeline at beat 4 (or moves playhead there)

6. User presses Ctrl+V
   → TimelineStateService.pasteAtNextBar(4.0)
   → Calculate: Next bar from 4.0 is 4.0 (already on bar)
   → Paste with delta: 4.0 - 0.0 = 4.0
   → New notes:
     A': time=4.0,  length=0.25
     B': time=4.25, length=0.25
     C': time=4.5,  length=0.25
   → TimelineStateService: selectNotes([A'.id, B'.id, C'.id])
   → Timeline renders: A', B', C' highlighted
   → Toast: "Pasted 3 notes at bar 5"

Result: Perfect copy of pattern 1 bar ahead, all notes selected for further editing
```

---

## 8. Edge Cases & Safety

### Boundary Checks
```typescript
// Prevent notes from going before timeline start
if (newTime < 0) newTime = 0;

// Prevent overlapping with end of timeline
const timelineEnd = this.sequencer.bars;
const rightmostEnd = Math.max(...selectedNotes.map(n => 
  (typeof n.time === 'number' ? n.time : 0) + 
  (typeof n.length === 'number' ? n.length : 0)
));
if (rightmostEnd > timelineEnd) {
  // Adjust all notes back
  const overshoot = rightmostEnd - timelineEnd;
  for (let noteId of dragState.noteIds) {
    positions[noteId].time -= overshoot;
  }
}
```

### Paste Validation
```typescript
pasteAtNextBar(fromTime: number) {
  if (!this.clipboard || this.clipboard.notes.length === 0) {
    return [];  // Nothing to paste
  }
  
  // Calculate next bar
  const barsPerMeasure = 1;  // Assuming 4/4 time
  const nextBarStart = Math.ceil(fromTime / barsPerMeasure) * barsPerMeasure;
  
  // Paste and validate
  const newNotes = [];
  const timeDelta = nextBarStart - this.clipboard.minTime;
  
  for (let note of this.clipboard.notes) {
    const newTime = note.time + timeDelta;
    if (newTime >= 0) {  // Only add if within bounds
      newNotes.push({...note, time: newTime, id: generateNewId()});
    }
  }
  
  return newNotes;
}
```

---

## 9. Comparison with Other DAWs

| Feature | Ableton | FL Studio | Our App |
|---------|---------|-----------|---------|
| Ctrl+Click multi-select | ✓ | ✓ | ✓ |
| Shift+Click range select | ✓ | ✓ | ✓ |
| Drag all selected together | ✓ | ✓ | ✓ |
| Copy/Paste preserves spacing | ✓ | ✓ | ✓ |
| Paste at specific time | ✓ | ✓ | ✓ |
| Paste at next bar (smart) | ✓ | ✓ | ✓ |
| Keyboard shortcuts | ✓ | ✓ | ✓ |
| Visual selection feedback | ✓ | ✓ | ✓ |
| Delete selected (Del key) | ✓ | ✓ | ✓ |

---

## 10. Summary

This proposal brings **professional DAW-like multi-selection** to the synthesizer:

✅ **Selection:** Single, multi, range select  
✅ **Drag:** Move all selected notes together  
✅ **Copy:** Smart spacing preservation  
✅ **Paste:** At playhead or next bar  
✅ **Shortcuts:** Keyboard-driven workflow  
✅ **Feedback:** Clear visual indication  

Next step: Create `TimelineStateService` with full implementation.
