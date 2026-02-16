import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, Component, HostListener, NgZone, OnDestroy } from '@angular/core';

import * as Tone from 'tone'
import { type NoteMessageEvent } from "webmidi";

import { ISerialization, Synthesizer, type ISynthesizerSerialization } from './synthesizer/synthesizer'
import { Storage } from './core/storage'
import { G } from './globals'

import { Visual } from './p5/visual'

import { DEFAULT_SESSION } from './synthesizer/presets';
import { Midi } from './core/midi';
import { isSafari } from './util/browser';

import { COLORS } from './core/colors';
import { SynthesizerComponent } from './view/Synthesizer.component';
import { MenuComponent } from './view/Menu.component';
import { CommonModule } from '@angular/common';
import packageJson from '../../package.json';

export interface IAppSerialization extends ISerialization {

    synthesizer: ISynthesizerSerialization

    version: string,
    animationEnabled: boolean
    visualsEnabled: boolean
    pauseOnLeaveWindow: boolean
    showKeyboard: boolean
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ CommonModule, SynthesizerComponent, MenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  
  

  <div class="app-wrapper">

    <sy-menu [isActive]="isMenuOpen" (onClose)="toggleMenu($event)" (onDeletePreset)="onDeletePresets()" (onToggleVisuals)="toggleVisuals()" />

    <div class="content-wrapper">

        <div *ngIf="isUserActive" class="main-ui">

            <div class="btn" title="Remove Visuals" (click)="collapseVisuals($event)">&#x2715;</div>
            <div class="btn" title="Download Visual" (click)="saveVisuals($event)">I</div>
            <div class="btn" title="Visuals On/Off" (click)="toggleVisuals()">V</div>
            <div class="btn" title="Open visuals in new window" (click)="openVisualsInNewWindow($event)">W</div>

            <div class="btn" title="Menu On/Off" (click)="toggleMenu($event)" style="float:right;"></div>

        </div>

        <div class="footer-ui">
                
            <div class="btn" title="Undo" (click)="onUndo($event)">Un</div>
            <div class="btn" title="Redo" (click)="onRedo($event)">Re</div>

        </div>

        <div id="p5-canvas-cont"></div>

        <div class="synthesizer-wrapper" [class.screen-offset]="!isCollapsed">

            <sy-synthesizer [synthesizer]="synthesizer"/>

        </div>

    </div>

  </div>

    
  
  `,
  styles: `
  
  
  .app-wrapper {

      position: relative;
  }

  .app-wrapper .content-wrapper {
      
      position: relative;
      width: 100%;
      height: 100vh;
  }

  .main-ui {

      position: relative;
      z-index: 5;
  }

  .footer-ui {

      z-index: 5;

      width: 10%;

      display: flex;
      justify-content: space-evenly;

      position: absolute;
      left: 50%;
      top: 0px;
  }

  .synthesizer-wrapper {

      position: absolute;

      top: 25px;
      left: 0px;

      width: 100%;
  }

  .synthesizer-wrapper.screen-offset {

      top: 100vh;
  }

  .svg-line {

      position: absolute;
      left: 0px;
      top: 0px;

      display: block;

      width: 100%;
      height: 100%;
  }

  
  `
})
export class AppComponent implements AfterViewInit, AfterContentInit, OnDestroy{

    synthesizer: Synthesizer

    private storedMuteState: boolean

    /** Menu open/close flag */
    public isMenuOpen = false

    public isUserActive: boolean = false
    private lastActiveTime = Date.now()
    private timeTillInactive = 1000 * 3
    private AFID: number


    constructor(private ngZone: NgZone) {

        // Tone.setContext(new AudioContext({ sampleRate: 22050 }))
        
        // Create Synthesizer
        this.synthesizer = G.synthesizer = new Synthesizer()

        this.storedMuteState = !this.synthesizer.isMuted

        // Init globals
        G.init()
        G.w = window.innerWidth
        G.h = window.innerHeight

        // Set initial volume
        this.synthesizer.setVolume(-3)

        // Safari css support
        if(isSafari()) { document.body.classList.add('safari') }

    }

    ngAfterViewInit(): void {
         

        /** LOAD FROM LOCAL STORAGE */
        const storageData = Storage.load()

        console.log('LOAD FROM STORAGE', storageData)
        if(storageData) this.serializeIn(storageData, true)

        else this.serializeIn(DEFAULT_SESSION, false)

        // Save Undo
        Storage.saveUndo(storageData)

        // Initialize visuals
        Visual.flowField()
        Visual.visualsEnabled = G.visualsEnabled
        //  Visual.activeVisual?.restart()

         // Change Background Colors
        let colors = JSON.parse(JSON.stringify(COLORS))
        colors.sort(() =>  Math.ceil((Math.random() * 2) - 1) )
        
        let i = 0

        setInterval(() => {

            if(G.animationEnabled) {

                if(i >= colors.length) { 
                    
                    i = 0
                    colors.sort(() =>  Math.ceil((Math.random() * 2) - 1))
                }
                
                // console.log('col', colors[i])
                document.body.style.backgroundColor = colors[i]
                
                i++
            }

        }, 20000 * (Tone.getTransport().bpm.value * .01))



        // Add midi support
        Midi.init((e: NoteMessageEvent) => {

        // @ts-ignore
            this.synthesizer.triggerAttack(e.note.identifier, Tone.getContext().currentTime, this.synthesizer.channel, e.note.velocity)
            
        },
        (e) => {
    
            this.synthesizer.triggerRelease(e.note.identifier, Tone.getContext().currentTime, this.synthesizer.channel)
        })
  
      this.ngZone.runOutsideAngular(() => {
      
        this.activityUpdate()
      })
    }
    
    // On document ready
    ngAfterContentInit() {

        // document.addEventListener('pointermove', onMouseMove)

        // // Scroll to bottom
        // setTimeout(() => {

        //     window.scrollTo({
        //         top: 100000000,
        //         left: 0,
        //         behavior: 'smooth',
        //     })

        // }, 1500)


    }

    ngOnDestroy() {

        console.log('ngOnDestroy', )

        // if(IID) clearInterval(IID)

        Storage.save(this.serializeOut())
    }

    get isCollapsed() {

      return Visual.collapsed
    }

    // ON CHANGE TAB
    toggleActive = (active:boolean) => {

        if(!G.pauseOnLeaveWindow) return

        if (active) {

            this.synthesizer.mute(false)
            
            Visual.visualsEnabled = true

            // Resume transport if it was paused
            if(Tone.getTransport().state === 'paused') {
                Tone.getTransport().start(Tone.getContext().currentTime)
            }
        }
        else {

            this.synthesizer.mute(true)

            Visual.visualsEnabled = false

            // Pause transport when tab loses focus
            if(Tone.getTransport().state === 'started') {
                Tone.getTransport().pause(Tone.getContext().currentTime)
            }
        }

        this.synthesizer = this.synthesizer
    }

    /** Toggle menu open/close */
    toggleMenu = (e) => {

        this.isMenuOpen = !this.isMenuOpen
    }

    /** Open visuals in new window */
    openVisualsInNewWindow = (e) => {

        Visual.openInNewWindow()
    }

    /** Enable/Disable Visuals*/
    toggleVisuals = () => {

        Visual.visualsEnabled = !Visual.visualsEnabled
    }

    /** Enable/Disable Visuals*/
    onDeletePresets = () => {

        this.synthesizer.presetManager.reset()
    }
    
    /** Save image of visuals */
    saveVisuals = (e) => {

        Visual.visualsEnabled = false

        G.saveVisuals()

        Visual.visualsEnabled = true
    }

    /** Collapse visuals container */
    collapseVisuals = (e) => {

        Visual.collapsed = !Visual.collapsed

        if(Visual.activeVisual) {

            if(Visual.collapsed) Visual.activeVisual.remove()
            else Visual.activeVisual.restart()
        }
        else Visual.moire()
    }

    onUndo = (e) => {

        this.synthesizer.serializeIn(JSON.parse(Storage.undo()))
    }

    onRedo = (e) => {

        this.synthesizer.serializeIn(JSON.parse(Storage.redo()))
    }



    // Serialize
    serializeIn = (file: any, isString: boolean = false) => {
        
        if(file == null) return
    
        let o: IAppSerialization

        if(isString) {
          try {
            o = JSON.parse(file)
          } catch(e) {
            console.error('Failed to parse stored data:', e)
            console.log('Using DEFAULT_SESSION instead')
            localStorage.removeItem('synthesizer-save')
            o = DEFAULT_SESSION
          }
        }
        else o = file

        console.log('Serialize In', o)

        G.version = o.version
        G.animationEnabled = o.animationEnabled
        G.visualsEnabled = o.visualsEnabled
        G.pauseOnLeaveWindow = o.pauseOnLeaveWindow
        G.showKeyboard = o.showKeyboard
    
        this.synthesizer.serializeIn(o.synthesizer)
    }

    serializeOut = () : string =>  {
    
        let o: IAppSerialization = {

            version: packageJson.version,
            animationEnabled: G.animationEnabled,
            visualsEnabled: G.visualsEnabled,
            pauseOnLeaveWindow: G.pauseOnLeaveWindow,
            showKeyboard: G.showKeyboard,

            synthesizer: this.synthesizer.serializeOut(),
        }

        return JSON.stringify(o)
    }


    @HostListener('document:pointermove', ['$event'])
    onMouseMove = (e) => {

        this.isUserActive = true

        this.lastActiveTime = Date.now()
    }

    activityUpdate = () => {

        if(this.lastActiveTime + this.timeTillInactive < Date.now()) {
            
            this.isUserActive = false
        }
        // console.log('requestAnimationFrame', NgZone.isInAngularZone())
        
        window.cancelAnimationFrame(this.AFID)
        this.AFID = window.requestAnimationFrame(this.activityUpdate.bind(this))
    }

    
    @HostListener('document:visibilitychange', ['$event'])
    /** Mute when visibility is changing */
    onVisibilityChange = (e) => {
            
        if (document.visibilityState == "visible") {
            
            this.toggleActive(this.storedMuteState)
        }
        else {
            
          this.storedMuteState = !this.synthesizer.isMuted
          this.toggleActive(false)
        }
    }


    // Enter/Leave browser Mute
    @HostListener('window:focus', ['$event'])
    private onWindowFocus = () => {

        this.toggleActive(this.storedMuteState)
    }
    @HostListener('window:blur', ['$event'])
    private onWindowBlur = () => {

        this.storedMuteState = !this.synthesizer.isMuted
        this.toggleActive(false)
    }

    // Browser resize event
    @HostListener('window:resize', ['$event'])
    private onWindowResize = () => {
    
        G.w = window.innerWidth
        G.h = window.innerHeight
    }

    // ON UNLOAD
    @HostListener('window:beforeunload', ['$event'])
    private onbeforeunload = () => {

        Storage.save(this.serializeOut())

        this.synthesizer.mute(true)

        Tone.getTransport().pause()
    }

    @HostListener('document:click', ['$event'])
    // Start on click
    private onClick = () => {
        
        if(!G.isPlaying) G.start()

        // console.log('click', synthesizer.presetManager.getPresets())

        // synthesizer.tracks.forEach(track => {

        //     console.log('Instrument', track.instrument.name, track.instrument.connectedInputs, track.instrument.connectedOutputs)
        //     track.nodes.forEach(node => {

        //         console.log('Node', node.name, node.connectedInputs, node.connectedOutputs)
        //     })
        // })
    }
  }


