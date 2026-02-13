



import { fromEvent, Observable, Subscription } from "rxjs";
import { M } from "../util/math"
import { Vec2 } from "../util/math";
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";



@Component({

    selector: 'sy-knob',
    standalone: true,
    imports: [ CommonModule],
    template: `
    

    <div class="knob-wrapper" #dom>

        <!-- <div class="knob-value">{ value.toFixed(2) }</div> -->
        <div class="knob-value">
            <input type="number"
                    [value]="value ?? ''"
                    [step]="steps"
                    (click)="$event.target.select()" 
                    (keydown)="$event.key == 'Enter' ? onInputChannge($event) : null"
                    (change)="onInputChannge($event)" />
        </div>

        <div class="knob shifting-GIF" 
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
export class KnobComponent {


    /** Name of Knob */
    @Input('name') name: string
    /** Current value */
    @Input('value') value: number = 0
    /** Minimum possible value */
    @Input('min') min: number = 0
    /** Maximum possible value */
    @Input('max') max: number = 1

    public steps: number = 100

    @Output('onChange') onChange: EventEmitter<number> = new EventEmitter()

    /** Initial value */
    initValue: number

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


    /** Current angle when turning knob */
    angle: number = 0

    /** Is mouse drag active */
    drag: boolean = false
    /** Is mouse button pressed down */
    isMouseDown: boolean = false
    /** Is key pressed down */
    isKeyDown: Boolean = false

    /** Amount of pixels the cursor is allowed to travel between the mousedown and mouseup event. 
     * If value is exeeding clickRange, no click has occured.
    */
    clickRange: number = 2

    showResetBtn: boolean = false


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
        this.onTouchMove = this.onPointerMove
        /** On 'touchend' event callback */
        this.onTouchEnd = this.onPointerUp


        document.addEventListener('pointermove', this.onPointerMove.bind(this))
        document.addEventListener('pointerup', this.onPointerUp.bind(this))
        document.addEventListener('touchmove', this.onTouchMove.bind(this))
        document.addEventListener('touchend', this.onTouchEnd.bind(this))

        document.addEventListener('keydown', this.onKeyDown.bind(this))
        document.addEventListener('keyup', this.onKeyUp.bind(this))

    }

    toggleReset() {

        return this.showResetBtn = !this.showResetBtn
    }

    reset = () => {

        this.setValue(this.initValue)
    }

    /** Set value between 0 - 1 */
    setValue = (v: number) => {

        console.log('val', v, Number.isNaN(v))
        if(Number.isNaN(v)) return
        
        // this.value = v

        // value = M.map(0, 1, min, max, value)

        // console.log('Change', name, 'to :', value, initValue)

        this.value = M.clamb(this.min, this.max, v)
        
        this.getAngle()

        this.onChange.next(this.value)
    }

    getAngle = () => {

        const oneDegree = ((this.max - this.min) / (Math.PI * 2))
        
        return this.angle = (this.value / oneDegree) - (this.min / oneDegree)
    }


    // EVENTS

    onInputChannge = (e: InputEvent) => {

        const ele = e.target as HTMLInputElement

        this.setValue(ele.valueAsNumber)

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

        // console.log('mousemove', e)

        // Keep track of mouse position
        this.mousePosition.set(e.clientX, e.clientY)

        // Keep track of mouse position offset
        this.offsetMousePosition.set(this.mousePosition.x - this.centerPosition.x, this.mousePosition.y - this.centerPosition.y)


        // Check if mouse has moved more than clickRange
        if(this.mouseDownPosition.distanceTo(this.mousePosition) > this.clickRange) {
         
            if(this.drag == false) {

                this.dragStartPosition.copy(this.mousePosition)
                this.dragInitValue = this.value
            }

            this.drag = true
        }

        // Dragging 
        if(!this.drag) return

        const distance = this.dragStartPosition.y - this.mousePosition.y

        const val = M.clamb(this.min, this.max, this.dragInitValue + (distance * this.steps))

        console.log(val)
        this.setValue(val)
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

        // if(e.key === 'Meta') this.steps *= 40
        // if(e.key === 'Meta') steps /= 4

        this.isKeyDown = true
    }
    /** On 'keyup' event callback */
    onKeyUp = (e: KeyboardEvent) => {


        // if(e.key === 'Meta') this.steps /= 40
        // if(e.key === 'Meta') steps *= 4

        this.isKeyDown = false
    }
    onScroll = (e: any) => {

        if(!e.shiftKey) return
        
        e.preventDefault()
        e.stopPropagation()
        
        
        // if(e.wheelDelta > 0) setValue(M.clamb(min, max, M.map(min, max, 0, 1, value - ((1 / steps) * Math.round(Math.abs(e.wheelDelta / 5))))))
        // else if(e.wheelDelta < 0) setValue(M.clamb(min, max, M.map(min, max, 0, 1, value + ((1 / steps) * Math.round(Math.abs(e.wheelDelta / 5))))))
        
        // console.log('knob', this.min, this.max, this.value, this.steps, Math.round(Math.abs(e.wheelDelta)))

        // if(e.wheelDelta > 0) this.setValue(M.clamb(this.min, this.max, this.value - (this.steps * Math.round(Math.abs(e.wheelDelta))) / 30))
        // else if(e.wheelDelta < 0) this.setValue(M.clamb(this.min, this.max, this.value + (this.steps * Math.round(Math.abs(e.wheelDelta))) / 30))
            

    }

    getTransformStyle() {

        return 'transform: rotate(' + Math.round(this.angle * (180 / Math.PI)) + 'deg);'
    }

    ngAfterViewInit() {

        this.initValue = this.value
        this.getAngle()

        this.knobDOM.addEventListener('wheel', this.onScroll.bind(this))
    }

    ngOnDestroy() {

        document.removeEventListener('pointermove', this.onPointerMove.bind(this))
        document.removeEventListener('pointerup', this.onPointerUp.bind(this))
        document.removeEventListener('touchmove', this.onTouchMove.bind(this))
        document.removeEventListener('touchend', this.onTouchEnd.bind(this))

        document.removeEventListener('keydown', this.onKeyDown.bind(this))
        document.removeEventListener('keyup', this.onKeyUp.bind(this))

        if(this.unsubscribeWheelObserver) this.unsubscribeWheelObserver.unsubscribe()
    }
}