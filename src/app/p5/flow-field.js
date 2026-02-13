import { Synthesizer } from "./../synthesizer/synthesizer"
import { G } from "../globals";
import { Grid } from "../util/grid";
import { M } from "../util/math/math";
import { Visual } from "./visual";

import * as Tone from "tone";

export const flowFieldOptions = {
  /** Modulation factor */
  modulator: 5,
  modulatorColor: { r: 200, g: 150, b: 100 },
};

/** Try to implement this with shaders */

export const flowField = (p5) => {
  let inc = 0.1;
  let incStart = 0.005;
  let magInc = 0.0005;
  let start = 0;
  let scl = 10;
  let cols, rows;
  let zoff = 0;
  let particles = [];
  let numParticles = 15000;
  let flowfield;
  let flowcolorfield;
  let magOff = 0;
  let showField = false;

  let cFactor = 255;

  let clear = false;

  p5.setup = () => {
    p5.createCanvas(G.w, G.h);
    p5.pixelDensity(1);
    p5.background(0);
    p5.frameRate(10);
    p5.stroke(255);
    p5.strokeWeight(1);

    p5.canvas.style.position = "absolute";
    p5.canvas.style.top = "0px";
    p5.canvas.style.left = "0px";
    p5.canvas.style.zIndex = "-5";

    cols = p5.floor(p5.width / scl);
    rows = p5.floor(p5.height / scl);

    for (let i = 0; i < numParticles; i++) {
      particles[i] = new Particle();
    }

    flowfield = new Array(rows * cols);
    flowcolorfield = new Array(rows * cols);

    // Tone.getTransport().scheduleRepeat(() => {

    //   console.log('soo')
    //   p5.background(p5.color(0, 0, 0, 5));

    // }, '1m')
  };

  function Particle() {
    this.pos = p5.createVector(p5.random(p5.width), p5.random(p5.height));
    this.vel = p5.createVector(0, 0);
    this.acc = p5.createVector(0, 0);
    this.maxSpeed = Tone.getTransport().bpm.value / 100;

    this.prevPos = this.pos.copy();

    this.update = function () {
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.pos.add(this.vel);
      this.acc.mult(0);
    };

    this.applyForce = function (force) {
      if (force == null) return;
      force.x *= 1;
      force.y *= 1;
      this.acc.add(force);
    };

    this.show = function (colorfield) {
      // p5.strokeWeight(100);
      p5.line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
      this.updatePrev();
      //point(this.pos.x, this.pos.y);
    };

    this.inverseConstrain = function (pos, key, f, t) {
      if (pos[key] < f) {
        pos[key] = t;
        this.updatePrev();
      }
      if (pos[key] > t) {
        pos[key] = f;
        this.updatePrev();
      }
    };

    this.updatePrev = function () {
      this.prevPos.x = this.pos.x;
      this.prevPos.y = this.pos.y;
    };

    this.edges = function () {
      this.inverseConstrain(this.pos, "x", 0, p5.width);
      this.inverseConstrain(this.pos, "y", 0, p5.height);
    };

    this.follow = function (vectors, colorfield) {
      let x = p5.floor(this.pos.x / scl);
      let y = p5.floor(this.pos.y / scl);
      let index = x + y * cols;
      let force = vectors[index];
      this.applyForce(force);
      let c = colorfield[index];

      if (c) {

        // Patterns
        if (index % flowFieldOptions.modulator == 0) {

          p5.stroke(
            p5.color(
              flowFieldOptions.modulatorColor.r,
              flowFieldOptions.modulatorColor.g,
              flowFieldOptions.modulatorColor.b
            )
          ) 

          // p5.stroke(p5.color(0, 0, 0));
        }
        // p5.stroke(p5.color(c[0], c[1], c[2]))
        else if (x % flowFieldOptions.modulator != 0 && y % flowFieldOptions.modulator != 0) {

          // p5.stroke(p5.color(0, 0, 0));

          p5.stroke(p5.color(c[0], c[1], c[2]));
        }
        // else if((x + y) % flowFieldOptions.modulator == 0)
        //   p5.stroke(p5.color(255))
        else {
         
          // p5.stroke(p5.color(c[0], c[1], c[2]));


          p5.stroke(p5.color(0, 0, 0));

          // p5.stroke(
          //   p5.color(
          //     flowFieldOptions.modulatorColor.r,
          //     flowFieldOptions.modulatorColor.g,
          //     flowFieldOptions.modulatorColor.b
          //   )
          // ) 
        }
        // else p5.stroke(p5.color(
        //   0,
        //   0,
        //   0,
        // ))

        // p5.stroke(p5.color(c[0], c[1], c[2]))
      }
    };
  }

  p5.draw = () => {

    // if(p5.frameCount % 50 == 0) {

    //   console.log('clear')
    //   p5.clear()
    // }

    if (p5.frameCount % 1 == 0) {

      scl = (scl + 0.2) % 15

      if (scl < 10) scl = 10
    }

    // if(p5.frameCount % 1 == 0) {

    //   showField = !showField
    // }

    // if (p5.frameCount % 1 == 0) {

    //   scl = (scl + 0.2) % 15

    //   if (scl < 10) scl = 10
    // }

    if (Synthesizer.activeNotes && Synthesizer.activeNotes.size > 0) {
      // inc = incStart / 10
      incStart = Synthesizer.activeNotes.size
      // magInc = incStart / 100

      // console.log(incStart, magInc)

      p5.strokeWeight(incStart)
    } 
    else {
      inc = 0.005
      incStart = 0.005
      magInc = 0.005

      p5.strokeWeight(1)
    }
    
    incStart = Synthesizer.activeNotes.size


    if (showField) {

      p5.background(0)
    } 
    else {
      // Draw low opacity over everything to make it fade out
      p5.background(p5.color(0, 0, 0, 2))
    }

    var yoff = start
    for (let y = 0; y < rows; y++) {

      let xoff = start

      for (let x = 0; x < cols; x++) {

        let index = x + y * cols
        let r = p5.noise(xoff, yoff, zoff) * cFactor
        let g = p5.noise(xoff + 100, yoff + 100, zoff) * cFactor
        let b = p5.noise(xoff + 200, yoff + 200, zoff) * cFactor
        let angle = p5.noise(xoff, yoff, zoff) * p5.TWO_PI
        let v = p5.constructor.Vector.fromAngle(angle) // vector from angle
        let m = p5.map(p5.noise(xoff, yoff, magOff), 0, 1, -5, 5)
        v.setMag(m)

        // magOff++
        // magOff = magOff % 2

        if (showField) {

          p5.push()
          p5.stroke(255)
          p5.translate(x * scl, y * scl)
          p5.rotate(v.heading())
          let endpoint = p5.abs(m) * scl
          p5.line(0, 0, endpoint, 0)

          if (m < 0) {

            p5.stroke("red")
          } 
          else {
            
            p5.stroke("green")
          }

          p5.line(endpoint - 2, 0, endpoint, 0)
          p5.pop()
        }

        flowfield[index] = v
        flowcolorfield[index] = [r, g, b]
        xoff += inc
      }
      yoff += inc
    }
    magOff += magInc;
    zoff += incStart;
    start -= magInc;

    if (!showField) {
      for (let i = 0; i < particles.length; i++) {
        particles[i].follow(flowfield, flowcolorfield);
        particles[i].update();
        particles[i].edges();
        particles[i].show();
      }

      if (p5.random(10) > 5 && particles.length < 2000) {
        let rnd = p5.floor(p5.noise(zoff) * 20);
        for (let i = 0; i < rnd; i++) {
          particles.push(new Particle());
        }
      } else if (particles.length > 2000) {
        let rnd = p5.floor(p5.random(10));
        for (let i = 0; i < rnd; i++) {
          particles.shift();
        }
      }
    }
  }

  p5.windowResized = () => {
    // TODO - aNOT WORKING
    // p5.resizeCanvas(G.w, G.h)
  }

  let CID;
  p5.keyPressed = () => {
    if (Visual.visualsEnabled) return;
  }
}
