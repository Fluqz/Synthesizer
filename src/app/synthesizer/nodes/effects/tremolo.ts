import * as Tone from 'tone'

import { Effect } from "./effect"
import { ParamType } from '../node'



/** Tremolo node */
export class Tremolo extends Effect {

    tremolo: Tone.Tremolo

    /** Tremolo amplitude */
    private _frequency 
    /** Trempolo depth */
    private _depth


    constructor(wet, frequency, depth) {

        super('Tremolo', wet)

        this.tremolo = new Tone.Tremolo(this.frequency, this.depth)

        this.input = this.output = this.tremolo

        this.wet = wet != undefined ? wet : this.tremolo.get().wet
        this.frequency = frequency != undefined ? frequency : this.tremolo.get().frequency
        this.depth = depth != undefined ? depth : this.tremolo.get().depth

        this.props.set('wet', { type: ParamType.KNOB, name: 'Wet', get: () =>  this.wet, set: (v) => this.wet = v, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('frequency', { type: ParamType.KNOB, name: 'Frequency', get: () =>  this.frequency, set: (v) => this._frequency = v, min: 0, max: 1000, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('depth', { type: ParamType.KNOB, name: 'Depth', get: () =>  this.depth, set: (v) => this.depth = v, min: 0, max: 10, step: 0.01, precision: 2, groupID: 0 })
    }

    get wet() { return this._wet }
    set wet(w: any) {

        this._wet = w
        this.tremolo.set({ wet: this._wet })
    }

    get frequency() { return this._frequency }
    set frequency(f) {

        this._frequency = f

        this.tremolo.frequency.set(this._frequency)
    }

    get depth() { return this._depth }
    set depth(d) {

        this._depth = d

        this.tremolo.depth.set(this._depth)
    }
    
    override serializeIn(o) {

        super.serializeIn(o)

        if(o.name != undefined) this.name = o.name
        if(o.enabled != undefined) this.enabled = o.enabled
        if(o.wet != undefined) this.wet = o.wet
        if(o.frequency != undefined) this.frequency = o.frequency
        if(o.depth != undefined) this.depth = o.depth
    }

    override serializeOut() {

        let no = super.serializeOut()
        
        return {

            ...no,
            name: this.name,
            enabled: this.enabled,
            wet: this.wet,
            frequency: this.frequency,
            depth: this.depth
        }
    }
 }