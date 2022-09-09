import * as Tone from 'tone'
import { Knob } from '../../view/knob';

import { Node } from "../node";



/** Delay node */
export class Delay extends Node {

    /** Intensity */
    wet
    /** How fast the delay is played in seconds */
    time 
    /** How long the delay is played. [0-1] */
    feedback

    constructor(wet, time, feedback) {

        super('delay')

        this.wet = wet ? wet : 1
        this.time = time ? time : 3
        this.feedback = feedback ? feedback : .5

        this.instance = new Tone.FeedbackDelay(this.time, this.feedback)
        
        this.setWet(this.wet)
        let wetKnob = new Knob(this.wet, 0, 1)
        this.dom.appendChild(wetKnob.dom)
        wetKnob.onChange.subscribe(v => this.setWet(v))

        let timeKnob = new Knob(this.time, 0, 20)
        this.dom.appendChild(timeKnob.dom)
        timeKnob.onChange.subscribe(v => this.setTime(v))

        let feedbackKnob = new Knob(this.feedback, 0, 1)
        this.dom.appendChild(feedbackKnob.dom)
        feedbackKnob.onChange.subscribe(v => this.setFeedback(v))
    }

    setWet(w) {

        this.wet = w

        this.instance.wet.value = this.wet
    }

    setTime(t) {

        this.time = t

        this.instance.delayTime.value = this.time
    }

    setFeedback(f) {

        this.feedback = f

        this.instance.feedback.value = this.feedback
    }


    serializeIn(o) {

        if(o['enabled']) this.enabled = o['enabled']
        if(o['wet']) this.setWet(o['wet'])
        if(o['time']) this.setTime(o['time'])
        if(o['feedback']) this.setFeedback(o['feedback'])
    }

    serializeOut() {

        return {

            name: this.name,
            enabled: this.enabled,
            wet: this.wet,
            time: this.time,
            feedback: this.feedback
        }
    }
}