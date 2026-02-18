
import * as Tone from "tone";
import { Component, ChangeDetectionStrategy, ElementRef, Input, ViewChild, Renderer2 } from "@angular/core"


@Component({

  selector: 'sy-oscilloscope',
  standalone: true,
  // changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    
  <div id="oscilloscope" title="Oscilloscope" #container>

      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" preserveAspectRatio="none">

        <!-- MAKES IT SINGLETON SOMEHOW. ALL WAVES LOOK THE SAME -->
          <!-- <defs> -->
            <polyline id="wave" stroke="#fed33a" stroke-width="1px" [attr.points]="pointsString" />
          <!-- </defs> -->
    
          <!-- <use href="#wave" x="0"  y="0"/> -->
          <!-- <use href="#wave" x="0"  y="-5" style="opacity: .2" /> -->
          <!-- <use href="#wave" x="0"  y="5" style="opacity: .2" /> -->

      </svg>

  </div>

`,
  styles: `
    #oscilloscope,
    svg {

        mix-blend-mode: difference;

        width: 100px;
        height: 50px;
    }

    svg { mix-blend-mode: unset; }

`,

})
export class OscilloscopeComponent {

  constructor(private renderer: Renderer2) {}

  @ViewChild('container') 
  private _container: ElementRef<HTMLElement>
  get container() {

    if(this._container == undefined) return null
    return this._container.nativeElement
  }

  _output: any
  @Input('output') 
  set output(o: any) {

      if(o != this.connectedOuput) {

          this._output = o

          this.disconnect()

          this.connect()
      }
  }
  get output(): any {
      return this._output
  }
  private connectedOuput: any

  private scheduleID

  private analyser: AnalyserNode
  private bufferLength: number
  private dataArray: Uint8Array
  public pointsString = ''
  private polyline: SVGPolylineElement
  
  private active = false

  public w = 100
  public h = 50

  draw = () => {

    if (this.active) {

      if (this.analyser) {
        
        this.analyser.getByteTimeDomainData(this.dataArray as any)
        
        if(this.container == null) return

        this.w = this.container.clientWidth
        this.h = this.container.clientHeight
        
        var sliceWidth = this.w / this.bufferLength
        var x = 0
        var points = []
        var step = Math.max(1, Math.floor(this.bufferLength / this.w))
        
        for (var i = 0; i < this.bufferLength; i += step) {
          
          var v = this.dataArray[i] / 128.0
          var y = v * (this.h / 2)
          
          points.push(`${x},${y}`)
          x += sliceWidth * step
        }
        
        const pointsStr = points.join(' ')
        if (this.polyline) {
          this.renderer.setAttribute(this.polyline, 'points', pointsStr)
        }
      }
    }
  }

  connect = () => {

    if (!this.output || typeof this.output.connect !== 'function') {
      console.warn('Output is not a valid ToneAudioNode:', this.output)
      return
    }
    this.analyser = Tone.context.createAnalyser()
    this.analyser.fftSize = 2048//4096
    this.bufferLength = this.analyser.frequencyBinCount
    this.dataArray = new Uint8Array(this.bufferLength)
    this.analyser.getByteTimeDomainData(this.dataArray as any)

    this.active = true

    this.output.connect(this.analyser)

    if(this.scheduleID != undefined) Tone.getTransport().clear(this.scheduleID)

    this.scheduleID = Tone.getTransport().scheduleRepeat((t) => {
      Tone.Draw.schedule(this.draw, t)
    }, 1 / 12)
    this.connectedOuput = this.output
  }

  disconnect = () => {

    if(this.scheduleID != undefined) Tone.getTransport().clear(this.scheduleID)

    // output.disconnect(analyser)

    if(this.analyser) this.analyser.disconnect()

    this.connectedOuput = null
  }

  ngAfterViewInit() {

    const svg = this.container?.querySelector('svg')
    this.polyline = svg?.querySelector('polyline') as SVGPolylineElement

    if(this.container && this.output) { 
      
      this.w = this.container.clientWidth
      this.h = this.container.clientHeight
      
      this.connect()
    }
  }

  ngOnDestroy() {

    if(this.output) this.disconnect()
  }
}
