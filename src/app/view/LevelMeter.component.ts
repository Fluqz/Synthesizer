
import * as Tone from "tone";
import { M } from "../util/math";
import { AfterViewInit, Component, Input, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";


@Component({

    selector: 'sy-level-meter',
    standalone: true,
    imports: [ CommonModule ],
    template: `

        <div *ngIf="output != undefined" class="btn level-meter" [class.shifting-GIF]="value < clipping">

            <div *ngIf="value != min">

                <div class="level" [style]="'height:' + percentage + ' %;background-color:#FF00FF;'" [class.clipping]="value > clipping"></div>

                <div id="level-value">{{ value.toFixed(0) }}</div>
                
            </div>

        </div>

`,
    styles: `

    .level-meter {

        margin: 0px 5px;

        border-top-left-radius: 100%;
        border-top-right-radius: 100%;

        border-radius: 100%;
        /* border: 2px solid var(--c-y); */

        overflow: hidden;

        cursor: default;

        /* width: 50px; */
        /* height: 50px; */
        /* line-height: 50px; */

        width: 30px;
        height: 30px;
        line-height: 30px;


        padding: 0px;
        margin: 0px;

        position: relative;

        background-color: var(--c-bl);
        color: var(--c-y);


        mix-blend-mode: unset;

    }
    .level-meter:active,
    .level-meter:hover {
        
        background-color: var(--c-bl);
        color: var(--c-y);
    }

    .level {

        background-blend-mode: hue;

        border-top-left-radius: 100%;
        border-top-right-radius: 100%;

        display: block;
        width: 100%;
        height: 0%;

        position: absolute;

        left: 0px;
        bottom: 0px;

        background-color: var(--c-bl);

        mix-blend-mode: difference;

    }
    .level.clipping {

        background-color: var(--c-r) !important;
    }

    #level-value {

        position: relative;
        z-index: 10;

        mix-blend-mode: unset;

        color: var(--c-y);
    }
`,
})
export class LevelMeterComponent implements AfterViewInit, OnDestroy {

    _output: Tone.ToneAudioNode
    @Input('output') 
    set output(o: Tone.ToneAudioNode) {

        if(o != this._output) {

            this._output = o

            this.connect()
        }
    }

    @Input('value') value: number = 0

    private connectedOuput: Tone.ToneAudioNode

    private scheduleID

    private meter: Tone.Meter = new Tone.Meter()

    private min = -70
    private max = 6
    public clipping = 0

    public percentage = 0

    private IID

    
    getValue = () => {

        this.value = this.meter.getValue() as number

        this.value = /*Math.round(*/this.value/* * 100) / 100*/

        this.value = Math.min(this.value, this.max)
        this.value = Math.max(this.value, this.min)

        this.percentage = Math.round(M.map(this.min, this.max, 0, 100, this.value))
    }

    connect = () => {

        if(this.output) this.output.connect(this.meter)
            this.connectedOuput = this.output
    }

    disconnect = () => {

        console.log(this.connectedOuput, this.meter)

        // if(connectedOuput) connectedOuput.disconnect(meter)
        // meter.disconnect()
    }

    ngAfterViewInit() {

        if(this.output != undefined) {

            this.connect()

            if(this.scheduleID != undefined) Tone.getTransport().clear(this.scheduleID)

                this.scheduleID = Tone.getTransport().scheduleRepeat((t) => {
                
                Tone.Draw.schedule(this.getValue, t)

            }, 1 / 24, Tone.getContext().currentTime, 100000000)
        }
    }

    ngOnDestroy() {

        if(this.output != undefined) {

            if(this.scheduleID != undefined) Tone.getTransport().clear(this.scheduleID)

                this.disconnect()

                this.meter.dispose()
        }
    }
}
