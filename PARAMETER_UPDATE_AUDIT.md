# Parameter Update Method Audit

## Problem Summary
Different nodes use different methods to update audio parameters, causing inconsistent behavior. Some use immediate `setValueAtTime()` (zipper noise), some use ramping, and some bypass parameters entirely.

## Issues Found

### 1. **Inconsistent Parameter Update Methods**

| File | Parameter | Current Method | Issue |
|------|-----------|-----------------|-------|
| `synth.ts` | volume | `setValueAtTime()` | ❌ Zipper noise (immediate snap) |
| `synth.ts` | detune | `.set()` | ✅ OK (non-audio param) |
| `oscillator.ts` | volume | `setValueAtTime()` | ❌ Zipper noise |
| `oscillator.ts` | detune | `setValueAtTime()` | ❌ Zipper noise |
| `oscillator.ts` | frequency | `setValueAtTime()` | ❌ Zipper noise |
| `delay.ts` | wet | `setValueAtTime()` | ❌ Zipper noise |
| `delay.ts` | feedback | `setValueAtTime()` | ❌ Zipper noise |
| `delay.ts` | delayTime | `linearRampToValueAtTime()` | ✅ Good (has ramping) |
| `distortion.ts` | wet | `.set()` | ⚠️ Inconsistent (uses object setter, not parameter ramping) |
| `distortion.ts` | gain | Direct assignment `this.distortion.distortion = ` | ❌ Very unsafe |
| `tremolo.ts` | wet | `.set()` | ⚠️ Inconsistent |
| `tremolo.ts` | frequency | `.set()` | ⚠️ Inconsistent |
| `tremolo.ts` | depth | `.set()` | ⚠️ Inconsistent |
| `reverb.ts` | All params | `.set()` | ⚠️ Inconsistent |

### 2. **Audio Parameters That Should Use Ramping**
These control continuous audio signals and should use `linearRampToValueAtTime()` to prevent clicks/pops:

**Source Instruments:**
- `volume` - controls gain
- `frequency` - controls pitch (already uses `setValueAtTime` - needs ramping)
- `detune` - slight pitch variation

**Effects:**
- `wet` - dry/wet mix (audio signal modulation)
- `feedback` - affects audio feedback path
- `depth` - LFO modulation depth

### 3. **Specific Problems**

#### Tremolo.ts Bug (Line 32)
```typescript
this.props.set('frequency', { 
    // ...
    set: (v) => this._frequency = v,  // ❌ Sets internal var but never calls frequency setter!
```
Should be: `set: (v) => this.frequency = v`

#### Distortion.ts Bug (Line 41)
```typescript
this.distortion.distortion = this._gain  // ❌ Direct property assignment, not safe parameter update
```

### 4. **Master Volume Already Fixed**
`synthesizer.ts` now uses `linearRampToValueAtTime()` ✅

## Solution

### Strategy
1. **All audio-rate parameters** (wet, feedback, volume, depth) → `linearRampToValueAtTime(value, now + 0.05)`
2. **Control-rate parameters** (detune, attack/decay times) → `.set()` is OK since they're not directly modulating audio signal
3. **Array/object parameters** (waveform, curves) → Keep `.set()`
4. **Always use ramping duration of ~50ms (0.05s)** to match master volume

## Files That Need Fixes

### Priority 1 - Audio Parameters (Will cause crackles if not fixed)
- [ ] `oscillator.ts` - volume, frequency, detune
- [ ] `synth.ts` - volume
- [ ] `delay.ts` - wet, feedback
- [ ] All other effects with `wet` parameter

### Priority 2 - Bug Fixes
- [ ] `tremolo.ts` - frequency setter not being called (line 32)
- [ ] `distortion.ts` - unsafe direct property assignment (line 41)

### Priority 3 - Consistency (Should use ramping for smooth control)
- [ ] Audio effects should have consistent parameter update patterns
