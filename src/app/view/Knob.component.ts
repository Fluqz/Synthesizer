import { fromEvent, Observable, Subscription } from "rxjs";
import { M } from "../util/math"
import { Vec2 } from "../util/math";
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnInit, OnChanges, AfterViewInit, OnDestroy, SimpleChanges, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { G } from "../globals";



@Component({

    selector: 'sy-knob',
    standalone: true,
    imports: [ CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    

    <div class="knob-wrapper" #dom>

        <!-- <div class="knob-value">{ value.toFixed(2) }</div> -->
        <div class="knob-value">
            <input type="number"
                    [value]="value?.toFixed(precision) ?? ''"
                    [step]="step"
                    (click)="$event.target.select()" 
                    (keydown)="$event.key == 'Enter' ? onInputChange($event) : null"
                    (change)="onInputChange($event)" />
        </div>

        <div class="knob shifting-GIF"
            [class.shifting-GIF]="animationEnabled"
            #knobDOM
            (pointerdown)="onPointerDown($event)"
            (touchstart)="onTouchStart($event)"
            (dblclick)="toggleReset()"
            [style]="getTransformStyle()">

                <div class="knob-pointer">

                    <div class="knob-mini-pointer"></div>
                </div>
                
        </div>

            <div *ngIf="name" class="knob-title">{{ name }}</div>

    </div>

        <div *ngIf="showResetBtn" class="knob-settings" 
                (click)="reset()"
                [style]="'left:' + mousePosition.x + 'px;'">
            Reset
        </div>
    
    `,

    styles: `
    
        
    .knob-wrapper {

        display: inline-block;
        text-align: center;

        font-size: 0.7rem;
        margin: 0px 5px 0px 5px;
        color: inherit;

        /* min-width: 50px; */
    }

    .knob {

    position: relative;

    cursor: grab;

    width: 30px;
    height: 30px;
    line-height: 30px;

    border-radius: 100%;
    /* border: 1px solid var(--c-bl); */

    background-color: blue;
    color: inherit;

    font-size: 0.7rem;

    overflow: hidden;

    margin: 0 auto;

    -webkit-user-select: none;  
    -moz-user-select: none;    
    -ms-user-select: none;      
    user-select: none;

    mix-blend-mode: difference;

    z-index: 100;
    }
    .knob:hover {
        
        background-image: url('/assets/imgs/circle-monochrome-yellow.gif');

        /* background-image: none; */
    }

    .knob .knob-pointer {

        position: absolute;
        top: 0px;
        left: calc(50% - (10% / 2));

        width: 100%;
        height: 100%;

        border-radius: 100%;

        /* transform: inherit; */
        
        mix-blend-mode: difference;
        background-color: var(--c-bl);

        display:flex;
        justify-content: center;
        align-items: center;

        overflow: hidden;
    }

    .knob .knob-pointer .knob-mini-pointer {

        width: 8px;
        height: 8px;

        border-radius: 100%;

        /* transform: inherit; */
        
        mix-blend-mode: difference;
        background-color: var(--c-y);

    }

    .knob .knob-value {
        /* .knob > .knob-value { */
        /* 
            position: absolute;

        width: 100%;
        height: 100%;
        line-height: inherit;

        text-align: center;

        z-index: 10; */
    }

    .knob-wrapper .knob-value input {

        width: 40px;
        height: auto;
        line-height: inherit;
        padding: 0px;

        border: none;
        outline: none;

        border-radius: 0px;

        text-decoration: none;

        text-align: center;

        background-color: transparent;
        color: inherit;
    }

    .knob-underlay {
    /* background-color: #FFF; */


    }

    .knob-settings {
        position: absolute;

        top: 0px;
        left: 0px;

        width: 100px;
        height: 100px;

        cursor: pointer;
    }

    
    
    `,
}) 
export class KnobComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {


    /** Name of Knob */
    @Input('name') name: string

    /** Current value */
    @Input('value') value: number = 0

    /** Minimum possible value */
    @Input('min') min: number = 0

    /** Maximum possible value */
    @Input('max') max: number = 1

    /** Step size for value increments (e.g., 1) */
    @Input('step') step: number = 1

    /** Number of decimal places to display */
    @Input('precision') precision: number = 0

    /** Scale type: 'linear' or 'logarithmic' */
    @Input('scaleType') scaleType: 'linear' | 'logarithmic' = 'linear'

    @Output('onChange') onChange: EventEmitter<any> = new EventEmitter()

    /** Initial value */
    initValue: number

    /** RequestAnimationFrame batching for drag updates */
    private pendingValue: number | null = null
    private pendingSource: 'drag' | 'input' | 'code' = 'code'
    private rafId: number | null = null
    private lastUpdateTime: number = 0
    private updateThrottleMs: number = 16 // ~30fps for audio updates (every 2-3 frames)

    /** Scroll RAF batching */
    private pendingScrollValue: number | null = null
    private scrollRafId: number | null = null
    private lastScrollUpdateTime: number = 0

    /** Wrapper dom element */
    @ViewChild('dom', {read: ElementRef}) private _dom: ElementRef<HTMLElement>
    get dom() : HTMLElement {

        if(this._dom == undefined) return null
        return this._dom.nativeElement 
    }

    @ViewChild('knobDOM', {read: ElementRef}) private _knobDOM: ElementRef<HTMLElement>
    get knobDOM() : HTMLElement {

        if(this._knobDOM == undefined) return null
        return this._knobDOM.nativeElement 
    }

    clientRect: DOMRect

    
    /** Center position of HTML element { x, y } */
    centerPosition: Vec2 = new Vec2()
    /** Current mouse position { x, y } */
    mousePosition: Vec2 = new Vec2()
    /** Current mouse position { x, y } */
    mouseDownPosition: Vec2 = new Vec2()
    /** Mouse offset from center of knob */
    offsetMousePosition: Vec2 = new Vec2()

    /** Drag init value */
    dragInitValue: number
    /** Drag starting position */
    dragStartPosition: Vec2 = new Vec2()
    /** Last shift state during drag */
    lastDragShiftState: boolean = false


    /** Current angle when turning knob */
    angle: number = 0

    /** Is mouse drag active */
    drag: boolean = false
    /** Is mouse button pressed down */
    isMouseDown: boolean = false
    /** Is key pressed down */
    isKeyDown: Boolean = false
    /** Is Shift key pressed down */
    isShiftDown: boolean = false

    /** Amount of pixels the cursor is allowed to travel between the mousedown and mouseup event. 
     * If value is exeeding clickRange, no click has occured.
    */
    clickRange: number = 2

    showResetBtn: boolean = false

    /** Pixels needed to drag for a full rotation (constant visual speed) */
    pixelsPerFullRotation: number = 150

    /** Accumulated scroll delta for sensitivity control */
    private scrollAccumulator: number = 0
    /** Scroll threshold before applying value change */
    private scrollThreshold: number = 50


    wheelObservable: Observable<number>

    unsubscribeWheelObserver: Subscription

    /** On 'touchstart' event callback */
    onTouchStart: any
    /** On 'touchmove' event callback */
    onTouchMove: any
    /** On 'touchend' event callback */
    onTouchEnd: any


    constructor() {

        /** On 'touchstart' event callback */
        this.onTouchStart = this.onPointerDown.bind(this)
        /** On 'touchmove' event callback */
        this.onTouchMove = this.onPointerMove.bind(this)
        /** On 'touchend' event callback */
        this.onTouchEnd = this.onPointerUp.bind(this)


        document.addEventListener('pointermove', this.onPointerMove.bind(this))
        document.addEventListener('pointerup', this.onPointerUp.bind(this))
        document.addEventListener('touchmove', this.onTouchMove.bind(this))
        document.addEventListener('touchend', this.onTouchEnd.bind(this))

        document.addEventListener('keydown', this.onKeyDown.bind(this))
        document.addEventListener('keyup', this.onKeyUp.bind(this))

    }

    get animationEnabled() { return G.animationEnabled }

    ngOnInit() {
        // Validate inputs
        if (this.min >= this.max) {
            console.warn('KnobComponent: min must be less than max')
            this.max = this.min + 1
        }

        if (this.step <= 0) {
            console.warn('KnobComponent: step must be positive')
            this.step = 0.01
        }

        if (this.precision < 0) {
            console.warn('KnobComponent: precision cannot be negative')
            this.precision = 0
        }

        // Clamp initial value
        this.value = this.clampValue(this.value)
    }

    ngOnChanges(changes: SimpleChanges) {
        // Recalculate angle whenever inputs change
        if (changes['value'] || changes['min'] || changes['max']) {
            this.updateAngle()
        }
    }

    toggleReset() {

        return this.showResetBtn = !this.showResetBtn
    }

    reset = () => {

        this.setValueInternal(this.initValue, 'code')
    }

    /**
     * Convert actual value to normalized value (0-1)
     */
    private toNormalized(value: number): number {
        let normalized = (value - this.min) / (this.max - this.min)

        if (this.scaleType === 'logarithmic') {
            // For logarithmic scale, apply log transformation
            // Map to log space
            const logMin = Math.log(this.min <= 0 ? 0.001 : this.min)
            const logMax = Math.log(this.max)
            const logValue = Math.log(value <= 0 ? 0.001 : value)
            normalized = (logValue - logMin) / (logMax - logMin)
        }

        return M.clamb(0, 1, normalized)
    }

    /**
     * Convert normalized value (0-1) to actual value
     */
    private fromNormalized(normalized: number): number {
        normalized = M.clamb(0, 1, normalized)

        let value: number

        if (this.scaleType === 'logarithmic') {
            // For logarithmic scale, apply inverse log transformation
            const logMin = Math.log(this.min <= 0 ? 0.001 : this.min)
            const logMax = Math.log(this.max)
            const logValue = logMin + (normalized * (logMax - logMin))
            value = Math.exp(logValue)
        } else {
            // Linear scale
            value = this.min + (normalized * (this.max - this.min))
        }

        return value
    }

    /**
     * Snap value to nearest step
     */
    private snapToStep(value: number): number {
        if (this.step <= 0) return value
        return Math.round(value / this.step) * this.step
    }

    /**
     * Clamp value to valid range [min, max]
     */
    private clampValue(value: number): number {
        return Math.max(this.min, Math.min(this.max, value))
    }

    /**
     * Unified method to set value from any source
     */
    setValueInternal = (v: number, source: 'drag' | 'input' | 'code' = 'code') => {

        if (Number.isNaN(v)) return

        // Clamp to range
        let newValue = this.clampValue(v)

        // Snap to step increments
        newValue = this.snapToStep(newValue)

        // Update value
        this.value = newValue

        // Update angle based on normalized value
        this.updateAngle()

        // Emit change event with detail property for compatibility with Node.component
        this.onChange.next({ detail: this.value })
    }

    /**
     * Calculate angle based on current value
     * Always uses linear mapping for smooth, predictable visual rotation
     * Logarithmic scale only affects the actual values, not the visual feedback
     */
    private updateAngle = () => {
        // Linear normalization for smooth visual feedback (ignore scale type)
        const linearNormalized = (this.value - this.min) / (this.max - this.min)
        // Full 360 degree rotation: starts at 6 o'clock (90°), ends at 6 o'clock (450°)
        // linear 0 (min) = 90deg (6 o'clock), linear 1 (max) = 450deg (full rotation back to 6 o'clock)
        this.angle = (linearNormalized * Math.PI * 2) + (Math.PI * 0.5)
    }


    // EVENTS

    onInputChange = (e: InputEvent) => {

        const ele = e.target as HTMLInputElement

        this.setValueInternal(ele.valueAsNumber, 'input')

        if(e instanceof KeyboardEvent && e.key == 'Enter') ele.blur()
    }

    /** On 'mousedown' event callback */
    onPointerDown = (e: PointerEvent) => {

        e.preventDefault()
        e.stopPropagation()

        if(e.which === 3) return

        this.isMouseDown = true
        this.drag = false

        this.mouseDownPosition.set(e.clientX, e.clientY)
        this.mousePosition.set(e.clientX, e.clientY)

        this.clientRect = this.knobDOM.getBoundingClientRect()

        this.centerPosition.set( this.clientRect.x + (this.clientRect.width / 2), this.clientRect.y + (this.clientRect.height / 2))

        this.offsetMousePosition.set(this.mousePosition.x - this.centerPosition.x, this.mousePosition.y - this.centerPosition.y)
    }

    /** On 'mousemove' event callback */
    onPointerMove = (e: PointerEvent) => {

        e.preventDefault()
        e.stopPropagation()
        
        // If mouse is not clicked while moving
        if(!this.isMouseDown) return

        // Keep track of mouse position
        this.mousePosition.set(e.clientX, e.clientY)

        // Keep track of mouse position offset
        this.offsetMousePosition.set(this.mousePosition.x - this.centerPosition.x, this.mousePosition.y - this.centerPosition.y)


        // Check if mouse has moved more than clickRange
        if(this.mouseDownPosition.distanceTo(this.mousePosition) > this.clickRange) {
         
            if(this.drag == false) {

                this.dragStartPosition.copy(this.mousePosition)
                this.dragInitValue = this.value
                this.lastDragShiftState = this.isShiftDown
            }

            this.drag = true
        }

        // Dragging 
        if(!this.drag) return

        // Calculate pixels moved vertically (negative = up, positive = down)
        const pixelsMoved = this.dragStartPosition.y - this.mousePosition.y

        // Shift key = half speed (double pixels for full rotation)
        const effectivePixelsPerFullRotation = this.isShiftDown ? this.pixelsPerFullRotation * 2 : this.pixelsPerFullRotation

        // Convert pixels to normalized value change (0-1 range)
        // Constant visual speed: pixelsMoved determines the fraction of full range
        const normalizedChange = pixelsMoved / effectivePixelsPerFullRotation
        const rawValueChange = normalizedChange * (this.max - this.min)

        // Calculate new value
        const newValue = this.dragInitValue + rawValueChange

        // Store pending update instead of applying immediately
        this.pendingValue = newValue
        this.pendingSource = 'drag'

        // Schedule throttled update
        if (this.rafId === null) {
            this.rafId = requestAnimationFrame(() => {
                const now = performance.now()
                if (now - this.lastUpdateTime >= this.updateThrottleMs && this.pendingValue !== null) {
                    this.setValueInternal(this.pendingValue, this.pendingSource)
                    this.lastUpdateTime = now
                    this.pendingValue = null
                }
                this.rafId = null
            })
        }
    }

    /** On 'mouseup' event callback */
    onPointerUp = (e: PointerEvent) => { 

        this.isMouseDown = false

        if(this.drag) return

        // Click
        // showResetBtn = true
    }

    /** On 'keydown' event callback */
    onKeyDown = (e: KeyboardEvent) => {

        this.isKeyDown = true
        if (e.shiftKey && !this.isShiftDown) {
            this.isShiftDown = true
            // Adjust drag start position if currently dragging
            if (this.drag) {
                this.adjustDragStartForShiftChange()
            }
        }
    }

    /** On 'keyup' event callback */
    onKeyUp = (e: KeyboardEvent) => {

        this.isKeyDown = false
        if (e.key === 'Shift' && this.isShiftDown) {
            this.isShiftDown = false
            // Adjust drag start position if currently dragging
            if (this.drag) {
                this.adjustDragStartForShiftChange()
            }
        }
    }

    /** Adjust drag start position when Shift state changes to prevent jumps */
    private adjustDragStartForShiftChange = () => {
        const oldEffectivePixelsPerFullRotation = this.lastDragShiftState ? this.pixelsPerFullRotation * 2 : this.pixelsPerFullRotation
        const newEffectivePixelsPerFullRotation = this.isShiftDown ? this.pixelsPerFullRotation * 2 : this.pixelsPerFullRotation
        
        // Adjust start position so value change remains the same
        // pixelDistance = dragStart.y - mousePos.y
        // newDragStart.y = mousePos.y + pixelDistance * (newEffective / oldEffective)
        const pixelDistance = this.dragStartPosition.y - this.mousePosition.y
        const scaleFactor = newEffectivePixelsPerFullRotation / oldEffectivePixelsPerFullRotation
        
        this.dragStartPosition.y = this.mousePosition.y + pixelDistance * scaleFactor
        this.lastDragShiftState = this.isShiftDown
    }

    onScroll = (e: any) => {
        
        e.preventDefault()
        e.stopPropagation()

        // Accumulate scroll delta for smoother, less sensitive trackpad control
        this.scrollAccumulator += e.deltaY

        // Only apply value change when threshold is exceeded
        if (Math.abs(this.scrollAccumulator) >= this.scrollThreshold) {
            // Scroll up (negative deltaY) increases value, scroll down decreases
            const direction = this.scrollAccumulator > 0 ? 1 : -1
            const steps = Math.floor(Math.abs(this.scrollAccumulator) / this.scrollThreshold)
            // Shift key = half speed
            const effectiveStep = this.isShiftDown ? this.step * 0.5 : this.step
            const valueChange = direction * steps * effectiveStep

            // Store pending scroll update
            this.pendingScrollValue = this.value + valueChange
            this.scrollAccumulator = 0

            // Schedule throttled scroll update
            if (this.scrollRafId === null) {
                this.scrollRafId = requestAnimationFrame(() => {
                    const now = performance.now()
                    if (now - this.lastScrollUpdateTime >= this.updateThrottleMs && this.pendingScrollValue !== null) {
                        this.setValueInternal(this.pendingScrollValue, 'input')
                        this.lastScrollUpdateTime = now
                        this.pendingScrollValue = null
                    }
                    this.scrollRafId = null
                })
            }
        }
    }

    getTransformStyle() {

        return 'transform: rotate(' + Math.round(this.angle * (180 / Math.PI)) + 'deg);'
    }

    ngAfterViewInit() {

        this.initValue = this.value
        this.updateAngle()

        if (this.knobDOM) {
            this.knobDOM.addEventListener('wheel', this.onScroll.bind(this))
        }
    }

    ngOnDestroy() {

        // Cancel pending animation frames
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId)
            this.rafId = null
        }
        if (this.scrollRafId !== null) {
            cancelAnimationFrame(this.scrollRafId)
            this.scrollRafId = null
        }

        document.removeEventListener('pointermove', this.onPointerMove.bind(this))
        document.removeEventListener('pointerup', this.onPointerUp.bind(this))
        document.removeEventListener('touchmove', this.onTouchMove.bind(this))
        document.removeEventListener('touchend', this.onTouchEnd.bind(this))

        document.removeEventListener('keydown', this.onKeyDown.bind(this))
        document.removeEventListener('keyup', this.onKeyUp.bind(this))

        if(this.unsubscribeWheelObserver) this.unsubscribeWheelObserver.unsubscribe()
    }
}
