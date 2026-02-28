import { Injectable, HostListener } from '@angular/core';
import { TimelineStateService } from './timeline-state.service';

@Injectable({
  providedIn: 'root',
})
export class TimelineKeyboardService {
  private onCopyCallback?: () => void;
  private onPasteCallback?: (noteIds: number[]) => void;
  private onDeleteCallback?: () => void;

  constructor(private timelineState: TimelineStateService) {}

  /**
   * Register callbacks for keyboard actions
   */
  registerCallbacks(options: {
    onCopy?: () => void;
    onPaste?: (noteIds: number[]) => void;
    onDelete?: () => void;
  }): void {
    this.onCopyCallback = options.onCopy;
    this.onPasteCallback = options.onPaste;
    this.onDeleteCallback = options.onDelete;
  }

  /**
   * Handle keyboard shortcuts
   * Should be called from Timeline.component with @HostListener
   */
  handleKeyDown(event: KeyboardEvent): void {
    // Ctrl+C or Cmd+C: Copy selected notes
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      this.handleCopy();
    }

    // Ctrl+V or Cmd+V: Paste at playhead
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      this.handlePaste();
    }

    // Delete or Backspace: Remove selected notes
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.handleDelete();
    }

    // Ctrl+A or Cmd+A: Select all notes
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.handleSelectAll();
    }

    // Escape: Deselect all
    if (event.key === 'Escape') {
      event.preventDefault();
      this.handleDeselect();
    }
  }

  /**
   * Handle copy action
   */
  private handleCopy(): void {
    const selected = this.timelineState.getSelectedCount();

    if (selected === 0) {
      console.log('No notes selected to copy');
      return;
    }

    this.timelineState.copySelected();
    console.log(`Copied ${selected} note(s) to clipboard`);

    // Trigger callback if registered
    this.onCopyCallback?.();
  }

  /**
   * Handle paste action
   * Note: Actual paste position should be determined by Timeline component
   */
  private handlePaste(): void {
    if (!this.timelineState.hasClipboard()) {
      console.log('Clipboard is empty');
      return;
    }

    // Get clipboard count for logging
    const clipboard = this.timelineState.clipboard$.subscribe(data => {
      if (data) {
        console.log(`Pasted ${data.notes.length} note(s)`);
      }
    });

    clipboard.unsubscribe();

    // Trigger callback if registered
    // The component is responsible for determining paste time and adding to sequencer
    this.onPasteCallback?.(this.timelineState.getSelectedNoteIds());
  }

  /**
   * Handle delete action
   */
  private handleDelete(): void {
    const selected = this.timelineState.getSelectedCount();

    if (selected === 0) {
      console.log('No notes selected to delete');
      return;
    }

    const confirmed = confirm(`Delete ${selected} note(s)?`);

    if (!confirmed) {
      return;
    }

    this.timelineState.deleteSelected();
    console.log(`Deleted ${selected} note(s)`);

    // Trigger callback if registered
    this.onDeleteCallback?.();
  }

  /**
   * Handle select all action
   */
  private handleSelectAll(): void {
    this.timelineState.selectAll();
    const count = this.timelineState.getSelectedCount();
    console.log(`Selected all ${count} note(s)`);
  }

  /**
   * Handle deselect action
   */
  private handleDeselect(): void {
    this.timelineState.clearSelection();
    console.log('Deselected all notes');
  }
}
