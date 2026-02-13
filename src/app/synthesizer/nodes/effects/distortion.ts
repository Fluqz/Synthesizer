import * as Tone from 'tone'

import { Effect } from './effect';
import { ParamType } from '../node';


export class Distortion extends Effect {
   
    /** Amound of distortion */
    private _gain: number

    public distortion: Tone.Distortion

    constructor(wet, gain) {

        super('Distortion', wet)

        this.distortion = new Tone.Distortion(this.gain)

        this.output = this.input = this.distortion

        this.wet = wet != undefined ? wet : this.distortion.get().wet
        this.gain = gain != undefined ? gain : this.distortion.get().distortion

        this.props.set('wet', { type: ParamType.KNOB, name: 'Wet', get: () =>  this.wet, set: (v) => this.wet = v, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('gain', { type: ParamType.KNOB, name: 'Gain', get: () =>  this.gain, set: (v) => this.gain = v, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
    }

    get wet() { return this._wet }
    set wet(w: any) {

        this._wet = w
        this.distortion.set({ wet: this._wet })
    }
    
    get gain() { return this._gain }
    set gain(g) {

        this._gain = g

        this.distortion.distortion = this._gain
    }

    override serializeIn(o) {

        super.serializeIn(o)

        if(o.name != undefined) this.name = o.name
        if(o.enabled != undefined) this.enabled = o.enabled
        if(o.wet != undefined) this.wet = o.wet
        if(o.gain != undefined) this.gain = o.gain
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,

            name: this.name,
            enabled: this.enabled,
            wet: this.wet,
            gain: this.gain
        }
    }
}