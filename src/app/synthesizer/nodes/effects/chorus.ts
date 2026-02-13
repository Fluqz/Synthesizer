import * as Tone from 'tone'

import { Effect } from './effect'
import { ParamType } from '../node'



/** Chorus node */
export class Chorus extends Effect {

    public chorus: Tone.Chorus
    
    /** Frequency of the LFO for modulating */
    _frequency
    /** Delay of the signal 2-20ms */
    _delayTime 
    /** Chorus depth */
    _depth
    /** Amount of input */
    _feedback
    _wave
    _wavePartial
    _spread

    constructor(wet, frequency, delayTime, depth, feedback) {

        super('Chorus', wet)

        this.chorus = new Tone.Chorus(this.frequency, this.delayTime, this.depth)

        this.input = this.output = this.chorus

        this.wet = this.chorus.get().wet
        this.frequency = this.chorus.get().frequency
        this.delayTime = this.chorus.get().delayTime
        this.depth = this.chorus.get().depth
        this.feedback = this.chorus.get().feedback
        this.spread = this.chorus.get().spread
        this._wave = 'sine'
        this._wavePartial = ''

        this.props.set('delayTime', { type: ParamType.KNOB, name: 'Delay Time', get: () =>  this.delayTime, set: (e) => this.delayTime = e, min: 2, max: 20, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('depth', { type: ParamType.KNOB, name: 'Depth', get: () =>  this.depth, set: (e) => this.depth = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('feedback', { type: ParamType.KNOB, name: 'Feedback', get: () =>  this.feedback, set: (e) => this.feedback = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('frequency', { type: ParamType.KNOB, name: 'frequency', get: () =>  this.frequency, set: (e) => this.frequency = e, min: .1, max: 1000, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('spread', { type: ParamType.KNOB, name: 'spread', get: () =>  this.spread, set: (e) => this.spread = e, min: 0, max: 180, step: 0.01, precision: 2, groupID: 0 })

        this.props.set('wave', { type: ParamType.DROPDOWN, name: 'Wave', get: () => this.wave, set: (v:string) => this.wave = v, options: [ 'sine', 'square', 'sawtooth', 'triangle', 'pulse', ], groupID: 1 })
        this.props.set('wavePartial', { type: ParamType.DROPDOWN, name: 'Wave Partial', get: () => this.wavePartial, set: (v:string) => this.wavePartial = v, options: ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], groupID: 1 })
    }

    get wet() { return this._wet }
    set wet(w: any) {

        this._wet = w
        this.chorus.set({ wet: this._wet })
    }

    get frequency() { return this._frequency }
    set frequency(t) {

        this._frequency = t

        this.chorus.frequency.setValueAtTime(this._frequency, Tone.getContext().currentTime)
    }

    get delayTime() { return this._delayTime }
    set delayTime(t) {

        this._delayTime = t

        this.chorus.set({ delayTime: this._delayTime })
    }

    get depth() { return this._depth }
    set depth(d) {

        this._depth = d

        this.chorus.set({ depth: this._depth })
    }

    get feedback() { return this._feedback }
    set feedback(f) {

        this._feedback = f

        this.chorus.set({ feedback: this._feedback })
    }

    get spread() { return this._spread }
    set spread(t) {

        this._spread = t

        this.chorus.set({ spread: this._spread })
    }

    get wave() { return this._wave }
    set wave(w) {

        this._wave = w
        this.chorus.set({ type: (this._wave + this.wavePartial)})
    }

    get wavePartial() { return this._wavePartial }
    set wavePartial(w) {

        this._wavePartial = w
        this.chorus.set({ type: (this._wave + this.wavePartial)})
    }


    override serializeIn(o) {

        let no = super.serializeOut()
        super.serializeIn(o)

        if(o.enabled != undefined) this.enabled = o.enabled
        if(o.wet != undefined) this.wet = o.wet
        if(o.delayTime != undefined) this.delayTime = o.delayTime
        if(o.depth != undefined) this.depth = o.depth
        if(o.feedback != undefined) this.feedback = o.feedback
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,
            name: this.name,
            enabled: this.enabled,
            wet: this.wet,
            delayTime: this.delayTime,
            depth: this.depth,
            feedback: this.feedback
        }
    }
}