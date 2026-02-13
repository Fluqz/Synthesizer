

import { AfterViewInit, Component, Input } from "@angular/core";
import { Key } from "../synthesizer/key";




@Component({


    selector: 'sy-key',
    standalone: true,
    template: `
        
        
    <div 
        class="key" 
        [class.black]="key.note[1] == '#' || key.note[1] === 'b'"
        [class.pressed]="key.isPressed"
        [style]="key.isPressed ? 'transform: scale(1.1); transform-origin: center;' : ''">
        
        <!-- on:pointerdown={onTrigger}  -->
        <!-- on:pointerup={onRelease}  -->
        <!-- on:pointerleave={onRelease} -->

        <div class="key-text key-mapping" [innerHtml]="key.mapping.toLocaleUpperCase() + '<br/>'"></div>

        <div class="key-text key-note">{{ key.note + (key.octave != undefined ? key.octave.toString() : '') }}</div>

    </div>

    
    
    
    `,

    styles: `
        
    :host {

        width: auto
        height: auto;
    }

    .key {

        display: inline-block;
        /* align-items: center;
        justify-content: center; */

        width: calc(100% / 36);
        /* height: calc(100vw / 36); */
        height: 70px;

        background-color: var(--c-y);

        font-size: .7rem;
        color: var(--c-b);
        text-align: center;

        /* border-radius: 3px; */

        transition: .4s transform;
        z-index: 0;

        border: .5px solid var(--c-b);
        box-sizing: border-box;

    }
    .key.black {
        background-color: #0000FF55;
        color: var(--c-w);
    }
    .key .key-text {
        height: 30%;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .key.black .key-note {
    }
    .key.pressed {

        background-color: var(--c-bl);
        color: var(--c-y);
        z-index: 1;
    }

    `
})

export class KeyComponent implements AfterViewInit {


    /** Key instance passed down from Synthesizer */
    @Input('key') key: Key

    private keyDownHandler: (e: KeyboardEvent) => void
    private keyUpHandler: (e: KeyboardEvent) => void


    constructor() {

        this.keyDownHandler = this.onKeyDown.bind(this)
        this.keyUpHandler = this.onKeyUp.bind(this)
    }

    /** Event callback for keydown, pointerdown */
    onTrigger = () => {
        this.key.trigger()
        this.key = this.key
    }

    /** Event callback for keyup, pointerup, pointerleave */
    onRelease = () => {
        this.key.release()
        this.key = this.key
    }

    /** Keydown event */
    onKeyDown = (e: KeyboardEvent) => {

        if(!e) return
        if(e.repeat) return
        if(e.target instanceof HTMLInputElement) return

        if(this.key.mapping === e.key || this.key.mapping === e.key.toLowerCase()) {

            this.onTrigger()
        }
    }

    /** Keyup event */
    onKeyUp = (e: KeyboardEvent) => {

        // if(G.debug) console.log('keyUp: key', e.key)

        if(!e) return
        if(e.target instanceof HTMLInputElement) return

        if(this.key.mapping === e.key || this.key.mapping === e.key.toLowerCase()) {

            this.onRelease()
        }
    }

    // On document ready
    ngAfterViewInit() {

        // Events
        document.addEventListener('keydown', this.keyDownHandler, false)
        document.addEventListener('keyup', this.keyUpHandler, false)

        // On destroy
        return () => {

            document.removeEventListener('keydown', this.keyDownHandler, false)
            document.removeEventListener('keyup', this.keyUpHandler, false)
        }
    }

}