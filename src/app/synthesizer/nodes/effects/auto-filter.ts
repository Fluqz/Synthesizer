import * as Tone from 'tone'

import { Effect } from './effect'
import { NodeName } from '../../synthesizer'
import { ParamType } from '../node'



/** Chorus node */
export class AutoFilter extends Effect {

    public autoFilter: Tone.AutoFilter
    
    _frequency
    _depth
    _octaves
    _wave
    _wavePartial
    _baseFrequency

    constructor(wet) {

        super(NodeName.AutoFilter, wet)

        this.autoFilter = new Tone.AutoFilter()
        this.autoFilter.start()

        this.input = this.output = this.autoFilter

        this.wet = this.autoFilter.get().wet
        this._frequency = this.autoFilter.get().frequency
        this._baseFrequency = this.autoFilter.get().baseFrequency
        this._depth = this.autoFilter.get().depth
        this._octaves = this.autoFilter.get().octaves
        this._wave = 'sine'
        this._wavePartial = ''

        this.props.set('wet', { type: ParamType.KNOB, name: 'Wet', get: () =>  this.wet, set: (e) => this.wet = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('depth', { type: ParamType.KNOB, name: 'Depth', get: () =>  this.depth, set: (e) => this.depth = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('octaves', { type: ParamType.KNOB, name: 'Octaves', get: () =>  this.octaves, set: (e) => this.octaves = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })

        this.props.set('wave', { type: ParamType.DROPDOWN, name: 'Wave', get: () => this.wave, set: (v:string) => this.wave = v, options: [ 'sine', 'square', 'sawtooth', 'triangle', 'pulse', ], groupID: 1 })
        this.props.set('wavePartial', { type: ParamType.DROPDOWN, name: 'Wave Partial', get: () => this.wavePartial, set: (v:string) => this.wavePartial = v, options: ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], groupID: 1 })

        this.props.set('baseFrequency', { type: ParamType.KNOB, name: 'Base Frequency', get: () =>  this.baseFrequency, set: (e) => this.baseFrequency = e, min: 0, max: 1000, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('frequency', { type: ParamType.KNOB, name: 'Frequency', get: () =>  this.frequency, set: (e) => this.frequency = e, min: 0, max: 1000, step: 0.01, precision: 2, groupID: 0 })

    }

    get wet() { return this._wet }
    set wet(w: any) {

        this._wet = w

        this.autoFilter.set({ wet: this._wet})
    }

    get depth() { return this._depth }
    set depth(w: any) {

        this._depth = w

        this.autoFilter.set({ depth: this._depth})
    }

    get octaves() { return this._octaves }
    set octaves(w: any) {

        this._octaves = w

        this.autoFilter.set({ octaves: this._octaves})
    }

    get baseFrequency() { return this._baseFrequency }
    set baseFrequency(w: any) {

        this._baseFrequency = w

        this.autoFilter.set({ baseFrequency: this._baseFrequency})
    }

    get frequency() { return this._frequency }
    set frequency(w: any) {

        this._frequency = w

        this.autoFilter.set({ frequency: this._frequency})
    }

    get wave() { return this._wave }
    set wave(w) {

        this._wave = w
        this.autoFilter.set({ type: (this._wave + this.wavePartial)})
    }

    get wavePartial() { return this._wavePartial }
    set wavePartial(w) {

        this._wavePartial = w
        this.autoFilter.set({ type: (this._wave + this.wavePartial)})
    }

    override serializeIn(o) {

        super.serializeIn(o)

        if(o.enabled != undefined) this.enabled = o.enabled

        if(o.wet != undefined) this.wet = o.wet
        if(o.depth != undefined) this.depth = o.depth
        if(o.octaves != undefined) this.octaves = o.octaves
        if(o.wave != undefined) this.wave = o.wave
        if(o.wavePartial != undefined) this.wavePartial = o.wavePartial
        if(o.baseFrequency != undefined) this.baseFrequency = o.baseFrequency
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
            octaves: this.octaves,
            wave: this.wave,
            wavePartial: this.wavePartial,
            baseFrequency: this.baseFrequency,
            frequency: this.frequency,
        }
    }
}