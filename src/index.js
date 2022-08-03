
import './style.css'

import * as Tone from 'tone'
import { Keyboard } from './app/keyboard'
import { Knob } from './app/knob'
import { Storage } from './app/storage'

// Create Keyboard
const dom = document.querySelector('#keyboard')

const keyboard = new Keyboard(dom)

// Set octave buttons events
const octaveDown = document.querySelector('#octave-down')
const octaveUp = document.querySelector('#octave-up')

octaveDown.addEventListener('click', () => {

    console.log('Octave down')
    keyboard.setOctave(keyboard.octave - 1)
})

octaveUp.addEventListener('click', () => {

    console.log('Octave up')
    keyboard.setOctave(keyboard.octave + 1)
})

// Set arp button event
const arp = document.querySelector('#arp input')

arp.addEventListener('click', (e) => {

    console.log('ARP', e.target.checked)

    Keyboard.arp = e.target.checked
})

// Container of effects
const effects = document.querySelector('#effects')
// Effect select element
const effectSelect = document.querySelector('#effect-select')

effectSelect.addEventListener('change', (e) => {

    console.log('select', e)

    let ef = Keyboard.getEffect(e.target.value)
    keyboard.addEffect(ef)

    effects.appendChild(ef.dom)
})






let knob = new Knob()

document.body.append(knob.dom)



const record = document.querySelector('#record')

record.addEventListener('mousedown', (e) => {

    keyboard.toggleRecording()
})

const reset = document.querySelector('#reset')

reset.addEventListener('mousedown', (e) => {

    keyboard.reset()
})




// Serialize

const serializeIn = file => {

    if(!file) return

    let o = JSON.parse(file)

    console.log('SERIALIZE IN', o)

    keyboard.serializeIn(o)

    // TODO THIS IS NOT RIGHT
    for(let ef of keyboard.effectChain) effects.appendChild(ef.dom)

}

const serializeOut = () => {

    let o = keyboard.serializeOut()

    console.log('SERIALIZE OUT', o)

    return JSON.stringify(o)
}


document.addEventListener('DOMContentLoaded', (e) => {

    console.log('STORAGE', Storage.load())

    serializeIn(Storage.load())

})



// Unload

window.onbeforeunload = () => {

    Storage.save(serializeOut())

    keyboard.dispose()
}