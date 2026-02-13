import { Subject } from "rxjs"
import type { ISession, Synthesizer } from "../synthesizer/synthesizer"
import { DEFAULT_SESSION, DEFAULT_PRESETS } from "../synthesizer/presets"



export interface IPreset extends ISession {

    id: number
    name: string
}

export class PresetManager {

     /** All presets (defaults + user created) */
     private presets: IPreset[]
     
     /** Track which presets are from DEFAULT_PRESETS for filtering on save */
     private defaultPresetNames: Set<string>

     private synthesizer: Synthesizer

     private nextPresetID = 1000

     public readonly default: IPreset

     /** Emits whenever the preset list changes (save, delete, or load from storage) */
     public readonly presetsChanged = new Subject<void>()

     constructor(synthesizer: Synthesizer) {

          this.synthesizer = synthesizer
          this.presets = []
          this.defaultPresetNames = new Set()

          // Initialize default preset (uses negative ID to avoid collisions)
          // @ts-ignore - DEFAULT_SESSION type mismatch
          this.default = {
              id: -1,
              name: 'default',
              channel: 0,
              bpm: 120,
              ...DEFAULT_SESSION.currentSession
          }

          // Load default presets on initialization
          for(let p of DEFAULT_PRESETS) {
              this._addPreset(p)
              this.defaultPresetNames.add(p.name)
          }
      }

     /** Get all presets */
     getPresets() : IPreset[] { 
         return this.presets 
     }

     /** Get only user-created presets (for serialization to storage) */
     getUserPresets() : IPreset[] {
         return this.presets.filter(p => !this.defaultPresetNames.has(p.name))
     }

     /** Get preset by name */
     getPresetByName(name: string) : IPreset | null {

         return this.presets.find(p => p.name === name) || null
     }

     /** Save current session as a new preset */
     savePreset(name: string) : boolean {

          const existing = this.getPresetByName(name)

          const preset: IPreset = this.synthesizer.getSessionObject() as IPreset
          preset.id = this.nextPresetID++
          preset.name = name

          this.presets.push(preset)
          this.presetsChanged.next()

          return true
     }

     /** Check if a preset name is a default app preset */
     isDefaultPreset(name: string) : boolean {
         return this.defaultPresetNames.has(name)
     }

     /** Overwrite an existing preset (used for user confirmation) */
     overwritePreset(name: string) : boolean {
         
         const index = this.presets.findIndex(p => p.name === name)
         if(index === -1) return false
         
         const preset: IPreset = this.synthesizer.getSessionObject() as IPreset
         preset.id = this.presets[index].id
         preset.name = name
         
         this.presets[index] = preset
         this.presetsChanged.next()
         
         return true
     }

     /** Add an existing preset (used during deserialization) */
     private _addPreset(preset: IPreset) : void {

          if(this.getPresetByName(preset.name)) {
              console.debug(`Preset "${preset.name}" already exists, skipping`)
              return
          }

          // Track highest ID to avoid collisions
          if(preset.id >= this.nextPresetID) {
              this.nextPresetID = preset.id + 1
          }

          this.presets.push(preset)
     }

     /** Load a preset by name and restore synthesizer state */
     loadPreset(name: string) : boolean {

         const preset = this.getPresetByName(name)

         if(!preset) {
             console.warn(`Preset "${name}" not found`)
             return false
         }

         this.synthesizer.releaseNotes()
         this.synthesizer.stopSequencers()

         // Load session without triggering serializeIn (doesn't change preset list)
         this.synthesizer.loadSessionObject(preset)

         return true
     }

     /** Delete a preset by name */
     removePreset(name: string) : boolean {

          const index = this.presets.findIndex(p => p.name === name)

          if(index === -1) {
              console.warn(`Preset "${name}" not found`)
              return false
          }

          this.presets.splice(index, 1)
          this.presetsChanged.next()

          return true
      }

     /** Replace all presets (used during deserialization from storage) */
     setPresets(loadedPresets: IPreset[]) : void {

         // Start fresh with defaults
         this.presets = [...DEFAULT_PRESETS.map(p => ({...p}))]

         // Add loaded presets, overwriting defaults with same name
         const overwrittenPresets: string[] = []
         for(let p of loadedPresets) {
             const defaultIndex = this.presets.findIndex(dp => dp.name === p.name && this.defaultPresetNames.has(dp.name))
             
             if(defaultIndex !== -1) {
                 // Overwrite default preset with loaded version
                 this.presets[defaultIndex] = p
                 overwrittenPresets.push(p.name)
                 console.warn(`Overwriting default preset "${p.name}" with saved version`)
             } else {
                 this._addPreset(p)
             }
         }

         // Alert user if defaults were overwritten
         if(overwrittenPresets.length > 0) {
             console.warn(`⚠️ Restored custom versions of these app presets: ${overwrittenPresets.join(', ')}`)
         }

         // Update ID tracker
         for(let p of loadedPresets) {
             if(p.id >= this.nextPresetID) {
                 this.nextPresetID = p.id + 1
             }
         }

         this.presetsChanged.next()
     }

     /** Reset to default presets only */
     reset() : void {

          this.presets.length = 0
          this.nextPresetID = 1000
          
          for(let p of DEFAULT_PRESETS) this._addPreset(p)
          this.presetsChanged.next()
      }
     }
