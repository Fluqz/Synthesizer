# Timeline Services Integration Guide

## Services Created

### 1. **TimelineStateService** (150 lines)
**File:** `src/app/services/timeline-state.service.ts`

Handles:
- ✅ Selection state (single, multi, range select)
- ✅ Clipboard operations (copy, paste)
- ✅ Delete selected notes
- ✅ Select all / clear selection

**Key Methods:**
```typescript
selectNote(noteId, clearOthers?)
toggleSelectNote(noteId)
selectNotes(noteIds, clearOthers?)
selectRange(fromNoteId, toNoteId)
selectAll()
clearSelection()
copySelected()
pasteAtTime(time)
pasteAtNextBar(fromTime)
deleteSelected()
getSelectedNoteIds(): number[]
getSelectedNotes(): SequenceObject[]
```

**Observables:**
```typescript
selectedNoteIds$: Observable<Set<number>>
clipboard$: Observable<ClipboardData | null>
```

---

### 2. **TimelineInputService** (220 lines)
**File:** `src/app/services/timeline-input.service.ts`

Handles:
- ✅ Drag state management (single & multiple notes)
- ✅ Resize state (start & end handles, multiple notes)
- ✅ Position calculations with quantization
- ✅ Boundary validation
- ✅ Commit changes to sequencer

**Key Methods:**
```typescript
setConfig(bars, gridQuantize, timelineRect)
startDrag(noteId, event)
startDragMultiple(noteIds, event)
startResize(noteId, handle, event)
startResizeMultiple(noteIds, handle, event)
updateDrag(event): DragUpdate
endDrag(event): DragCommit
cancelDrag()
```

**Observables:**
```typescript
dragState$: Observable<DragState>
isDragging$: Observable<boolean>
```

**Features:**
- Tracks original positions before drag starts
- Applies grid quantization automatically
- Validates positions (no negative time, min duration)
- Supports multi-note drag with spacing preservation
- **NEW: Supports multi-note resize!**

---

### 3. **TimelineSelectionService** (140 lines)
**File:** `src/app/services/timeline-selection.service.ts`

Handles:
- ✅ Rectangular selection box drawing
- ✅ Hit detection (which notes in box)
- ✅ Visual selection box state

**Key Methods:**
```typescript
setTimelineElement(element)
startDragSelection(event)
updateDragSelection(event)
endDragSelection(event): number[]
cancelDragSelection()
```

**Observables:**
```typescript
selectionBox$: Observable<SelectionBox>
isDragSelecting$: Observable<boolean>
```

**Features:**
- 5px movement threshold before showing box
- Detects note intersection with selection box
- Returns IDs of selected notes

---

### 4. **TimelineKeyboardService** (110 lines)
**File:** `src/app/services/timeline-keyboard.service.ts`

Handles:
- ✅ Ctrl+C / Cmd+C: Copy
- ✅ Ctrl+V / Cmd+V: Paste
- ✅ Delete / Backspace: Remove selected
- ✅ Ctrl+A / Cmd+A: Select all
- ✅ Escape: Deselect

**Key Methods:**
```typescript
handleKeyDown(event)
registerCallbacks(options)
```

**Features:**
- Confirmation dialog before delete
- Console logging for debugging
- Callback registration for component integration

---

## Integration into Timeline.component.ts

### Step 1: Add Service Dependencies

```typescript
import { TimelineStateService } from '../services/timeline-state.service';
import { TimelineInputService } from '../services/timeline-input.service';
import { TimelineSelectionService } from '../services/timeline-selection.service';
import { TimelineKeyboardService } from '../services/timeline-keyboard.service';

export class TimelineComponent implements OnInit, OnDestroy {
  constructor(
    private timelineState: TimelineStateService,
    private inputService: TimelineInputService,
    private selectionService: TimelineSelectionService,
    private keyboardService: TimelineKeyboardService,
    private sequencer: Sequencer,
    private cdr: ChangeDetectorRef,
  ) {}
}
```

### Step 2: Setup Observables in ngOnInit

```typescript
ngOnInit() {
  // Subscribe to selection changes
  this.timelineState.selectedNoteIds$.subscribe(ids => {
    this.cdr.markForCheck();
  });

  // Subscribe to clipboard changes
  this.timelineState.clipboard$.subscribe(() => {
    this.cdr.markForCheck();
  });

  // Subscribe to drag state
  this.inputService.isDragging$.subscribe(dragging => {
    if (!dragging) {
      this.cdr.markForCheck();
    }
  });

  // Subscribe to selection box
  this.selectionService.isDragSelecting$.subscribe(selecting => {
    if (!selecting) {
      this.cdr.markForCheck();
    }
  });

  // Register keyboard callbacks
  this.keyboardService.registerCallbacks({
    onCopy: () => this.onCopyFeedback(),
    onDelete: () => this.onDeleteFeedback(),
    onPaste: (noteIds) => this.onPasteFeedback(noteIds),
  });
}
```

### Step 3: Handle onTimelineClick

```typescript
private onTimelineClick(event: PointerEvent) {
  const dragHandle = (event.target as HTMLElement).closest('.drag-handle');
  const noteElement = (event.target as HTMLElement).closest('.note');
  const controlBtn = (event.target as HTMLElement).closest('.note-controls');

  if (dragHandle && noteElement) {
    // RESIZE HANDLE: Start resize
    const noteId = parseInt(noteElement.getAttribute('data-note-id') || '0');
    const handleType = (dragHandle as HTMLElement).getAttribute('data-handle');
    const handle = handleType === 'start' ? 0 : 1;

    // Check if this note is selected
    const selectedIds = this.timelineState.getSelectedNoteIds();
    if (selectedIds.includes(noteId) && selectedIds.length > 1) {
      // Resize all selected notes
      this.inputService.startResizeMultiple(selectedIds, handle, event);
    } else {
      // Resize only this note
      this.inputService.startResize(noteId, handle, event);
    }
  } else if (controlBtn) {
    // NOTE CONTROL BUTTON: Don't start drag
    return;
  } else if (noteElement) {
    // NOTE BODY: Handle selection + potential drag
    const noteId = parseInt(noteElement.getAttribute('data-note-id') || '0');

    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click: Toggle selection
      this.timelineState.toggleSelectNote(noteId);
    } else if (event.shiftKey) {
      // Shift+Click: Range select
      const lastClicked = this.timelineState.getLastClickedNoteId();
      this.timelineState.selectRange(lastClicked, noteId);
    } else {
      // Single click: Select only this note
      this.timelineState.selectNote(noteId, true);
    }

    // If selected notes exist, prepare to drag them
    const selectedIds = this.timelineState.getSelectedNoteIds();
    if (selectedIds.length > 0) {
      this.inputService.startDragMultiple(selectedIds, event);
    }
  } else {
    // EMPTY TIMELINE: Start rectangular selection or clear
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
      this.timelineState.clearSelection();
    }
    this.selectionService.startDragSelection(event);
  }
}
```

### Step 4: Handle onDocumentPointerMove

```typescript
@HostListener('document:pointermove', ['$event'])
private onDocumentPointerMove(event: PointerEvent) {
  event.stopPropagation();

  // Handle drag/resize
  if (this.inputService.isCurrentlyDragging()) {
    const update = this.inputService.updateDrag(event);
    if (update.isValid) {
      // Update DOM visually (without change detection)
      // Implementation depends on how you're rendering the notes
    }
  }

  // Handle rectangular selection
  if (this.selectionService.isCurrentlyDragSelecting()) {
    this.selectionService.updateDragSelection(event);
  }
}
```

### Step 5: Handle onDocumentPointerUp

```typescript
@HostListener('document:pointerup', ['$event'])
private onDocumentPointerUp(event: PointerEvent) {
  event.stopPropagation();

  // Handle rectangular selection end (priority over drag)
  const selectedIds = this.selectionService.endDragSelection(event);
  if (selectedIds.length > 0) {
    this.timelineState.selectNotes(selectedIds);
  } else {
    // Handle drag/resize end
    const commit = this.inputService.endDrag(event);
    if (commit.success) {
      this.updateWrapperHeight();
      this.saveUndo();
    }
  }

  this.cdr.markForCheck();
}
```

### Step 6: Handle Keyboard Input

```typescript
@HostListener('document:keydown', ['$event'])
private onKeyDown(event: KeyboardEvent) {
  this.keyboardService.handleKeyDown(event);
}
```

### Step 7: Setup Services Config in ngAfterViewInit

```typescript
ngAfterViewInit() {
  if (this.timeline) {
    this.timelineRect = this.timeline.getBoundingClientRect();
    
    // Configure services
    this.inputService.setConfig(
      this.bars,
      this.gridQuantize,
      this.timelineRect,
    );

    this.selectionService.setTimelineElement(this.timeline.nativeElement);
  }

  this.onResizeTimeline();
}
```

### Step 8: Update getSequenceObject Template Logic

```typescript
getSequenceObject(note: SequenceObject): SequenceObject {
  // Check if note is being dragged (visual feedback)
  const dragState = this.inputService.getDragState();
  if (
    dragState.active &&
    dragState.type === 'move' &&
    dragState.noteIds.includes(note.id)
  ) {
    // Return altered position for visual feedback during drag
    const update = this.inputService.updateDrag({ clientX: 0 } as PointerEvent);
    const pos = update.positions.get(note.id);
    if (pos) {
      return { ...note, time: pos.time, length: pos.length };
    }
  }

  return note;
}
```

### Step 9: Update Template for Visual Feedback

```html
<!-- Selection count indicator -->
<div class="selection-info" *ngIf="(selectedNoteIds$ | async) as selectedIds">
  <span *ngIf="selectedIds.size > 0">
    {{ selectedIds.size }} note(s) selected
  </span>
</div>

<!-- Rectangular selection box -->
<div class="timeline-selection-overlay" *ngIf="(selectionBox$ | async) as box">
  <div
    class="selection-rect"
    *ngIf="box.visible"
    [style.left.px]="Math.min(box.startX, box.currentX)"
    [style.top.px]="Math.min(box.startY, box.currentY)"
    [style.width.px]="Math.abs(box.currentX - box.startX)"
    [style.height.px]="Math.abs(box.currentY - box.startY)"
  ></div>
</div>

<!-- Notes rendering -->
<sy-note
  *ngFor="let note of sequence; let i = $index"
  [note]="getSequenceObject(note)"
  [isSelected]="(selectedNoteIds$ | async)?.has(note.id)"
  [isDragging]="(inputService.isDragging$ | async)"
>
</sy-note>
```

### Step 10: Update Note.component.ts

```typescript
export class NoteComponent {
  @Input() note: SequenceObject;
  @Input() isSelected: boolean;
  @Input() isDragging: boolean;

  getSelectedClass() {
    if (!this.isSelected) return '';
    if (this.isDragging) return 'selected dragging';
    return 'selected';
  }
}
```

---

## CSS Additions

```css
/* Selection count info */
.selection-info {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid var(--c-hl);
  border-radius: 4px;
  font-size: 12px;
  color: var(--c-hl);
}

/* Rectangular selection box */
.timeline-selection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.selection-rect {
  position: absolute;
  border: 2px dashed var(--c-hl);
  background: rgba(0, 255, 0, 0.1);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
}

/* Note selection states */
.note.selected {
  border: 2px solid var(--c-hl);
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  background: rgba(0, 255, 0, 0.1);
  z-index: 10;
}

.note.selected.dragging {
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.5);
  opacity: 0.9;
  cursor: grabbing;
}
```

---

## Features Implemented

✅ **Selection:**
- Single click = select one note
- Ctrl+Click = toggle note
- Shift+Click = range select
- Drag on empty = rectangular select
- Ctrl+A = select all
- Escape = deselect all

✅ **Multi-Selection Drag:**
- Click on selected note = drag all selected together
- Maintains relative spacing
- Visual feedback during drag

✅ **Multi-Note Resize:**
- Click resize handle on selected note = resize all together
- Both start and end handles
- Maintains relative spacing

✅ **Copy/Paste:**
- Ctrl+C = copy selected
- Ctrl+V = paste at next bar
- Preserves spacing
- Auto-selects pasted notes

✅ **Delete:**
- Delete key = remove selected notes
- Confirmation dialog
- Clears selection after

✅ **Visual Feedback:**
- Selection count indicator
- Selected notes highlighted green
- Rectangular selection box visible
- Dragging feedback

---

## Testing Checklist

- [ ] Single note select (click)
- [ ] Multi-select (Ctrl+Click)
- [ ] Range select (Shift+Click)
- [ ] Rectangular select (drag on empty)
- [ ] Select all (Ctrl+A)
- [ ] Deselect (Escape)
- [ ] Drag single note
- [ ] Drag multiple selected notes together
- [ ] Resize single note (both handles)
- [ ] Resize multiple notes together
- [ ] Copy (Ctrl+C)
- [ ] Paste (Ctrl+V)
- [ ] Delete selected (Delete key)
- [ ] Undo/Redo works with all operations
- [ ] Grid quantization still works
- [ ] Note controls show/hide correctly
- [ ] Audio playback works during operations

---

## Next Steps

1. **Integrate services into Timeline.component.ts** (1-2 hours)
   - Inject services
   - Replace old event handlers with service calls
   - Update template for observables
   - Test incrementally

2. **Add visual feedback** (30 min)
   - CSS for selection states
   - Selection count UI
   - Rectangular selection box styling

3. **Manual testing** (1 hour)
   - All selection scenarios
   - Multi-note drag
   - Multi-note resize
   - Copy/Paste
   - Keyboard shortcuts
   - Edge cases

4. **Polish** (30 min)
   - Toast notifications for actions
   - Better visual feedback
   - Performance optimization if needed
