import * as Tone from 'tone'

import { Effect } from './effect'
import { NodeName } from '../../synthesizer'
import { ParamType } from '../node'



/** Chorus node */
export class Reverb extends Effect {

    public reverb: Tone.Reverb
    
    _frequency
    _decay
    _preDelay
    _wave
    _wavePartial
    _baseFrequency

    constructor(wet) {

        super(NodeName.Reverb, wet)

        this.reverb = new Tone.Reverb()

        this.input = this.output = this.reverb

        this.wet = this.reverb.get().wet
        this.decay = this.reverb.get().decay
        this.preDelay = this.reverb.get().preDelay

        this.props.set('wet', { type: ParamType.KNOB, name: 'Wet', get: () =>  this.wet, set: (e) => this.wet = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('decay', { type: ParamType.KNOB, name: 'Decay', get: () =>  this.decay, set: (e) => this.decay = e, min: 0.001, max: 3, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('preDelay', { type: ParamType.KNOB, name: 'Pre Delay', get: () =>  this.preDelay, set: (e) => this.preDelay = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
    }

    get wet() { return this._wet }
    set wet(w: any) {

        this._wet = w

        this.reverb.set({ wet: this._wet})
    }

    get decay() { return this._decay }
    set decay(w: any) {

        this._decay = w

        this.reverb.set({ decay: this._decay})
    }

    get preDelay() { return this._preDelay }
    set preDelay(w: any) {

        this._preDelay = w

        this.reverb.set({ preDelay: this._preDelay})
    }


    override serializeIn(o) {

        super.serializeIn(o)

        if(o.enabled != undefined) this.enabled = o.enabled

        if(o.wet != undefined) this.wet = o.wet
        if(o.decay != undefined) this.decay = o.decay
        if(o.preDelay != undefined) this.preDelay = o.preDelay
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,
            name: this.name,
            enabled: this.enabled,

            wet: this.wet,
            decay: this.decay,
            preDelay: this.preDelay,
        }
    }
}