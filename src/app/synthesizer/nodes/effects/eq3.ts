import * as Tone from 'tone'

import { Effect } from './effect'
import { NodeName } from '../../synthesizer'
import { ParamType } from '../node'



/** Chorus node */
export class EQ3 extends Effect {


    get wet(): any {
        throw new Error('Method not implemented.')
    }
    set wet(w: any) {
        throw new Error('Method not implemented.')
    }

    public eq: Tone.EQ3
    
    _highFrequency: Tone.Unit.Frequency
    _high: Tone.Unit.Frequency
    _mid: Tone.Unit.Frequency
    _low: Tone.Unit.Frequency
    _lowFrequency: Tone.Unit.Frequency

    constructor() {

        super(NodeName.EQ3, null)

        this.eq = new Tone.EQ3()

        this.input = this.output = this.eq

        this._low = this.eq.get().low
        this._lowFrequency = this.eq.get().lowFrequency
        this._mid = this.eq.get().mid
        this._highFrequency = this.eq.get().highFrequency
        this._high = this.eq.get().high

        this.props.set('mid', { type: ParamType.CURVE_EDITOR, name: 'Mid', get: () =>  this.mid, set: (e) => this.mid = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('high', { type: ParamType.CURVE_EDITOR, name: 'High', get: () =>  this.high, set: (e) => this.high = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('low', { type: ParamType.CURVE_EDITOR, name: 'Low', get: () =>  this.low, set: (e) => this.low = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('lowFrequency', { type: ParamType.CURVE_EDITOR, name: 'LowFrequency', get: () =>  this.lowFrequency, set: (e) => this.lowFrequency = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('highFrequency', { type: ParamType.CURVE_EDITOR, name: 'highFrequency', get: () =>  this.highFrequency, set: (e) => this.highFrequency = e, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
    }

    get mid() { return this._mid }
    set mid(w: any) {

        this._mid = w

        this.eq.set({ mid: this._mid as number })
    }

    get low() { return this._low }
    set low(w: any) {

        this._low = w

        this.eq.set({ low: this._low as number})
    }

    get high() { return this._high }
    set high(w: any) {

        this._high = w

        this.eq.set({ high: this._high as number})
    }

    get highFrequency() { return this._highFrequency }
    set highFrequency(w: any) {

        this._highFrequency = w

        this.eq.set({ highFrequency: this._highFrequency as number})
    }

    get lowFrequency() { return this._lowFrequency }
    set lowFrequency(w: any) {

        this._lowFrequency = w

        this.eq.set({ lowFrequency: this._lowFrequency as number})
    }

    override serializeIn(o) {

        super.serializeIn(o)

        if(o.enabled != undefined) this.enabled = o.enabled

        if(o.mid != undefined) this.mid = o.mid
        if(o.low != undefined) this.low = o.low
        if(o.high != undefined) this.high = o.high
        if(o.highFrequency != undefined) this.highFrequency = o.highFrequency
        if(o.lowFrequency != undefined) this.lowFrequency = o.lowFrequency
    }

    override serializeOut() {

        let no = super.serializeOut()

        return {

            ...no,
            name: this.name,
            enabled: this.enabled,

            low: this.low,
            mid: this.mid,
            high: this.high,
            highFrequency: this.highFrequency,
            lowFrequency: this.lowFrequency,
        }
    }
}