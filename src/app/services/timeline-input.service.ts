import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SequenceObject, Sequencer } from '../synthesizer/sequencer';
import * as Tone from 'tone';

export interface DragState {
  active: boolean;
  type: 'move' | 'resize-start' | 'resize-end' | null;
  noteIds: number[];
  startClientX: number;
  startClientY: number;
  originalPositions: Map<number, { time: number; length: number }>;
  startTime: number;
  endTime: number;
  dragOffsetX: number;
  dragOffsetY: number;
  handle: number; // 0 = start, 1 = end
  startRowIndex: number;
  pixelsPerBar: number;
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
  setConfig(bars: number, gridQuantize: number | null, timelineRect: DOMRect): void {
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
      console.warn('TimelineInputService: timelineRect not set');
      return;
    }

    const originalPositions = new Map<number, { time: number; length: number }>();

    // Store original positions for all notes being dragged
    for (const noteId of noteIds) {
      const note = this.sequencer.sequence.find((n: SequenceObject) => n.id === noteId);
      if (note) {
        // Convert Tone.Unit.Time to numbers (bars)
        // Note: In Sequencer, time and length are stored in bars (already numbers)
        const time = typeof note.time === 'number' ? note.time : Tone.Time(note.time).toSeconds() / Tone.Time('1m').toSeconds();
        const length = typeof note.length === 'number' ? note.length : Tone.Time(note.length).toSeconds() / Tone.Time('1m').toSeconds();
        
        if (time === undefined || length === undefined || isNaN(time) || isNaN(length)) {
          console.error(`❌ Invalid note ${noteId}:`, { time: note.time, length: note.length });
          continue;
        }
        
        originalPositions.set(noteId, { time, length });
      }
    }

    const positionLog = Array.from(originalPositions.entries()).map(([id, pos]) => ({
      noteId: id,
      time: pos.time,
      length: pos.length,
    }));
    console.log('🟢 startDragMultiple:', {
      noteIds,
      originalPositions: positionLog,
      startClientX: event.clientX,
      bars: this.bars,
      timelineWidth: this.timelineRect.width,
    });

    const pixelsPerBar = this.timelineRect.width / this.bars;

    const newState: DragState = {
      active: true,
      type: 'move',
      noteIds,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originalPositions,
      startTime: 0,
      endTime: 0,
      dragOffsetX: 0,
      dragOffsetY: 0,
      handle: 0,
      startRowIndex: 0,
      pixelsPerBar,
    };

    this.dragState.next(newState);
    // DO NOT set isDragging to true yet - wait for movement threshold
    // isDragging will be set by component when movement is detected
  }

  /**
   * Start resizing a note (start or end handle)
   */
  startResize(noteId: number, handle: 0 | 1, event: PointerEvent): void {
    if (!this.timelineRect) {
      console.warn('TimelineInputService: timelineRect not set');
      return;
    }

    const note = this.sequencer.sequence.find((n: SequenceObject) => n.id === noteId);
    if (!note) return;

    // Convert Tone.Unit.Time to numbers (bars)
    const noteTimeInBars = typeof note.time === 'number' ? note.time : Tone.Time(note.time).toSeconds() / Tone.Time('1m').toSeconds();
    const noteLengthInBars = typeof note.length === 'number' ? note.length : Tone.Time(note.length).toSeconds() / Tone.Time('1m').toSeconds();
    const pixelsPerBar = this.timelineRect.width / this.bars;

    const newState: DragState = {
      active: true,
      type: handle === 0 ? 'resize-start' : 'resize-end',
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
  startResizeMultiple(noteIds: number[], handle: 0 | 1, event: PointerEvent): void {
    if (!this.timelineRect) {
      console.warn('TimelineInputService: timelineRect not set');
      return;
    }

    const originalPositions = new Map<number, { time: number; length: number }>();

    for (const noteId of noteIds) {
      const note = this.sequencer.sequence.find((n: SequenceObject) => n.id === noteId);
      if (note) {
        // Convert Tone.Unit.Time to numbers (bars)
        const time = typeof note.time === 'number' ? note.time : Tone.Time(note.time).toSeconds() / Tone.Time('1m').toSeconds();
        const length = typeof note.length === 'number' ? note.length : Tone.Time(note.length).toSeconds() / Tone.Time('1m').toSeconds();
        
        originalPositions.set(noteId, { time, length });
      }
    }

    const pixelsPerBar = this.timelineRect.width / this.bars;

    const newState: DragState = {
      active: true,
      type: handle === 0 ? 'resize-start' : 'resize-end',
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

    if (state.type === 'move') {
      // Moving all selected notes - maintain their spacing
      for (const [noteId, original] of state.originalPositions) {
        let newTime = original.time + deltaInBars;
        newTime = Math.max(0, newTime); // Prevent going before start

        positions.set(noteId, {
          time: this.applyQuantization(newTime),
          length: original.length,
        });
      }
      console.log('📍 updateDrag (MOVE):', {
        deltaX,
        deltaInBars,
        pixelsPerBar: state.pixelsPerBar,
        type: state.type,
        positions: Array.from(positions.entries()).slice(0, 2), // Log first 2 notes
      });
    } else if (state.type === 'resize-start') {
      // Resizing start handle of all selected notes
      for (const [noteId, original] of state.originalPositions) {
        let newStartTime = original.time + deltaInBars;
        newStartTime = Math.max(0, Math.min(newStartTime, original.time + original.length - 0.05));

        positions.set(noteId, {
          time: this.applyQuantization(newStartTime),
          length: original.time + original.length - newStartTime,
        });
      }
      console.log('📍 updateDrag (RESIZE-START):', { deltaInBars, type: state.type });
    } else if (state.type === 'resize-end') {
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
      console.log('📍 updateDrag (RESIZE-END):', { deltaInBars, type: state.type });
    }

    return { positions, isValid, deltaInBars };
  }

  /**
   * End drag operation and return committed changes
   */
  endDrag(event: PointerEvent): DragCommit {
    const state = this.dragState.value;

    if (!state.active) {
      console.log('❌ endDrag: drag not active');
      return { success: false, updatedNotes: new Map() };
    }

    // Check if there was actual movement
    const hasMovement = Math.abs(event.clientX - state.startClientX) > 3;

    if (!hasMovement) {
      console.log('❌ endDrag: no movement detected');
      this.cancelDrag();
      return { success: false, updatedNotes: new Map() };
    }

    // Get final positions
    const update = this.updateDrag(event);

    if (!update.isValid) {
      console.log('❌ endDrag: invalid update');
      this.cancelDrag();
      return { success: false, updatedNotes: new Map() };
    }

    console.log('✅ endDrag: committing changes', {
      dragType: state.type,
      noteIds: state.noteIds,
      updates: Array.from(update.positions.entries()).slice(0, 2),
    });

    // Commit to sequencer
    const updatedNotes = new Map<number, { time: number; length: number }>();

    for (const [noteId, position] of update.positions) {
      const note = this.sequencer.sequence.find((n: SequenceObject) => n.id === noteId);
      if (note) {
        console.log(`  📝 Updating note ${noteId}:`, {
          before: { time: note.time, length: note.length },
          after: position,
        });
        this.sequencer.updateNote(
          noteId,
          note.note,
          position.time,
          position.length,
          note.velocity,
        );
        updatedNotes.set(noteId, position);
      }
    }

    this.cancelDrag();
    return { success: true, updatedNotes };
  }

  /**
   * Cancel drag operation (discard changes)
   */
  cancelDrag(): void {
    console.log('🔄 cancelDrag: resetting drag state');
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
  }
