import * as Tone from 'tone'

import { Effect } from "./effect"
import { ParamType, Node } from '../node'
import type { ToneWithContextOptions } from 'tone/build/esm/core/context/ToneWithContext'



/** Delay node */
export class Delay extends Effect {

    feedbackDelay: Tone.FeedbackDelay

    /** How fast the delay is played in seconds */
    _delayTime 
    /** How long the delay is played. [0-1] */
    _feedback

    constructor(wet, delayTime, feedback) {

        super('Delay', wet)

        this.feedbackDelay = new Tone.FeedbackDelay(this.delayTime, this.feedback)

        this.input = this.feedbackDelay
        this.output = this.feedbackDelay

        this.directBypass = true

        this.wet = this.feedbackDelay.get().wet
        this.delayTime = delayTime ? delayTime : 1.12
        this.feedback = feedback ? feedback : .8
        
        this.props.set('wet', { type: ParamType.KNOB, name: 'Wet', get: () =>  this.wet, set: (w) => { this.wet = w}, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('delayTime', { type: ParamType.KNOB, name: 'Delay Time', get: () =>  this.delayTime, set: (d) => { this.delayTime = d}, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
        this.props.set('feedback', { type: ParamType.KNOB, name: 'Feedback', get: () =>  this.feedback, set: (f) => { this.feedback = f}, min: 0, max: 1, step: 0.01, precision: 2, groupID: 0 })
    }

    get wet() { return this._wet }
    set wet(w: number) {

        this._wet = w
        this.feedbackDelay.wet.setValueAtTime(this._wet, Tone.getContext().currentTime)
    }

    get delayTime() { return this._delayTime }
    set delayTime(t) {

        this._delayTime = t

        this.feedbackDelay.delayTime.linearRampToValueAtTime(this._delayTime, Tone.getContext().currentTime)
    }

    get feedback() { return this._feedback }
    set feedback(f) {

        this._feedback = f

        this.feedbackDelay.feedback.setValueAtTime(this._feedback, Tone.getContext().currentTime)
    }



    // chain(nodes: Node[] | Tone.ToneAudioNode[]) {

    //     if(!nodes.length || nodes.length == 0) return // this.connect(nodes)

    //     // this.connect(nodes[0])

    //     let n1: Tone.ToneAudioNode
    //     let n2: Tone.ToneAudioNode

    //     for(let i = 0; i < nodes.length - 1; i++) {

    //         n1 = (nodes[i] instanceof Node ? nodes[i].output : nodes[i]) as Tone.ToneAudioNode
    //         n2 = (nodes[i + 1] instanceof Node ? nodes[i + 1].output : nodes[i + 1]) as Tone.ToneAudioNode

    //         n1.connect(n2)
    //     }
    // }

    

    override serializeIn(o) {

        super.serializeIn(o)

        if(o.name != undefined) this.name = o.name
        if(o.enabled != undefined) this.enabled = o.enabled
        if(o.wet != undefined) this.wet = o.wet
        if(o.delayTime != undefined) this.delayTime = o.delayTime
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
            feedback: this.feedback,
        }
    }
}