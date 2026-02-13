# Synthesizer/DAW Application - Technical Documentation

## Overview

A browser-based synthesizer and DAW (Digital Audio Workstation) hybrid built with **Angular 18**, **Tone.js 15**, and **p5.js** for visualization. The app enables keyboard-based music composition, real-time audio synthesis, sequencing, and recording.

**Tech Stack:**
- Framework: Angular 18
- Audio Engine: Tone.js 15
- Visualization: p5.js (not covered in this doc)
- MIDI Support: WebMIDI
- Build: Angular CLI v18.1.3
- TypeScript 5.5

---

## Architecture Overview

### High-Level Components

```
┌─ Synthesizer (Core Audio Engine)
│  ├─ Tracks (multiple instruments)
│  ├─ Sequencers (note sequences)
│  ├─ PresetManager (save/load sessions)
│  └─ BeatMachine (timing/scheduling)
│
├─ Views (Angular Components)
│  ├─ Track.component
│  ├─ Sequencer.component
│  ├─ Node.component
│  └─ [Other UI components]
│
└─ Core Services
   ├─ Preset Manager
   ├─ MIDI Controller
   ├─ Storage / DB
   └─ Definitions
```

---

## Core Synthesizer Logic

### Main Classes in `/src/app/synthesizer/`

#### **Synthesizer.ts** - Master audio engine
The central hub managing all audio synthesis and components.

**Key Properties:**
- `channel: Channel` - Currently selected output channel (0-15, 16 total)
- `volume: Tone.Volume` - Master volume node
- `bpm: number` - Beats per minute (getter/setter for Tone.Transport)
- `octave: number` - Current keyboard octave (0-7)
- `tracks: Track[]` - Array of all synthesizer tracks
- `sequencers: Sequencer[]` - Array of all sequencers
- `components: ComponentType[]` - Ordered list of tracks & sequencers
- `presetManager: PresetManager` - Session/preset management
- `recorder: Tone.Recorder` - Audio recording capability

**Static Properties:**
- `keyMap: string[]` - Keyboard mappings (QWERTY layout)
- `notes: string[]` - Chromatic notes (C, C#, D, ... B)
- `octaves: number[]` - Valid octave range (0-7)
- `activeNotes: Set<Frequency>` - Currently triggered notes
- `keys: Key[]` - All Key objects
- `nodes: { effects, sources }` - Factory for creating instruments & effects

**Key Methods:**
- `triggerAttack(note, time, channel)` - Start playing a note
- `triggerRelease(note, time, channel)` - Stop playing a note
- `triggerAttackRelease(note, duration, time, channel)` - Full note lifecycle
- `addTrack(track)` / `removeTrack(track)` - Manage tracks
- `addSequencer(seq)` / `removeSequencer(seq)` - Manage sequencers
- `startSequencers()` / `stopSequencers()` - Control sequencer playback
- `toggleRecording()` - Record audio output to WebM file
- `setVolume(db)` / `setOctave(o)` - Global parameters
- `mute(bool)` - Mute master output
- `serializeOut()` / `serializeIn()` - Session save/load

#### **Track.ts** - Individual instrument channel
Represents a single instrument with effects chain and volume control.

**Key Properties:**
- `channel: Channel` - Output channel number
- `instrument: Instrument` - Active sound source (synth, sampler, noise, etc.)
- `nodes: Node[]` - Effects chain (effects are applied in array order)
- `volumeNode: Tone.Volume` - Track-level volume
- `octaveOffset: number` - Local octave transposition
- `activeNotes: Set<Frequency>` - Notes currently playing on this track
- `hold: HoldModeState` - Hold mode state ('OFF' | 'PLAY' | 'HOLD')
- `isMuted: boolean` - Track mute
- `soloEnabled: boolean` - Solo mode

**Hold Mode:**
- **OFF**: Normal operation, notes release immediately
- **PLAY**: Notes triggered but never released (hold down)
- **HOLD**: Last played notes stay on, new notes ignored

**Solo Mode:**
- Activating solo on track silences all other tracks
- Multiple tracks can be in solo simultaneously
- Unmuting a muted track while others are solo keeps it silent

**Key Methods:**
- `setInstrument(instrument)` - Swap instrument
- `triggerAttack(note, time)` / `triggerRelease(note, time)` - Play notes
- `releaseNotes()` - Release all active notes
- `addNode(node)` / `removeNode(node)` - Manage effects chain
- `connectNodes()` - Rebuild audio graph (instrument → nodes → volume)
- `mute(bool)` / `solo(bool)` - Mixing controls
- `shiftNodeForward()` / `shiftNodeBackward()` - Reorder effects

#### **Sequencer.ts** - Step sequencer / pattern player
Plays predefined note sequences on a timeline.

**Key Properties:**
- `sequence: SequenceObject[]` - Array of notes with timing
- `channels: Channel[]` - Output channels for this sequencer
- `bars: number` - Number of bars in loop
- `noteLength: NoteLength` - Default note duration ('1' to '1/64')
- `humanize: boolean` - Random timing humanization
- `loop: boolean` - Loop playback
- `toneSequence: Tone.Part` - Tone.js Part object for scheduling
- `isPlaying: boolean` - Playback state

**Sequence Object:**
```typescript
{
  id: number,           // Unique note ID
  note: Frequency,      // Note name (e.g., "C4")
  time: Time,           // Position in bars (e.g., "1.0.0")
  length: Time,         // Duration (e.g., "1/16")
  velocity?: number     // Optional velocity (0-1)
}
```

**Key Methods:**
- `addNote(note, time, length, velocity)` - Add note to sequence
- `updateNote(id, note, time, length, velocity)` - Modify note
- `removeNote(id)` - Delete note
- `addBar()` / `removeBar()` - Expand/shrink sequence
- `start()` - Begin playback on next beat
- `stop()` - Stop playback
- `activateChannel(ch)` / `deactivateChannel(ch)` - Route to channels

#### **BeatMachine.ts** - Timing & synchronization
Singleton class providing beat synchronization across sequencers.

**Key Methods:**
- `start()` - Initialize transport loops (calls `G.start()`)
- `stop()` - Stop all loops
- `scheduleNextBeat(fn)` - Schedule function on next beat (1 bar)
- `subscribeTimeLine(fn)` - Subscribe to timeline updates (~3ms interval)

**Internal:**
- Uses Tone.Loop at 1-bar intervals for beat sync
- Uses Tone.Loop at ~67ms intervals for fine-grained timeline updates
- Fires RxJS Subjects for observers

#### **Key.ts** - Individual keyboard key
Represents one physical key mapped to a note/octave.

**Properties:**
- `note: string` - Note name (C, C#, D, etc.)
- `octave: number` - Octave number
- `mapping: string` - Keyboard key character
- `isPressed: boolean` - Current state
- `onTrigger: Subject<Key>` - Fires on key down
- `onRelease: Subject<Key>` - Fires on key up

---

## Nodes System - Instruments & Effects

### Node Hierarchy

All instruments and effects inherit from base classes:

**Effects (Audio Processors):**
- Delay, Tremolo, Distortion, Chorus, AutoFilter, Reverb, Phaser, Vibrato

**Instruments (Sound Sources):**
- **Synths:** Synth, FMSynth, AMSynth, DuoSynth, MembraneSynth, MonoSynth, PluckSynth, MetalSynth, NoiseSynth
- **Oscillators:** Oscillator, FatOscillator, FMOscillator, AMOscillator, PulseOscillator, PWMOscillator, Noise
- **Sample-based:** Sampler, GrainPlayer

### Node Factory Pattern

Instruments and effects are created via factory methods:

```typescript
// In Synthesizer.nodes
static createNode(name: string): Instrument | Effect | null {
  if(nodes.sources[name]) return nodes.sources[name]()
  if(nodes.effects[name]) return nodes.effects[name]()
  return null
}
```

All nodes support serialization for persistence:
- `serializeOut(): INodeSerialization` - Export state
- `serializeIn(data): void` - Import state

---

## Data Flow & Event System

### Key Triggering (Keyboard → Audio)

```
User Presses Key
  ↓
Key.trigger() fires onTrigger Subject
  ↓
Synthesizer subscribes: key.onTrigger.subscribe(k => {...})
  ↓
Synthesizer.triggerAttack(note, time, channel)
  ↓
All tracks on that channel: track.triggerAttack(note, time)
  ↓
Track.instrument.triggerAttack(note with octaveOffset, time)
  ↓
Tone.js Instrument produces audio → Track.nodes (effects) → Track.volumeNode → Master Volume → Destination
```

### Sequencer Playback

```
Start Sequencer
  ↓
BeatMachine.scheduleNextBeat() waits for bar boundary
  ↓
Tone.Part created from sequence array
  ↓
Part scheduled to start at next beat
  ↓
For each note in sequence at its scheduled time:
  For each channel in sequencer.channels:
    Synthesizer.triggerAttackRelease(note, duration, time, channel)
      ↓ (similar to key flow above)
    Audio output
```

### RxJS Event Subjects

- `Synthesizer.onComponentsChange` - Track/sequencer list changes
- `Synthesizer.onRecordingStart / onRecordingEnd` - Recording lifecycle
- `Synthesizer.onAddNode / onRemoveNode` - Node modifications
- `Track.onDelete` - When track is removed
- `Node.onDelete` - When node is removed
- `PresetManager.onSavePreset / onRemovePreset` - Preset changes

---

## Session Management & Serialization

### Session Object

A "session" is a complete state snapshot:

```typescript
interface ISession {
  bpm: number
  volume: number
  octave: number
  channel: number
  tracks: ITrackSerialization[]
  sequencers: ISequencerSerialization[]
}
```

### Preset Manager

Persists sessions as "presets":

**Key Methods:**
- `savePreset(name)` - Save current session with a name
- `loadPreset(preset)` / `loadPresetFromName(name)` - Restore session
- `removePreset(name)` - Delete preset
- `getPresets()` - Get all presets

**Default Presets:**
Loaded from `/src/app/synthesizer/presets.ts` on startup.

### Serialization Pattern

All major components implement `ISerialize<T>`:

```typescript
interface ISerialize<TSerialization> {
  serializeOut(): TSerialization   // State → JSON
  serializeIn(data): void          // JSON → State
}
```

This pattern enables:
- Preset saving/loading
- Session restoration
- Undo/redo (future)

---

## UI Components Overview

Located in `/src/app/view/`:

| Component | Purpose |
|-----------|---------|
| **Synthesizer.component** | Main app shell |
| **Track.component** | Individual track UI |
| **Sequencer.component** | Sequencer/step editor |
| **Node.component** | Effect/instrument node UI |
| **Knob.component** | Rotary parameter control |
| **Key.component** | Visual keyboard |
| **Menu.component** | Main menu |
| **Settings.component** | App settings |
| **Oscilloscope.component** | Audio visualization |
| **Timeline.component** | Playback timeline |
| **DCMeter.component** | DC offset meter |
| **LevelMeter.component** | Volume meter |
| **Note.component** | Visual note representation |
| **Dropdown.component** | Selection dropdown |
| **Manual.component** | Help documentation |
| **WelcomeMenu.component** | Startup splash |
| **CustomWave.component** | Custom waveform editor |

---

## Core Services

### PresetManager (`/src/app/core/preset-manager.ts`)

Handles save/load of synthesizer sessions as presets. Manages preset lifecycle and merges default presets with user presets.

**Key Properties:**
- `presets: IPreset[]` - Array of all presets (default + user-saved)
- `onSavePreset: Subject<IPreset>` - Event when preset is saved
- `onRemovePreset: Subject<IPreset>` - Event when preset is deleted

**Key Methods:**
- `getPresets()` - Retrieve all presets (default + user)
- `savePreset(name)` - Save current session as preset
- `loadPreset(preset)` / `loadPresetFromName(name)` - Load preset and restore session
- `removePreset(name)` - Delete preset
- `setPresets(presets)` - Replace presets array (called during serializeIn)
- `reset()` - Clear all presets and reload defaults

**Preset Loading Flow (Fixed Feb 13, 2026):**

1. **Constructor:** Loads DEFAULT_PRESETS into presets array
   - This ensures default presets are always available
2. **Component Init:** `setPresets()` populates UI dropdown with current presets
3. **User Action:** `savePreset()` or `removePreset()` modifies presets array
4. **On Save:** `beforeunload` event → `Storage.save()` → saves entire session with all presets
5. **On Reload:**
   - Constructor loads DEFAULT_PRESETS again (starting state)
   - `Storage.load()` retrieves saved session
   - `serializeIn()` calls `setPresets(o.presets)` → merges user presets with defaults
   - Result: Both default and user presets are available

**Key Points:**
- Default presets always present as baseline
- User presets persist across sessions
- Deletions of any preset persist when saved
- localStorage stores complete preset list (default + user) as part of session

### MIDI Controller (`/src/app/core/midi.ts`)
Integrates WebMIDI API for MIDI keyboard/controller input.

### Storage (`/src/app/core/storage.ts`)
Persists presets and settings to browser storage.

### DB (`/src/app/core/db.ts`)
Manages internal database operations (if applicable).

### Definitions (`/src/app/core/definitions.ts`)
Constants and type definitions.

### Colors (`/src/app/core/colors.ts`)
Color scheme and theming.

---

## Global State (`globals.ts`)

The `G` class is a static global singleton holding:

- `synthesizer: Synthesizer` - Main synthesizer instance
- `isPlaying: boolean` - Transport state
- `w, h` - Window dimensions
- `osc: Vec2` - Oscilloscope data
- `debug: boolean` - Debug mode flag

**Key Methods:**
- `init()` - Initialize Tone.js and visuals
- `start()` - Start audio transport
- `saveVisuals()` - Export canvas visualizations

---

## Tone.js Integration Points

Key Tone.js objects used:

- **Tone.Volume** - Volume nodes (master, per-track)
- **Tone.Transport** - Playback timing
- **Tone.Part** - Sequencer event scheduler
- **Tone.Loop** - Recurring timing loops
- **Tone.Recorder** - Audio recording
- **Tone.Synth/etc** - Sound sources (instruments)
- **Tone.Frequency()** - Note parsing
- **Tone.getContext()** - Audio context management

---

## Questions for Clarity

1. **MIDI Support**: How is MIDI input handled? Is it just keyboard mapping or full MIDI controller support?

2. **Visualization**: What does p5.js visualize? (waveform, spectrum, animations?)

3. **Hold Mode Logic**: In PLAY mode, when user switches modes, are the held notes supposed to transition to HOLD? Or is manual interaction needed?

4. **Channels vs Tracks**: Are channels used for routing to different outputs, or are they for organizational purposes?

5. **Solo/Mute Behavior**: What's the expected behavior when all tracks are muted? (silence? unmute master?)

6. **Recording Format**: Is WebM the only export format, or are there others planned?

7. **Arpeggiator**: There's commented-out arpeggiator code in Synthesizer.ts - is this planned feature or deprecated?

---

## File Structure Quick Reference

```
src/app/
├── synthesizer/          # Core audio logic
│   ├── synthesizer.ts    # Main class
│   ├── track.ts          # Track class
│   ├── sequencer.ts      # Sequencer class
│   ├── beat-machine.ts   # Timing
│   ├── key.ts            # Keyboard key
│   ├── presets.ts        # Default presets
│   └── nodes/            # Instruments & effects
│       ├── node.ts
│       ├── source/       # Instruments
│       └── effects/      # Effects
├── view/                 # Angular components (UI)
├── core/                 # Services
│   ├── preset-manager.ts
│   ├── midi.ts
│   ├── storage.ts
│   └── ...
├── util/                 # Utilities
├── p5/                   # Visualizations (ignored in this doc)
├── app.component.ts      # Root component
├── globals.ts            # Global singleton
└── app.routes.ts         # Routing config
```

---

## Last Updated
- **Date**: Feb 13, 2026
- **Status**: Initial analysis complete, **Issue #1 FULLY FIXED AND TESTED** ✅
- **Complete Solution**:
  1. Uncommented `Storage.save()` (line 426) + fixed event name to `'window:beforeunload'` (line 423)
  2. Restored DEFAULT_PRESETS loading in PresetManager constructor
  3. Call `setPresets()` in SynthesizerComponent.ngAfterViewInit()
- **Result**: 
  - All data persists on page refresh
  - Default presets always available
  - User presets saved and restored correctly
  - See `issues.md` for complete investigation (5 revisions documented)
