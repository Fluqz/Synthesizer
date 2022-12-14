



import * as Tone from 'tone'

import { Node } from "../node"
import { Knob } from '../../view/knob';



/** Effect node */
export class Effect extends Node {

    /** Bypass ratio. 1 = wet, 0 = dry. */
    wet

    constructor(name, wet) {

        super(name)

        this.wet = wet
    }

    set enabled(e) { 

        this._enabled = e 
        
        this.setWet(e ? this.wet : 0)
    }
    get enabled() { return this._enabled }

    setWet(w) {

        this.wet = w

        if(this.instance) this.instance.wet.setValueAtTime(this.wet, Tone.context.currentTime)
    }

    serializeIn(o) {

        if(o['name']) this.name = o['name']
        if(o['enabled']) this.enabled = o['enabled']
        if(o['wet']) this.setWet(o['wet'])
    }

    serializeOut() {

        return {

            name: this.name,
            enabled: this.enabled,
            wet: this.wet,
        }
    }
 }