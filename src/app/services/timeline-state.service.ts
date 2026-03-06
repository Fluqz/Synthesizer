import { Injectable, Inject, Optional } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { SequenceObject, Sequencer } from "../synthesizer/sequencer";

export interface ClipboardData {
  notes: SequenceObject[];
  minTime: number;
  maxTime: number;
  duration: number;
  relativeTimes: number[];
  minRowIndex: number;
  rowIndices: number[];
}

@Injectable()
export class TimelineStateService {
  private selectedNoteIds = new BehaviorSubject<Set<number>>(new Set());
  private clipboard = new BehaviorSubject<ClipboardData | null>(null);
  private lastClickedNoteId: number | null = null;
  private sequencer: Sequencer | null = null;

  selectedNoteIds$ = this.selectedNoteIds.asObservable();
  clipboard$ = this.clipboard.asObservable();

  constructor() {}

  /**
   * Set the sequencer instance (call from Timeline component)
   */
  setSequencer(sequencer: Sequencer): void {
    this.sequencer = sequencer;
  }

  /**
   * Select a single note, optionally clearing others
   */
  selectNote(noteId: number, clearOthers: boolean = true): void {
    if (clearOthers) {
      this.selectedNoteIds.next(new Set([noteId]));
    } else {
      const current = new Set(this.selectedNoteIds.value);
      current.add(noteId);
      this.selectedNoteIds.next(current);
    }
    this.lastClickedNoteId = noteId;
  }

  /**
   * Toggle a note's selection state (add or remove)
   */
  toggleSelectNote(noteId: number): void {
    const current = new Set(this.selectedNoteIds.value);
    if (current.has(noteId)) {
      current.delete(noteId);
    } else {
      current.add(noteId);
    }
    this.selectedNoteIds.next(current);
    this.lastClickedNoteId = noteId;
  }

  /**
   * Select multiple notes
   */
  selectNotes(noteIds: number[], clearOthers: boolean = true): void {
    if (clearOthers) {
      this.selectedNoteIds.next(new Set(noteIds));
    } else {
      const current = new Set(this.selectedNoteIds.value);
      noteIds.forEach((id) => current.add(id));
      this.selectedNoteIds.next(current);
    }
    if (noteIds.length > 0) {
      this.lastClickedNoteId = noteIds[noteIds.length - 1];
    }
  }

  /**
   * Select range of notes between two note IDs (by time order)
   * IMPORTANT: Adds to existing selection (doesn't clear it)
   */
  selectRange(fromNoteId: number | null, toNoteId: number): void {
    if (!fromNoteId) {
      // If no previous selection, start fresh
      this.selectNote(toNoteId, true);
      return;
    }

    const fromNote = this.sequencer.sequence.find(
      (n: SequenceObject) => n.id === fromNoteId,
    );
    const toNote = this.sequencer.sequence.find(
      (n: SequenceObject) => n.id === toNoteId,
    );

    if (!fromNote || !toNote) {
      console.warn("selectRange: Could not find notes", {
        fromNoteId,
        toNoteId,
      });
      return;
    }

    const fromTime = typeof fromNote.time === "number" ? fromNote.time : 0;
    const toTime = typeof toNote.time === "number" ? toNote.time : 0;

    const minTime = Math.min(fromTime, toTime);
    const maxTime = Math.max(fromTime, toTime);

    // Get notes in the range
    const range = this.sequencer.sequence
      .filter((n: SequenceObject) => {
        const nTime = typeof n.time === "number" ? n.time : 0;
        return nTime >= minTime && nTime <= maxTime;
      })
      .map((n: SequenceObject) => n.id);

    // ADD to existing selection, don't replace it
    const current = new Set(this.selectedNoteIds.value);
    range.forEach((id) => current.add(id));

    console.log("📋 selectRange:", {
      fromNoteId,
      toNoteId,
      minTime,
      maxTime,
      rangeIds: range,
      totalSelected: current.size,
    });

    this.selectedNoteIds.next(current);
    this.lastClickedNoteId = toNoteId;
  }

  /**
   * Select all notes in the sequencer
   */
  selectAll(): void {
    const allIds = this.sequencer.sequence.map((n: SequenceObject) => n.id);
    this.selectedNoteIds.next(new Set(allIds));
  }

  /**
   * Clear all selections
   */
  clearSelection(): void {
    this.selectedNoteIds.next(new Set());
    this.lastClickedNoteId = null;
  }

  /**
   * Check if a note is selected
   */
  isNoteSelected(noteId: number): boolean {
    return this.selectedNoteIds.value.has(noteId);
  }

  /**
   * Get all selected note IDs
   */
  getSelectedNoteIds(): number[] {
    return Array.from(this.selectedNoteIds.value);
  }

  /**
   * Get all selected note objects
   */
  getSelectedNotes(): SequenceObject[] {
    const ids = this.selectedNoteIds.value;
    return this.sequencer.sequence.filter((n: SequenceObject) => ids.has(n.id));
  }

  /**
   * Get count of selected notes
   */
  getSelectedCount(): number {
    return this.selectedNoteIds.value.size;
  }

  /**
   * Copy selected notes to clipboard
   */
  copySelected(): void {
    const selected = this.getSelectedNotes();
    if (selected.length === 0) {
      this.clipboard.next(null);
      return;
    }

    // Calculate timing info
    const times = selected.map((n) =>
      typeof n.time === "number" ? n.time : 0,
    );
    const lengths = selected.map((n) =>
      typeof n.length === "number" ? n.length : 0,
    );
    const rowIndices = selected.map((n) => n.rowIndex || 0);

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times.map((t, i) => t + (lengths[i] || 0)));
    const duration = maxTime - minTime;
    const minRowIndex = Math.min(...rowIndices);

    const relativeTimes = times.map((t) => t - minTime);

    this.clipboard.next({
      notes: selected.map((n) => ({ ...n })),
      minTime,
      maxTime,
      duration,
      relativeTimes,
      minRowIndex,
      rowIndices,
    });
  }

  /**
   * Paste clipboard at specific time and in a new row
   */
  pasteAtTime(pasteTime: number, targetRowIndex?: number): SequenceObject[] {
    const clipboardData = this.clipboard.value;
    if (!clipboardData || clipboardData.notes.length === 0) {
      return [];
    }

    const timeDelta = pasteTime - clipboardData.minTime;
    const newNotes: SequenceObject[] = [];

    // If targetRowIndex not specified, find the next available row
    let newRowIndex =
      targetRowIndex !== undefined
        ? targetRowIndex
        : this.findNextAvailableRow();

    for (let i = 0; i < clipboardData.notes.length; i++) {
      const originalNote = clipboardData.notes[i];
      const newTime =
        (typeof originalNote.time === "number" ? originalNote.time : 0) +
        timeDelta;

      // Validate time is >= 0
      if (newTime >= 0) {
        // Calculate relative row offset from the original clipboard data
        const originalRowIndex = clipboardData.rowIndices[i] || 0;
        const rowOffset = originalRowIndex - clipboardData.minRowIndex;
        const noteRowIndex = newRowIndex + rowOffset;

        const newNote: SequenceObject = {
          ...originalNote,
          id: this.generateNewNoteId(),
          time: newTime,
          rowIndex: noteRowIndex,
        };
        newNotes.push(newNote);
      }
    }

    return newNotes;
  }

  /**
   * Find the next available row index (one after the max currently used)
   */
  private findNextAvailableRow(): number {
    if (!this.sequencer || this.sequencer.sequence.length === 0) {
      return 0;
    }

    const maxRowIndex = Math.max(
      ...this.sequencer.sequence.map((n) => n.rowIndex || 0),
    );
    return maxRowIndex + 1;
  }

  /**
   * Paste at next bar boundary from given time
   * E.g., if playhead is at 3.5, next bar (assuming 4/4 time) is 4.0
   * If fromTime is 0 (not playing), paste after the last existing note
   */
  pasteAtNextBar(fromTime: number): SequenceObject[] {
    const clipboardData = this.clipboard.value;
    if (!clipboardData || clipboardData.notes.length === 0) {
      return [];
    }

    // If not playing (fromTime = 0), find the end of the last note
    let pasteTime = fromTime;
    if (
      fromTime === 0 &&
      this.sequencer &&
      this.sequencer.sequence.length > 0
    ) {
      // Find the latest end time of all notes
      let maxEndTime = 0;
      for (const note of this.sequencer.sequence) {
        const noteTime = typeof note.time === "number" ? note.time : 0;
        const noteLength = typeof note.length === "number" ? note.length : 0;
        const noteEndTime = noteTime + noteLength;
        maxEndTime = Math.max(maxEndTime, noteEndTime);
      }
      // Paste one bar after the last note ends (or at bar 1 if timeline is empty)
      pasteTime = Math.ceil(maxEndTime) || 1;
    } else {
      // Calculate next bar (assuming 1 bar = 1 unit)
      pasteTime = Math.ceil(fromTime);
    }

    return this.pasteAtTime(pasteTime);
  }

  /**
   * Delete selected notes from sequencer
   */
  deleteSelected(): void {
    const selected = this.getSelectedNotes();
    for (let note of selected) {
      this.sequencer.removeNote(note.id);
    }
    this.clearSelection();
  }

  /**
   * Check if clipboard has data
   */
  hasClipboard(): boolean {
    return (
      this.clipboard.value !== null && this.clipboard.value.notes.length > 0
    );
  }

  /**
   * Get last clicked note ID (for range select)
   */
  getLastClickedNoteId(): number | null {
    return this.lastClickedNoteId;
  }

  /**
   * Generate a new unique note ID
   */
  private generateNewNoteId(): number {
    if (this.sequencer.sequence.length === 0) return 1;
    const maxId = Math.max(
      ...this.sequencer.sequence.map((n: SequenceObject) => n.id || 0),
    );
    return maxId + 1;
  }
}
