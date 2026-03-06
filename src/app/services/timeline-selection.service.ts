import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  visible: boolean;
}

const initialSelectionBox: SelectionBox = {
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  visible: false,
};

@Injectable()
export class TimelineSelectionService {
  private selectionBox = new BehaviorSubject<SelectionBox>(initialSelectionBox);
  private isDragSelecting = new BehaviorSubject<boolean>(false);

  selectionBox$ = this.selectionBox.asObservable();
  isDragSelecting$ = this.isDragSelecting.asObservable();

  private dragSelectStartX: number | null = null;
  private dragSelectStartY: number | null = null;
  private pointerMovedAmount = 0;
  private timelineElement: HTMLElement | null = null;

  /**
   * Set the timeline element for hit detection
   */
  setTimelineElement(element: HTMLElement): void {
    this.timelineElement = element;
  }

  /**
   * Start drag selection operation
   */
  startDragSelection(event: PointerEvent): void {
    this.dragSelectStartX = event.clientX;
    this.dragSelectStartY = event.clientY;
    this.pointerMovedAmount = 0;

    // Don't show box yet - wait for threshold
    this.selectionBox.next({
      ...initialSelectionBox,
      startX: event.clientX,
      startY: event.clientY,
    });
  }

  /**
   * Update drag selection box position
   * Call this on pointermove to update the selection rectangle
   */
  updateDragSelection(event: PointerEvent): void {
    if (this.dragSelectStartX === null || this.dragSelectStartY === null) {
      return;
    }

    // Track movement amount
    const deltaX = event.clientX - (this.dragSelectStartX || 0);
    const deltaY = event.clientY - (this.dragSelectStartY || 0);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 5) {
      // Only show box after 5px movement
      this.isDragSelecting.next(true);
    }

    if (!this.isDragSelecting.value) {
      return;
    }

    this.selectionBox.next({
      startX: this.dragSelectStartX,
      startY: this.dragSelectStartY,
      currentX: event.clientX,
      currentY: event.clientY,
      visible: true,
    });
  }

  /**
   * End drag selection and return selected note IDs
   */
  endDragSelection(event: PointerEvent): number[] {
    const box = this.selectionBox.value;

    if (!box.visible || !this.timelineElement) {
      this.cancelDragSelection();
      return [];
    }

    // Get all note elements
    const noteElements = Array.from(
      this.timelineElement.querySelectorAll(".note"),
    ) as HTMLElement[];

    // Find notes that intersect with selection box
    const selectedNoteIds: number[] = [];

    for (const noteElement of noteElements) {
      if (this.isNoteIntersectingBox(noteElement, box)) {
        const noteId = noteElement.getAttribute("data-note-id");
        if (noteId) {
          selectedNoteIds.push(parseInt(noteId, 10));
        }
      }
    }

    this.cancelDragSelection();
    return selectedNoteIds;
  }

  /**
   * Cancel drag selection
   */
  cancelDragSelection(): void {
    this.dragSelectStartX = null;
    this.dragSelectStartY = null;
    this.pointerMovedAmount = 0;
    this.isDragSelecting.next(false);
    this.selectionBox.next(initialSelectionBox);
  }

  /**
   * Check if a note element intersects with selection box
   */
  private isNoteIntersectingBox(
    noteElement: HTMLElement,
    box: SelectionBox,
  ): boolean {
    const noteRect = noteElement.getBoundingClientRect();

    const boxRect = {
      left: Math.min(box.startX, box.currentX),
      top: Math.min(box.startY, box.currentY),
      right: Math.max(box.startX, box.currentX),
      bottom: Math.max(box.startY, box.currentY),
    };

    // Check for intersection
    return !(
      noteRect.right < boxRect.left ||
      noteRect.left > boxRect.right ||
      noteRect.bottom < boxRect.top ||
      noteRect.top > boxRect.bottom
    );
  }

  /**
   * Get selection box bounding info
   */
  getSelectionBoxBounds(): {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null {
    const box = this.selectionBox.value;

    if (!box.visible) {
      return null;
    }

    return {
      x: Math.min(box.startX, box.currentX),
      y: Math.min(box.startY, box.currentY),
      width: Math.abs(box.currentX - box.startX),
      height: Math.abs(box.currentY - box.startY),
    };
  }

  /**
   * Check if currently drag-selecting
   */
  isCurrentlyDragSelecting(): boolean {
    return this.isDragSelecting.value;
  }
}
