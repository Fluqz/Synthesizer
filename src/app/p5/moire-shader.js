import { Keyboard } from "../keyboard"
import { G } from "../core/globals"
import { Grid } from "../core/grid"
import { M } from "../core/math"

import * as Tone from 'tone'

export const moireShader = (p5) => {

    let shader

    let grid
    let oldCellPos
    let currentCellPos = { x: 200, y: 200 }
    let newCellPos = { x: 0, y: 0 }
    let increment = 40
    let isAnimating = false
    let IVID

    p5.preload = () => {
        shader = p5.loadShader('./shader/moire-vert.glsl', './shader/moire-frag.glsl');
    }

    p5.setup = () => {

        p5.createCanvas(G.w, G.h, p5.WEBGL)

        p5.canvas.style.position = 'absolute'
        p5.canvas.style.top = '0px'
        p5.canvas.style.left = '0px'
        p5.canvas.style.zIndex = '-5'


        grid = new Grid(G.w, G.h, 9, 4) // 9 * 4 = 36 (keys)

        oldCellPos = grid.getCellPosByNr(Keyboard.keyMap.indexOf(Math.round(Keyboard.keyMap.length / 2)))
    }

    const getDirectionVector = (() => {

        let v = {}
        
        return (v1, v2) => {

            v.x = v2.x - v1.x
            v.y = v2.y - v1.y

            return v
        }
    })()

    const getNormalizedVector = (() => {

        let n = {}
        
        return (v) => {

            if(v.x == 0 && v.y == 0) return v

            // u = (x/(x^2 + y^2)^(1/2), y/(x^2 + y^2)^(1/2))
            n.x = v.x / Math.pow((Math.pow(v.x, 2) + Math.pow(v.y, 2)), (1/2))
            n.y = v.y / Math.pow((Math.pow(v.x, 2) + Math.pow(v.y, 2)), (1/2))
            return n
        }
    })()

    const getDistanceVector = ((v) => {

        let d

        return (v1, v2) => {

            return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2))
        }
    })()


    p5.draw = () => {

        // p5.clear()

        p5.shader(shader)

        shader.setUniform("u_resolution", [G.w, G.h])
        shader.setUniform("u_time", p5.millis() / 1000.0)
        shader.setUniform("u_color1", M.map(-1, 1, 0.5, 1, Math.sin(Tone.context.currentTime)))
        shader.setUniform("u_color2", M.map(-1, 1, 0, 1, Math.sin(Tone.context.currentTime+2)))
        shader.setUniform("u_color3", M.map(-1, 1, 0, 1, Math.cos(Tone.context.currentTime+5)))
        shader.setUniform("u_activeNotes", M.map(0, 8, 0, 1, Keyboard.activeNotes.length))
        // console.log(M.map(-1, 1, 0.99, 1, Math.sin(Tone.context.currentTime)))


        if(true) {

            // Get newCellPos
            for(let k of Keyboard.keys) {

                if(k.note + k.octave == Keyboard.activeNotes[Keyboard.activeNotes.length-1]) {

                    oldCellPos.x = newCellPos.x
                    oldCellPos.y = newCellPos.y

                    newCellPos = grid.getCellPosByNr(Keyboard.keyMap.indexOf(k.mapping))
                    break
                }
            }

            if(!newCellPos) newCellPos = { x: G.w / 2, y: G.h / 2 }


            // Did cellpos change?
            if((oldCellPos.x !== newCellPos.x || oldCellPos.y !== newCellPos.y)) {

                if(isAnimating) {

                }
                currentCellPos.x = oldCellPos.x
                currentCellPos.y = oldCellPos.y


                let tmpCellPos = {}

                let normal

                let time = (Math.random() * 500) + 100
                let interval = 10

                increment = getDistanceVector(oldCellPos, newCellPos) / (time / interval)

                // console.log('Clear')

                // console.log('old', oldCellPos)
                // console.log('new', newCellPos)

                isAnimating = true

                window.clearInterval(IVID)

                IVID = window.setInterval(() => {

                    // console.log('ANIMATE')

                    tmpCellPos.x = currentCellPos.x
                    tmpCellPos.y = currentCellPos.y
                    
                    normal = getDirectionVector(currentCellPos, newCellPos)
                    normal = getNormalizedVector(normal)
                    // console.log('normal', normal)
        
                    tmpCellPos.x += normal.x * increment
                    tmpCellPos.y += normal.y * increment

                    // console.log('d', getDirectionVector(currentCellPos, tmpCellPos))

                    // console.log('check', oldCellPos, tmpCellPos, newCellPos, )
                    // console.log('diff', getDistanceVector(currentCellPos, newCellPos), getDistanceVector(tmpCellPos, newCellPos))

                    if(getDistanceVector(currentCellPos, newCellPos) >= getDistanceVector(tmpCellPos, newCellPos)) {

                        // console.log('curr', currentCellPos)
                        currentCellPos.x = tmpCellPos.x
                        currentCellPos.y = tmpCellPos.y
                    }
                    else {
                        // console.log('Clear2')
                        window.clearInterval(IVID)
                        isAnimating = false
                        oldCellPos.x = newCellPos.x
                        oldCellPos.y = newCellPos.y
                        currentCellPos.x = newCellPos.x
                        currentCellPos.y = newCellPos.y
                    }

                    shader.setUniform("u_mouse", [
                        M.map(0, G.w, -G.w / 2, G.w, currentCellPos.x), 
                        M.map(0, G.h, -G.h / 2, G.h, currentCellPos.y)
                    ])

                }, interval)
            }

        }
        else if(!isAnimating) { // No and no animation right now

            // shader.setUniform("u_mouse", [newCellPos.x, newCellPos.y])
        }

        // shader.setUniform("u_mouse", [p5.mouseX, p5.map(p5.mouseY, 0, G.h, G.h, 0)])


        p5.rect(0, 0, G.w, G.h)
    }

    p5.windowResized = () => { // TODO - aNOT WORKING

        p5.resizeCanvas(G.w, G.h)
        grid.setSize(G.w, G.h, 9, 4)
    }
}