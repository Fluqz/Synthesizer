import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { SequenceObject, Sequencer } from "../synthesizer/sequencer";
import * as Tone from "tone";

const FIXED_ROW_HEIGHT = 25; // pixels

export interface DragState {
  active: boolean;
  type: "move" | "resize-start" | "resize-end" | null;
  noteIds: number[];
  startClientX: number;
  startClientY: number;
  originalPositions: Map<number, { time: number; length: number }>;
  originalRowIndices?: Map<number, number>; // Original row indices for each note
  startTime: number;
  endTime: number;
  dragOffsetX: number;
  dragOffsetY: number;
  handle: number; // 0 = start, 1 = end
  startRowIndex: number;
  pixelsPerBar: number;
  currentRowIndex?: number; // Current row during drag
  initialPointerRowIndex?: number; // The row the pointer started at (for correct delta calculation)
  initialClientY?: number; // The Y position where pointer started (for row delta calculation)
}

export interface DragUpdate {
  positions: Map<number, { time: number; length: number }>;
  isValid: boolean;
  deltaInBars: number;
}

export interface DragCommit {
  success: boolean;
  updatedNotes: Map<number, { time: number; length: number }>;
}

const initialDragState: DragState = {
  active: false,
  type: null,
  noteIds: [],
  startClientX: 0,
  startClientY: 0,
  originalPositions: new Map(),
  startTime: 0,
  endTime: 0,
  dragOffsetX: 0,
  dragOffsetY: 0,
  handle: 0,
  startRowIndex: 0,
  pixelsPerBar: 0,
};

@Injectable()
export class TimelineInputService {
  private dragState = new BehaviorSubject<DragState>(initialDragState);
  private isDragging = new BehaviorSubject<boolean>(false);

  dragState$ = this.dragState.asObservable();
  isDragging$ = this.isDragging.asObservable();

  private gridQuantize: number | null = 0.25;
  private bars: number = 4;
  private timelineRect: DOMRect | null = null;
  private sequencer: Sequencer | null = null;

  constructor() {}

  /**
   * Set the sequencer instance (call from Timeline component)
   */
  setSequencer(sequencer: Sequencer): void {
    this.sequencer = sequencer;
  }

  /**
   * Set timeline configuration (bars, grid quantize, etc.)
   */
  setConfig(
    bars: number,
    gridQuantize: number | null,
    timelineRect: DOMRect,
  ): void {
    this.bars = bars;
    this.gridQuantize = gridQuantize;
    this.timelineRect = timelineRect;
  }

  /**
   * Start dragging a single note
   */
  startDrag(noteId: number, event: PointerEvent): void {
    this.startDragMultiple([noteId], event);
  }

  /**
   * Start dragging multiple notes
   * Note: Sets active=true but isDragging$ remains false until movement threshold is met
   */
  startDragMultiple(noteIds: number[], event: PointerEvent): void {
    if (!this.timelineRect) {
      console.warn("TimelineInputService: timelineRect not set");
      return;
    }

    const originalPositions = new Map<
      number,
      { time: number; length: number }
    >();
    const originalRowIndices = new Map<number, number>();

    // Store original positions and row indices for all notes being dragged
    for (const noteId of noteIds) {
      const note = this.sequencer.sequence.find(
        (n: SequenceObject) => n.id === noteId,
      );
      if (note) {
        // Convert Tone.Unit.Time to numbers (bars)
        // Note: In Sequencer, time and length are stored in bars (already numbers)
        const time =
          typeof note.time === "number"
            ? note.time
            : Tone.Time(note.time).toSeconds() / Tone.Time("1m").toSeconds();
        const length =
          typeof note.length === "number"
            ? note.length
            : Tone.Time(note.length).toSeconds() / Tone.Time("1m").toSeconds();

        if (
          time === undefined ||
          length === undefined ||
          isNaN(time) ||
          isNaN(length)
        ) {
          console.error(`❌ Invalid note ${noteId}:`, {
            time: note.time,
            length: note.length,
          });
          continue;
        }

        originalPositions.set(noteId, { time, length });
        originalRowIndices.set(noteId, note.rowIndex !== undefined && note.rowIndex !== -1 ? note.rowIndex : this.sequencer.sequence.indexOf(note));
      }
    }

    const positionLog = Array.from(originalPositions.entries()).map(
      ([id, pos]) => ({
        noteId: id,
        time: pos.time,
        length: pos.length,
        rowIndex: originalRowIndices.get(id),
      }),
    );
    console.log("🟢 startDragMultiple:", {
      noteIds,
      originalPositions: positionLog,
      startClientX: event.clientX,
      bars: this.bars,
      timelineWidth: this.timelineRect.width,
    });

    const pixelsPerBar = this.timelineRect.width / this.bars;

    // Use the minimum row index of all dragged notes as the reference
    // This ensures proper offset calculations for all notes
    const rowIndices = Array.from(originalRowIndices.values());
    let startRowIndex = rowIndices.length > 0 ? Math.min(...rowIndices) : 0;
    
    console.log('📊 Row indices for selected notes:', {
      originalRowIndices: Array.from(originalRowIndices.entries()),
      rowIndices,
      startRowIndex,
      initialClientY: event.clientY,
    });
    let firstNote: SequenceObject | undefined;

    if (noteIds.length > 0) {
      firstNote = this.sequencer.sequence.find((n) => n.id === noteIds[0]);
      if (firstNote) {
        console.log("📌 Note row assignment:", {
          noteId: firstNote.id,
          rowIndex: firstNote.rowIndex,
          startRowIndex,
          allRowIndices: Array.from(originalRowIndices.entries()),
        });
      }
    }

    // Debug: show all note rows
    const allNotes = this.sequencer.sequence.map((n) => ({
      id: n.id,
      rowIndex: n.rowIndex,
    }));
    console.log("📊 All notes in sequence:", allNotes);

    // Check if the note we're dragging was just created
    if (firstNote) {
      console.log("🎬 First note details:", {
        id: firstNote.id,
        rowIndex: firstNote.rowIndex,
        time: firstNote.time,
      });
    }

    const newState: DragState = {
      active: true,
      type: "move",
      noteIds,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originalPositions,
      originalRowIndices,
      startTime: 0,
      endTime: 0,
      dragOffsetX: 0,
      dragOffsetY: 0,
      handle: 0,
      startRowIndex,
      pixelsPerBar,
      currentRowIndex: startRowIndex,
      initialClientY: event.clientY,
    };

    console.log("🟢 startDragMultiple:", { noteIds, startRowIndex });

    this.dragState.next(newState);
    // DO NOT set isDragging to true yet - wait for movement threshold
    // isDragging will be set by component when movement is detected
  }

  /**
   * Start resizing a note (start or end handle)
   */
  startResize(noteId: number, handle: 0 | 1, event: PointerEvent): void {
    if (!this.timelineRect) {
      console.warn("TimelineInputService: timelineRect not set");
      return;
    }

    const note = this.sequencer.sequence.find(
      (n: SequenceObject) => n.id === noteId,
    );
    if (!note) return;

    // Convert Tone.Unit.Time to numbers (bars)
    const noteTimeInBars =
      typeof note.time === "number"
        ? note.time
        : Tone.Time(note.time).toSeconds() / Tone.Time("1m").toSeconds();
    const noteLengthInBars =
      typeof note.length === "number"
        ? note.length
        : Tone.Time(note.length).toSeconds() / Tone.Time("1m").toSeconds();
    const pixelsPerBar = this.timelineRect.width / this.bars;

    const newState: DragState = {
      active: true,
      type: handle === 0 ? "resize-start" : "resize-end",
      noteIds: [noteId],
      startClientX: event.clientX,
      startClientY: event.clientY,
      originalPositions: new Map([
        [noteId, { time: noteTimeInBars, length: noteLengthInBars }],
      ]),
      startTime: noteTimeInBars,
      endTime: noteTimeInBars + noteLengthInBars,
      dragOffsetX: 0,
      dragOffsetY: 0,
      handle,
      startRowIndex: 0,
      pixelsPerBar,
    };

    this.dragState.next(newState);
    this.isDragging.next(true);
  }

  /**
   * Start resizing multiple notes (resize end of all selected)
   */
  startResizeMultiple(
    noteIds: number[],
    handle: 0 | 1,
    event: PointerEvent,
  ): void {
    if (!this.timelineRect) {
      console.warn("TimelineInputService: timelineRect not set");
      return;
    }

    const originalPositions = new Map<
      number,
      { time: number; length: number }
    >();

    for (const noteId of noteIds) {
      const note = this.sequencer.sequence.find(
        (n: SequenceObject) => n.id === noteId,
      );
      if (note) {
        // Convert Tone.Unit.Time to numbers (bars)
        const time =
          typeof note.time === "number"
            ? note.time
            : Tone.Time(note.time).toSeconds() / Tone.Time("1m").toSeconds();
        const length =
          typeof note.length === "number"
            ? note.length
            : Tone.Time(note.length).toSeconds() / Tone.Time("1m").toSeconds();

        originalPositions.set(noteId, { time, length });
      }
    }

    const pixelsPerBar = this.timelineRect.width / this.bars;

    const newState: DragState = {
      active: true,
      type: handle === 0 ? "resize-start" : "resize-end",
      noteIds,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originalPositions,
      startTime: 0,
      endTime: 0,
      dragOffsetX: 0,
      dragOffsetY: 0,
      handle,
      startRowIndex: 0,
      pixelsPerBar,
    };

    this.dragState.next(newState);
    this.isDragging.next(true);
  }

  /**
   * Update current row during drag based on pointer Y position
   * Determines which row the pointer is currently over
   */
  updateDragRow(
    clientY: number,
    timelineTop: number,
    timelineHeight: number,
    totalRows: number,
  ): void {
    const state = this.dragState.value;
    if (!state.active || state.type !== "move") return;

    // Calculate which row the mouse pointer is currently over
    const relativeY = clientY - timelineTop;
    const rowHeight = timelineHeight / totalRows;
    const rowUnderPointer = Math.floor(relativeY / rowHeight);
    
    // Clamp to valid row range [0, totalRows-1]
    const newRowIndex = Math.max(0, Math.min(rowUnderPointer, totalRows - 1));
    const currentRow = state.currentRowIndex !== undefined ? state.currentRowIndex : 0;
    
    // Update row if mouse is over a different row
    if (newRowIndex !== currentRow) {
      const newState = { ...state, currentRowIndex: newRowIndex };
      this.dragState.next(newState);
    }
  }

  /**
   * Update drag positions (called on pointermove)
   */
  updateDrag(event: PointerEvent): DragUpdate {
    const state = this.dragState.value;

    if (!state.active) {
      return { positions: new Map(), isValid: false, deltaInBars: 0 };
    }

    const deltaX = event.clientX - state.startClientX;
    const deltaInBars = deltaX / state.pixelsPerBar;

    const positions = new Map<number, { time: number; length: number }>();
    let isValid = true;

    if (state.type === "move") {
      // Moving all selected notes - maintain their spacing
      for (const [noteId, original] of state.originalPositions) {
        let newTime = original.time + deltaInBars;
        // Boundary: prevent going before start and beyond the timeline end
        const maxTime = this.bars - original.length;
        newTime = Math.max(0, Math.min(newTime, maxTime));

        positions.set(noteId, {
          time: this.applyQuantization(newTime),
          length: original.length,
        });
      }
    } else if (state.type === "resize-start") {
      // Resizing start handle of all selected notes
      for (const [noteId, original] of state.originalPositions) {
        let newStartTime = original.time + deltaInBars;
        newStartTime = Math.max(
          0,
          Math.min(newStartTime, original.time + original.length - 0.05),
        );

        positions.set(noteId, {
          time: this.applyQuantization(newStartTime),
          length: original.time + original.length - newStartTime,
        });
      }
    } else if (state.type === "resize-end") {
      // Resizing end handle of all selected notes
      for (const [noteId, original] of state.originalPositions) {
        const newEndTime = original.time + original.length + deltaInBars;
        const minDuration = 0.05;

        if (newEndTime <= original.time + minDuration) {
          isValid = false;
          continue;
        }

        const newLength = newEndTime - original.time;
        positions.set(noteId, {
          time: original.time,
          length: this.applyQuantization(newLength),
        });
      }
    }

    return { positions, isValid, deltaInBars };
  }

  /**
   * End drag operation and return committed changes
   */
  endDrag(event: PointerEvent): DragCommit {
    const state = this.dragState.value;

    if (!state.active) {
      console.log("❌ endDrag: drag not active", {
        dragStateActive: state.active,
        dragStateType: state.type,
        isDragging: this.isDragging.value,
      });
      return { success: false, updatedNotes: new Map() };
    }

    // Check if there was actual movement (X or Y direction)
    const hasXMovement = Math.abs(event.clientX - state.startClientX) > 3;
    const hasYMovement = Math.abs(event.clientY - state.startClientY) > 3;
    const hasMovement = hasXMovement || hasYMovement;

    if (!hasMovement) {
      this.cancelDrag();
      return { success: false, updatedNotes: new Map() };
    }

    // Get final positions
    const update = this.updateDrag(event);

    if (!update.isValid) {
      this.cancelDrag();
      return { success: false, updatedNotes: new Map() };
    }

    // Commit to sequencer
    const updatedNotes = new Map<number, { time: number; length: number }>();

    for (const [noteId, position] of update.positions) {
      const note = this.sequencer.sequence.find(
        (n: SequenceObject) => n.id === noteId,
      );
      if (note) {
        this.sequencer.updateNote(
          noteId,
          note.note,
          position.time,
          position.length,
          note.velocity,
        );

        // Update row index only for move operations (not resize)
        // Preserve relative row offsets between dragged notes
        if (
          state.type === "move" &&
          state.currentRowIndex !== undefined &&
          state.originalRowIndices
        ) {
          const originalRowIndex = state.originalRowIndices.get(noteId) || 0;
          const rowOffset = originalRowIndex - state.startRowIndex;
          note.rowIndex = state.currentRowIndex + rowOffset;
        }

        updatedNotes.set(noteId, position);
      }
    }

    // Cut overlapping notes on drag end (for move operations)
    if (state.type === "move") {
      this.cutOverlappingNotes();
    }

    this.cancelDrag();
    return { success: true, updatedNotes };
  }

  /**
   * Cancel drag operation (discard changes)
   */
  cancelDrag(): void {
    this.dragState.next(initialDragState);
    this.isDragging.next(false);
  }

  /**
   * Get current drag state
   */
  getDragState(): DragState {
    return this.dragState.value;
  }

  /**
   * Check if currently dragging
   */
  isCurrentlyDragging(): boolean {
    return this.isDragging.value;
  }

  /**
   * Set dragging state (called by component when movement threshold is met)
   */
  setDragging(isDragging: boolean): void {
    this.isDragging.next(isDragging);
  }

  /**
   * Apply grid quantization if enabled
   */
  private applyQuantization(value: number): number {
    if (this.gridQuantize === null) return value;
    return Math.round(value / this.gridQuantize) * this.gridQuantize;
  }

  /**
   * Add a new empty row to the timeline
   */
  addRow(): void {
    if (!this.sequencer) return;
    console.log(
      "✅ Row created (notes can now be assigned to higher rowIndex values)",
    );
    // Rows are created on-demand when notes are assigned to them via updateDrag or manual rowIndex assignment
  }

  /**
   * Cut overlapping notes when a dragged note is dropped
   * Finds all notes in the target row that overlap with the dragged note and truncates them
   */
  cutOverlappingNotes(): void {
    if (!this.sequencer) return;

    const state = this.dragState.value;
    if (!state.active || state.type !== "move" || state.noteIds.length === 0)
      return;

    const notes = this.sequencer.sequence;

    // Get the moved notes and their current positions
    const movedNotes = notes.filter((n) => state.noteIds.includes(n.id));

    // For each moved note, find and cut overlapping notes in the same row
    for (const movedNote of movedNotes) {
      const movedTime = typeof movedNote.time === "number" ? movedNote.time : 0;
      const movedLength =
        typeof movedNote.length === "number" ? movedNote.length : 0;
      const movedEnd = movedTime + movedLength;
      const movedRow = movedNote.rowIndex || 0;

      // Find all notes in the same row that overlap with the moved note
      const overlappingNotes = notes.filter((n) => {
        if (n.id === movedNote.id || (n.rowIndex || 0) !== movedRow)
          return false;

        const noteTime = typeof n.time === "number" ? n.time : 0;
        const noteLength = typeof n.length === "number" ? n.length : 0;
        const noteEnd = noteTime + noteLength;

        // Check for overlap
        return noteTime < movedEnd && noteEnd > movedTime;
      });

      // Cut each overlapping note
      for (const overlappingNote of overlappingNotes) {
        const overlapTime =
          typeof overlappingNote.time === "number" ? overlappingNote.time : 0;
        const overlapLength =
          typeof overlappingNote.length === "number"
            ? overlappingNote.length
            : 0;
        const overlapEnd = overlapTime + overlapLength;

        // If the moved note starts before the overlapping note ends
        if (movedTime < overlapEnd && movedTime > overlapTime) {
          // Cut the overlapping note to end where the moved note starts
          const newLength = movedTime - overlapTime;
          if (newLength > 0.05) {
            // Only update if resulting length is meaningful
            this.sequencer.updateNote(
              overlappingNote.id,
              overlappingNote.note,
              overlapTime,
              newLength,
              overlappingNote.velocity,
            );
            console.log(
              `✂️  Cut note ${overlappingNote.id}: length ${overlapLength} → ${newLength}`,
            );
          } else {
            // If cut would be too short, remove the note
            this.sequencer.removeNote(overlappingNote.id);
            console.log(
              `🗑️  Removed note ${overlappingNote.id} (too short after cut)`,
            );
          }
        }
      }
    }
  }

  /**
   * Auto-arrange notes into rows when they overlap
   * Notes on the same row must not overlap horizontally
   */
  autoArrangeRows(): void {
    if (!this.sequencer) return;

    const notes = this.sequencer.sequence;

    // Reset all row indices
    notes.forEach((note) => {
      note.rowIndex = 0;
    });

    // Sort notes by start time for processing
    const sortedNotes = [...notes].sort((a, b) => {
      const timeA = typeof a.time === "number" ? a.time : 0;
      const timeB = typeof b.time === "number" ? b.time : 0;
      return timeA - timeB;
    });

    // Assign each note to the first available row that doesn't overlap
    for (const note of sortedNotes) {
      const noteTime = typeof note.time === "number" ? note.time : 0;
      const noteLength = typeof note.length === "number" ? note.length : 0;
      const noteEnd = noteTime + noteLength;

      let assignedRow = 0;
      let rowFound = false;

      // Try to find a row where this note doesn't overlap with existing notes
      for (let row = 0; row <= notes.length; row++) {
        const notesInRow = notes.filter(
          (n) => (n.rowIndex || 0) === row && n.id !== note.id,
        );

        // Check if note overlaps with any note in this row
        const hasOverlap = notesInRow.some((otherNote) => {
          const otherTime =
            typeof otherNote.time === "number" ? otherNote.time : 0;
          const otherLength =
            typeof otherNote.length === "number" ? otherNote.length : 0;
          const otherEnd = otherTime + otherLength;

          // Check for overlap: note starts before otherNote ends AND note ends after otherNote starts
          return noteTime < otherEnd && noteEnd > otherTime;
        });

        if (!hasOverlap) {
          assignedRow = row;
          rowFound = true;
          break;
        }
      }

      note.rowIndex = assignedRow;
    }
  }
}
