# Tone.js Official Parameter Ranges

## Important Note: Sources Clarification

This document distinguishes between THREE sources:

1. **[TONEJS]** - Official Tone.js default values and constructor specs (from r13 docs)
2. **[WEBAUDIO]** - Web Audio API limits and standards  
3. **[SYNTH_CONVENTION]** - General synthesizer/audio engineering conventions (NOT from Tone.js)

**Tone.js does NOT enforce hard limits** on most parameters. Values can typically be set to any number. Hard limits only exist in Web Audio API (Nyquist, buffer size, etc.).

---

## OSCILLATORS

### Tone.Oscillator
**Constructor:** `new Tone.Oscillator([frequency], [type])`

**Official Defaults [TONEJS]:**
```
type: "sine"
frequency: 440 Hz
detune: 0 cents
phase: 0 degrees
partials: [] (empty array)
partialCount: 0 (uses maximum)
```

| Parameter | Type | [TONEJS] Default | [TONEJS] Valid Values | Notes |
|-----------|------|---------|-----------------|-------|
| **frequency** | Frequency | 440 | Any number (Hz) | No hard limit in Tone.js, [WEBAUDIO] Nyquist = 22050 Hz max useful |
| **detune** | Cents | 0 | Any number | No limit in Tone.js. [SYNTH_CONVENTION]: -1200 to +1200 is typical |
| **type** | string | "sine" | "sine", "square", "triangle", "sawtooth", "sine#", etc. | Can append number for partials (e.g., "sine4") |
| **phase** | Degrees | 0 | Any number | Wraps around at 360, no enforcement in Tone.js |
| **partials** | Array | [] | Any amplitude array | Array of harmonic amplitudes |
| **partialCount** | Number | 0 | 0 or any positive int | 0 = maximum, otherwise limits count |
| **volume** | dB | 0 | Any number | From Source parent, no limit in Tone.js |

---

### Tone.FatOscillator
**Extends:** Tone.Oscillator

**Constructor:** `new Tone.FatOscillator([frequency], [type], [modulationType])`

**Official Defaults [TONEJS]:**
```
frequency: 440
type: "sawtooth"
detune: 0
phase: 0
spread: 20
count: 3
partials: []
partialCount: 0
```

| Parameter | Type | [TONEJS] Default | [TONEJS] Valid Values | Notes |
|-----------|------|---------|-----------------|-------|
| **frequency** | Frequency | 440 | Any number (Hz) | Frequency of oscillators |
| **type** | string | "sawtooth" | sine, square, triangle, sawtooth, custom | Waveform type |
| **count** | Number | 3 | 1+ | Number of detuned oscillators |
| **spread** | Cents | 20 | Any number | Detune spread between oscillators |
| **detune** | Cents | 0 | Any number | Base detune for all oscillators |

---

### Tone.PWMOscillator
**Extends:** Tone.Oscillator

| Parameter | Type | Default | Practical Range | Notes |
|-----------|------|---------|-----------------|-------|
| **frequency** | Frequency | 440 | 20 - 20000 Hz | Base frequency |
| **width** | NormalRange | 0.5 | 0.01 - 0.99 | PWM duty cycle (0.5 = square wave) |

---

### Tone.AMOscillator (Amplitude Modulation)
| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| **frequency** | Frequency | 440 | 20 - 20000 Hz | Carrier frequency |
| **type** | string | "sine" | - | Waveform type |
| **modulationType** | string | "sine" | - | Modulator waveform |

---

### Tone.FMOscillator (Frequency Modulation)
| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| **frequency** | Frequency | 440 | 20 - 20000 Hz | Carrier frequency |
| **type** | string | "sine" | - | Waveform type |
| **modulationType** | string | "sine" | - | Modulator waveform |

---

## SYNTHS

### Tone.Synth (Basic Synth)
**Constructor:** `new Tone.PolySynth(Tone.Synth)`

| Parameter | Type | Default | Practical Range | Notes |
|-----------|------|---------|-----------------|-------|
| **volume** | dB | 0 | -70 to +40 | Master synth volume |
| **detune** | Cents | 0 | -1200 to +1200 | Pitch detune |
| **portamento** | Time | 0 | 0 to 5+ seconds | Glide/slide time |
| **envelope.attack** | Time | 0.005 | 0 to 10+ seconds | ADSR attack |
| **envelope.decay** | Time | 0.1 | 0 to 10+ seconds | ADSR decay |
| **envelope.sustain** | NormalRange | 0.3 | 0 to 1 | Sustain level (0-1) |
| **envelope.release** | Time | 1 | 0 to 10+ seconds | ADSR release |
| **oscillator.type** | string | "triangle" | sine, square, sawtooth, triangle, pulse | Waveform |

---

### Tone.MonoSynth
Similar to Synth, single-voice only.

---

### Tone.MembraneSynth (Kick/Percussion)
| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| **volume** | dB | 0 | -70 to +40 | Output volume |
| **pitchDecay** | Time | 0.08 | 0 to 2 seconds | Pitch envelope decay |
| **octaves** | Number | 6 | 1 to 8 | Pitch range in octaves |
| **envelope** | ADSR | - | - | Standard ADSR |

---

### Tone.MetalSynth (Bell/Metallic Sounds)
| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| **volume** | dB | 0 | -70 to +40 | Output volume |
| **frequency** | Frequency | 440 | 20 - 20000 Hz | Base frequency |
| **envelope** | ADSR | - | - | Attack/Decay/Release |
| **harmonicity** | Number | 12 | 0.1 - 50+ | Harmonic ratios |

---

### Tone.FMSynth (Frequency Modulation)
| Parameter | Type | Default | Range | Notes |
|-----------|------|---------|-------|-------|
| **volume** | dB | 0 | -70 to +40 | Output volume |
| **detune** | Cents | 0 | -1200 to +1200 | Pitch detune |
| **portamento** | Time | 0 | 0 to 5+ seconds | Glide time |
| **harmonicity** | Number | 3 | 0.1 - 50+ | Modulator/Carrier ratio |
| **modulationIndex** | Number | 40 | 0 - 100+ | FM intensity |
| **envelope** | ADSR | - | - | Modulator envelope |

---

### Tone.AMSynth (Amplitude Modulation)
Similar to FMSynth but with amplitude modulation instead of frequency modulation.

---

## EFFECTS

### Tone.Distortion
| Parameter | Type | Default | Practical Range | Notes |
|-----------|------|---------|-----------------|-------|
| **distortion** | NormalRange | 0.4 | 0 to 1+ | 0 = none, 1+ = heavy distortion |
| **wet** | NormalRange | 1 | 0 to 1 | Effect mix (0 = dry, 1 = wet) |

---

### Tone.FeedbackDelay
| Parameter | Type | [TONEJS] Default | [TONEJS] Valid Values | Notes |
|-----------|------|---------|-----------------|-------|
| **delayTime** | Time | 0.5 | Any number | Delay amount |
| **feedback** | NormalRange | 0.5 | 0 to 1 | [SYNTH_CONVENTION]: Avoid >0.95 for stability |
| **wet** | NormalRange | 1 | 0 to 1 | From Effect parent class |
| **maxDelay** | Time | 1 | Any number | Max delay buffer time |

---

### Tone.Reverb
| Parameter | Type | [TONEJS] Default | [TONEJS] Valid Values | Notes |
|-----------|------|---------|-----------------|-------|
| **decay** | Time | 1.5 | Any number (seconds) | Reverb tail length |
| **preDelay** | Time | 0.01 | Any number (seconds) | Pre-delay before reverb starts |
| **wet** | NormalRange | 1 | 0 to 1 | From Effect parent class |

---

### Tone.Chorus
**Official Defaults [TONEJS]:**
```
frequency: 1.5 Hz
delayTime: 3.5 ms
depth: 0.7
type: "sine"
spread: 180°
```

| Parameter | Type | [TONEJS] Default | [TONEJS] Valid Values | Notes |
|-----------|------|---------|-----------------|-------|
| **frequency** | Frequency | 1.5 Hz | Any number (Hz) | LFO modulation rate |
| **delayTime** | Milliseconds | 3.5 | 2 to 20 ms (nominal range) | Base delay time |
| **depth** | NormalRange | 0.7 | Any number | Modulation depth (0 = no modulation, 1 = delayTime * 2) |
| **type** | string | "sine" | sine, triangle, square, sawtooth | LFO waveform type |
| **spread** | Degrees | 180 | 0 to 180 | Stereo spread (0 = center, 180 = hard left/right) |
| **wet** | NormalRange | 1 (from parent Effect) | 0 to 1 | Dry/wet mix |

---

### Tone.Tremolo (Amplitude Modulation)
| Parameter | Type | [TONEJS] Default | [TONEJS] Valid Values | Notes |
|-----------|------|---------|-----------------|-------|
| **frequency** | Frequency | 9 Hz | Any number (Hz) | LFO rate |
| **depth** | NormalRange | 0.5 | Any number | Modulation depth |
| **type** | string | "sine" | sine, triangle, square, sawtooth | LFO waveform |
| **wet** | NormalRange | 1 | 0 to 1 | From Effect parent class |

---

### Tone.Vibrato (Pitch Modulation)
| Parameter | Type | [TONEJS] Default | [TONEJS] Valid Values | Notes |
|-----------|------|---------|-----------------|-------|
| **frequency** | Frequency | 5 Hz | Any number (Hz) | LFO rate |
| **depth** | Cents | 50 | Any number (cents) | Pitch modulation amount |
| **type** | string | "sine" | sine, triangle, square, sawtooth | LFO waveform |

---

### Tone.Phaser
| Parameter | Type | [TONEJS] Default | [TONEJS] Valid Values | Notes |
|-----------|------|---------|-----------------|-------|
| **frequency** | Frequency | 0.5 Hz | Any number (Hz) | LFO modulation rate |
| **stages** | Number | 4 | Any positive number | Number of allpass filters |
| **depth** | Number | 1 | Any number | Feedback depth |
| **feedback** | NormalRange | 0.7 | Any number | Feedback amount |
| **wet** | NormalRange | 1 | 0 to 1 | From Effect parent class |

---

### Tone.AutoFilter
| Parameter | Type | [TONEJS] Default | [TONEJS] Valid Values | Notes |
|-----------|------|---------|-----------------|-------|
| **frequency** | Frequency | 0.5 Hz | Any number (Hz) | LFO rate |
| **baseFrequency** | Frequency | 200 Hz | Any number (Hz) | Filter center frequency |
| **octaves** | Number | 4 | Any positive number | Modulation range in octaves |
| **filter** | Filter | - | - | Internal filter settings |
| **wet** | NormalRange | 1 | 0 to 1 | From Effect parent class |

---

## UNITS REFERENCE

| Unit Type | Description | Range | Examples |
|-----------|-------------|-------|----------|
| **Frequency** | Hz, can use note names | 20 - 20000 Hz | "C4", 440, "A#3" |
| **Time** | Seconds or musical notation | 0 to ∞ | 0.5, "4n", "8t", "1m" |
| **dB** | Decibels | -∞ to +40 | -6, 0, 12 |
| **NormalRange** | 0 to 1 ratio | 0 to 1 | 0.5, 0.75, 1 |
| **Cents** | Pitch cents (100 = 1 semitone) | -∞ to +∞ | -50, 0, 100 |
| **Degrees** | Angle/Phase | 0 to 360 | 90, 180, 270 |

---

## ACTUAL TONEJS LIMITS (Hard Constraints)

From official Tone.js source code and Web Audio API:

1. **[TONEJS]** Most parameters: **NO HARD LIMITS** - accepts any number
2. **[WEBAUDIO]** Frequency: Maximum = Nyquist frequency (22.05 kHz @ 44.1 kHz sample rate)
3. **[WEBAUDIO]** Buffer size: Limited by browser memory (typically 10-60 seconds)
4. **[TONEJS]** NormalRange (0-1): Can exceed 0-1 range, but behavior undefined
5. **[SYNTH_CONVENTION]** Feedback: Keep < 0.95 to avoid clipping (NOT enforced by Tone.js)

---

## YOUR CURRENT RANGES vs TONEJS

Your synthesizer's knob ranges may be **SYNTH_CONVENTION** or **[YOUR_OWN]** constraints, not Tone.js enforced:

| Parameter | Tone.js Enforces? | Your Range | Source |
|-----------|------------------|-----------|--------|
| Volume | NO | -70 to 6 dB | [SYNTH_CONVENTION] audio engineering |
| Detune | NO | -100 to 100 cents | [YOUR_OWN] - Tone.js allows unlimited |
| Frequency | NO (except Nyquist) | 20 to 20000 Hz | [SYNTH_CONVENTION] human hearing |
| Attack/Decay | NO | 0 to 5 seconds | [YOUR_OWN] - Tone.js allows unlimited |
| Feedback | NO | 0 to 1 | [SYNTH_CONVENTION] prevents instability |

---

## WHAT TO USE

**If you want Tone.js defaults only:**
Remove upper/lower limits and let Tone.js accept any number.

**If you want realistic synthesizer behavior:**
Keep [SYNTH_CONVENTION] ranges to prevent:
- Extreme frequency warping
- Unstable feedback loops  
- Inaudible/unusable attack times
- Audio clipping

**Recommended approach:**
Document each range with its source: `[TONEJS]`, `[WEBAUDIO]`, or `[SYNTH_CONVENTION]`

