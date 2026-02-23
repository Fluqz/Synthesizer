
import { Component, EventEmitter, Input, Output } from "@angular/core";

import { EQ3 } from '../synthesizer/nodes/effects/eq3'


@Component({
  selector: 'sy-eq3-editor',
  standalone: true,
  template: `
    <div class="eq3-editor" #container>
      <svg xmlns="http://www.w3.org/2000/svg" [attr.width]="width" [attr.height]="height">
        <!-- Grid -->
        <line x1="0" [attr.y1]="centerY" [attr.x2]="width" [attr.y2]="centerY" stroke="#333" stroke-width="0.5" opacity="0.5"/>
        
        <!-- EQ curve -->
        <polyline id="eqCurve" stroke="#fed33a" stroke-width="2" fill="none" [attr.points]="curvePoints" />
        
        <!-- Low freq control (draggable circle) -->
        <circle [attr.cx]="lowFreqX" [attr.cy]="lowGainY" r="6" fill="#ff6b6b" 
          (mousedown)="startDrag($event, 'low')" style="cursor: grab;" />
        
        <!-- High freq control (draggable circle) -->
        <circle [attr.cx]="highFreqX" [attr.cy]="highGainY" r="6" fill="#4ecdc4" 
          (mousedown)="startDrag($event, 'high')" style="cursor: grab;" />
      </svg>
      
      <!-- Knobs for Q and Mid -->
      <div class="controls">
        <label>Q: {{ eq.Q.toFixed(2) }}
          <input type="range" min="0.1" max="10" step="0.1" [value]="eq.Q" 
            (input)="updateQ($event)" />
        </label>
        <label>Mid Gain: {{ eq.mid.toFixed(1) }}dB
          <input type="range" min="-12" max="12" step="0.5" [value]="eq.mid" 
            (input)="updateMid($event)" />
        </label>
      </div>
    </div>
  `,
  styles: `
    .eq3-editor {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    svg {
      border: 1px solid #333;
      background: #1a1a1a;
    }
    .controls {
      display: flex;
      gap: 20px;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    input[type="range"] {
      width: 150px;
    }
  `
})
export class EQ3EditorComponent {
  @Input() eq: EQ3
  @Output() change = new EventEmitter();

  width = 400;
  height = 200;
  centerY = 100;

  private dragging: string | null = null;
  private dragStart = { x: 0, y: 0 };

  // Frequency mapping: 20Hz - 20kHz logarithmic
  private freqToX(freq: number): number {
    const minFreq = 20;
    const maxFreq = 20000;
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const logFreq = Math.log10(freq);
    return ((logFreq - logMin) / (logMax - logMin)) * this.width;
  }

  private xToFreq(x: number): number {
    const minFreq = 20;
    const maxFreq = 20000;
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);
    const normalized = x / this.width;
    return Math.pow(10, logMin + normalized * (logMax - logMin));
  }

  private gainToY(gain: number): number {
    // Gain range: -12 to +12 dB, center at 0
    const maxGain = 12;
    return this.centerY - (gain / maxGain) * (this.centerY - 10);
  }

  private yToGain(y: number): number {
    const maxGain = 12;
    return ((this.centerY - y) / (this.centerY - 10)) * maxGain;
  }

  get lowFreqX(): number {
    return this.freqToX(this.eq.lowFrequency);
  }

  get highFreqX(): number {
    return this.freqToX(this.eq.highFrequency);
  }

  get lowGainY(): number {
    return this.gainToY(this.eq.low);
  }

  get highGainY(): number {
    return this.gainToY(this.eq.high);
  }

  get curvePoints(): string {
    const points = [];
    const step = Math.max(1, Math.floor(this.width / 100));

    for (let px = 0; px < this.width; px += step) {
      const freq = this.xToFreq(px);
      let gain = 0;

      // Simple EQ model (low/mid/high bell curves)
      if (freq < this.eq.lowFrequency) {
        const ratio = freq / this.eq.lowFrequency;
        gain = this.eq.low * ratio;
      } else if (freq < this.eq.highFrequency) {
        gain = this.eq.mid;
      } else {
        const ratio = (20000 - freq) / (20000 - this.eq.highFrequency);
        gain = this.eq.high * ratio;
      }

      const py = this.gainToY(gain);
      points.push(`${px},${py}`);
    }

    return points.join(' ');
  }

  startDrag(event: MouseEvent, type: 'low' | 'high') {
    this.dragging = type;
    this.dragStart = { x: event.clientX, y: event.clientY };
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.endDrag);
  }

  private onDrag = (event: MouseEvent) => {
    if (!this.dragging) return;

    const deltaX = event.clientX - this.dragStart.x;
    const deltaY = event.clientY - this.dragStart.y;

    if (this.dragging === 'low') {
      this.eq.lowFrequency = Math.max(20, Math.min(this.eq.highFrequency - 100, this.xToFreq(this.lowFreqX + deltaX)));
      this.eq.low = Math.max(-12, Math.min(12, this.yToGain(this.lowGainY + deltaY)));
    } else {
      this.eq.highFrequency = Math.max(this.eq.lowFrequency + 100, Math.min(20000, this.xToFreq(this.highFreqX + deltaX)));
      this.eq.high = Math.max(-12, Math.min(12, this.yToGain(this.highGainY + deltaY)));
    }

    this.dragStart = { x: event.clientX, y: event.clientY };
    this.change.emit(this.eq);
  };

  private endDrag = () => {
    this.dragging = null;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.endDrag);
  };

  updateQ(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.eq.Q = value;
    this.change.emit(this.eq);
  }

  updateMid(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.eq.mid = value;
    this.change.emit(this.eq);
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.endDrag);
  }
}