import * as Tone from 'tone'
import { Subject } from 'rxjs'
import { G } from '../../core/globals'
import { Node } from '../node'
import type { InstrumentOptions } from 'tone/build/esm/instrument/Instrument'
import type { Instrument as ToneInstrument } from 'tone/build/esm/instrument/Instrument'

/** Represents a instrument  */
export abstract class Instrument extends Node {

    constructor(name) {

        super(name)
    }
    
    /** Trigger Note */
    abstract triggerNote(note: Tone.Unit.Frequency, time: Tone.Unit.Time, velocity:number) 
    // { // if(G.debug) console.log(`Instrument - Trigger | note: ${note} time: ${time}`) }

    /** Trigger and Release Note */
    abstract triggerReleaseNote(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity:number)
    // {// if(G.debug) console.log(`Instrument - Trigger and Release | note: ${note} time: ${time}`) }

    /** Release Note */
    abstract releaseNote(note: Tone.Unit.Frequency, time: Tone.Unit.Time)
    // { // if(G.debug) console.log(`Instrument - Release | note: ${note} time: ${time}`) }
}
