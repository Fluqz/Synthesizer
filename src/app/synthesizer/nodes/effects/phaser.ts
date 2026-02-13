import * as Tone from 'tone'

import { Effect } from './effect'
import { ParamType } from '../node'



/** Chorus node */
export class Phaser extends Effect {

    public phaser: Tone.Phaser
    
    _frequency
    _baseFrequency
    _stages
    _octaves
    _Q

    constructor(wet) {

        super('Phaser', wet)

        this.phaser = new Tone.Phaser()

        this.input = this.output = this.phaser

        this.wet = wet != undefined ? wet : this.phaser.get().wet
        this.Q = this.phaser.get().Q
        this.octaves = this.phaser.get().octaves
        this.baseFrequency = this.phaser.get().baseFrequency
        this.frequency = this.phaser.get().frequency

        this.props.set('wet', { type: ParamType.KNOB, name: 'Wet', get: () =>  this.wet, set: (e) => this.wet = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('Q', { type: ParamType.KNOB, name: 'Q', get: () =>  this.Q, set: (e) => this.Q = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('octaves', { type: ParamType.KNOB, name: 'Octaves', get: () =>  this.octaves, set: (e) => this.octaves = e, min: 0, max: 12, step: 0.01, precision: 2, groupID: 0 })
        // this.props.set('stages', { type: ParamType.KNOB, name: 'Stages', get: () =>  this.stages, set: (e) => this.stages = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('baseFrequency', { type: ParamType.KNOB, name: 'Base Frequency', get: () =>  this.baseFrequency, set: (e) => this.baseFrequency = e, min: .1, max: 1000, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('frequency', { type: ParamType.KNOB, name: 'Frequency', get: () =>  this.frequency, set: (e) => this.frequency = e, min: .1, max: 1000, step: 0.01, precision: 2, groupID: 0 })
    }

    get wet() { return this._wet }
    set wet(w: any) {

        this._wet = w

        this.phaser.set({ wet: this._wet})
    }

    // get stages() { return this._stages }
    // set stages(w: any) {

    //     this._stages = w

    //     this.phaser.set({ stages: this._stages})
    // }

    get octaves() { return this._octaves }
    set octaves(w: any) {

        this._octaves = w

        this.phaser.set({ octaves: this._octaves})
    }

    get baseFrequency() { return this._baseFrequency }
    set baseFrequency(w: any) {

        this._baseFrequency = w

        this.phaser.set({ baseFrequency: this._baseFrequency})
    }

    get frequency() { return this._frequency }
    set frequency(w: any) {

        this._frequency = w

        this.phaser.set({ frequency: this._frequency})
    }

    get Q() { return this._Q }
    set Q(w: any) {

        this._Q = w

        this.phaser.set({ Q: this._Q})
    }


    override serializeIn(o) {

        super.serializeIn(o)

        if(o.enabled != undefined) this.enabled = o.enabled

        if(o.wet != undefined) this.wet = o.wet
        if(o.octaves != undefined) this.octaves = o.octaves
        if(o.baseFrequency != undefined) this.baseFrequency = o.baseFrequency
        if(o.frequency != undefined) this.frequency = o.frequency
        if(o.Q != undefined) this.Q = o.Q
        // @ts-ignore
        if(o.stages != undefined) this.stages = o.stages
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,

            name: this.name,
            enabled: this.enabled,

            wet: this.wet,
            octaves: this.octaves,
            baseFrequency: this.baseFrequency,
            frequency: this.frequency,
            Q: this.Q,
            // stages: this.stages,
        }
    }
}