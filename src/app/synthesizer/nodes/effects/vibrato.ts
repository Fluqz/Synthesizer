import * as Tone from 'tone'

import { Effect } from './effect'
import { NodeName } from '../../synthesizer'
import { ParamType } from '../node'



/** Chorus node */
export class Vibrato extends Effect {

    public vibrato: Tone.Vibrato
    
    _frequency
    _depth
    _maxDelay
    _wave
    _wavePartial
    

    constructor(wet) {

        super(NodeName.Vibrato, wet)

        this.vibrato = new Tone.Vibrato()

        this.input = this.output = this.vibrato


        this.wet = wet != undefined ? wet : this.vibrato.get().wet
        this.frequency = this.vibrato.get().frequency
        this.depth = this.vibrato.get().depth
        this.maxDelay = this.vibrato.get().maxDelay

        this._wave = 'sine'
        this._wavePartial = ''

        
        this.props.set('wet', { type: ParamType.KNOB, name: 'Wet', get: () =>  this.wet, set: (e) => this.wet = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('frequency', { type: ParamType.KNOB, name: 'Frequency', get: () =>  this.frequency, set: (e) => this.frequency = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('depth', { type: ParamType.KNOB, name: 'Depth', get: () =>  this.depth, set: (e) => this.depth = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('maxDelay', { type: ParamType.KNOB, name: 'Max Delay', get: () =>  this.maxDelay, set: (e) => this.maxDelay = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })

        this.props.set('wave', { type: ParamType.DROPDOWN, name: 'Wave', get: () => this.wave, set: (v:string) => this.wave = v, options: [ 'sine', 'square', 'sawtooth', 'triangle', 'pulse', ], groupID: 1 })
        this.props.set('wavePartial', { type: ParamType.DROPDOWN, name: 'Wave Partial', get: () => this.wavePartial, set: (v:string) => this.wavePartial = v, options: ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], groupID: 1 })
    }

    get wet() { return this._wet }
    set wet(w: any) {

        this._wet = w

        this.vibrato.set({ wet: this._wet})
    }

    get depth() { return this._depth }
    set depth(w: any) {

        this._depth = w

        this.vibrato.set({ depth: this._depth})
    }

    get maxDelay() { return this._maxDelay }
    set maxDelay(w: any) {

        this._maxDelay = w

        this.vibrato.set({ maxDelay: this._maxDelay})
    }

    get frequency() { return this._frequency }
    set frequency(w: any) {

        this._frequency = w

        this.vibrato.set({ frequency: this._frequency})
    }

    get wave() { return this._wave }
    set wave(w) {

        this._wave = w
        this.vibrato.set({ type: (this._wave + this.wavePartial)})
    }

    get wavePartial() { return this._wavePartial }
    set wavePartial(w) {

        this._wavePartial = w
        this.vibrato.set({ type: (this._wave + this.wavePartial)})
    }


    override serializeIn(o) {

        super.serializeIn(o)
        
        if(o.enabled != undefined) this.enabled = o.enabled

        if(o.wet != undefined) this.wet = o.wet
        if(o.depth != undefined) this.depth = o.depth
        if(o.maxDelay != undefined) this.maxDelay = o.maxDelay
        if(o.wave != undefined) this.wave = o.wave
        if(o.wavePartial != undefined) this.wavePartial = o.wavePartial
        if(o.frequency != undefined) this.frequency = o.frequency
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,
            name: this.name,
            enabled: this.enabled,

            wet: this.wet,
            depth: this.depth,
            maxDelay: this.maxDelay,
            wave: this.wave,
            wavePartial: this.wavePartial,
            frequency: this.frequency,
        }
    }
}