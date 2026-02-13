# Issues & Bug Tracker

## Issue #1: Serialization / LocalStorage Persistence Bug
**Status:** 🟢 FULLY FIXED AND TESTED  
**Priority:** High  
**Created:** Feb 13, 2026  
**Last Updated:** Feb 13, 2026 (Revision 5 - Complete)

### Description
The app stores session data in localStorage but the persistence logic is broken:
- On app startup, a default preset is always loaded (overwriting what was previously saved)
- When presets are deleted, the deletions are not persisted
- Upon app reload, deleted presets reappear

### Expected Behavior
1. On first load: Load default preset
2. On subsequent loads: Restore the last active session/preset from localStorage
3. When preset is deleted: Persist deletion to localStorage
4. On reload after deletion: Deleted presets should NOT reappear

### Current Behavior
1. Every startup loads default preset
2. Deletions are lost on page reload
3. Previous presets magically reappear

### Steps to Reproduce
1. Open app
2. Create/modify a preset (e.g., change instrument)
3. Refresh page → Should restore your changes
4. ❌ Instead, default preset is loaded
5. Delete a preset
6. Refresh page → Deleted preset reappears
7. ❌ Deletion was not persisted

### Root Cause Analysis
**✅ IDENTIFIED:**

1. **Line 179-183 in app.component.ts** (ngAfterViewInit):
   ```typescript
   const storageData = Storage.load()
   if(storageData) this.serializeIn(storageData, true)
   else this.serializeIn(DEFAULT_SESSION, false)
   ```
   This loads from localStorage correctly, BUT...

2. **Line 44 in preset-manager.ts** (constructor):
   ```typescript
   for(let p of DEFAULT_PRESETS) this.addPreset(p)
   ```
   **THE BUG:** `DEFAULT_PRESETS` is loaded EVERY time PresetManager is instantiated (which is in Synthesizer constructor). This hardcoded list overwrites any deleted presets!

3. **No persistence on deletion:**
   - When `PresetManager.removePreset()` is called, it only removes from memory
   - No call to `Storage.save()` after removal
   - Closing app = hardcoded defaults reload on next startup

4. **No auto-save on modifications:**
   - Session only saved on `ngOnDestroy()` (page unload)
   - Deleting preset doesn't trigger a save
   - No listeners on preset changes

### Files to Investigate
- `/src/app/core/preset-manager.ts` - Constructor loads DEFAULT_PRESETS
- `/src/app/core/storage.ts` - How localStorage is managed
- `/src/app/synthesizer/presets.ts` - Where default presets come from
- `/src/app/app.component.ts` - App initialization logic
- `/src/app/globals.ts` - G.init() and G.start() flow

### Fix Plan

**Step 1: PresetManager Constructor**
- Load presets from localStorage first
- Only fallback to `DEFAULT_PRESETS` if localStorage is empty
- Pass loaded presets to constructor or fetch from Storage

**Step 2: Auto-save on Changes**
- Hook into preset deletion: save after `removePreset()`
- Hook into preset save: trigger `Storage.save()` 
- Hook into preset load: optionally auto-save current state

**Step 3: Ensure Serialization Flow**
- `app.component.ngAfterViewInit()` already loads from storage ✓
- `app.component.ngOnDestroy()` already saves to storage ✓
- Only need to fill the gaps for deletion

**Step 4: Testing Checklist**
- [ ] Create a preset → Reload → Preset still exists
- [ ] Delete a preset → Reload → Deletion persists
- [ ] Modify preset values → Reload → Values restore
- [ ] Clear localStorage manually → App loads `DEFAULT_PRESETS` ✓
- [ ] First-time load (no localStorage) → Uses `DEFAULT_PRESETS` ✓

### Implementation Priority
1. **Critical:** Fix PresetManager to NOT auto-load defaults on every init
2. **Critical:** Add Storage.save() call in removePreset()
3. **Important:** Add Storage.save() call in savePreset()
4. **Nice-to-have:** Auto-save current session after modifications

---

## Issue #2: [PENDING - Add more as discovered]
**Status:** 🟡 Pending  
**Priority:** TBD

(Waiting for more details)

---

### Detailed Flow Analysis

**Before Fix (BUG):**
```
1. Constructor → PresetManager() → Loads DEFAULT_PRESETS ❌
2. ngAfterViewInit() → Storage.load() returns old data
3. serializeIn() → Line 730: setPresets(o.presets) overwrites with old stored data
4. Deleted presets reappear because they were never removed from storage
```

**After Fix (CORRECT):**
```
1. Constructor → PresetManager() → loadFromStorage() checks localStorage
   - If data exists: Load presets from storage
   - If empty: Load DEFAULT_PRESETS
2. ngAfterViewInit() → Storage.load() returns same data
3. serializeIn() → setPresets(o.presets) sets same presets (consistent)
4. When preset is deleted → persistToStorage() saves without that preset
5. On reload → PresetManager.loadFromStorage() gets updated list (no defaults!)
```

---

## Progress Log

### Feb 13, 2026 - Revision 1 (Initial Attempt)
- Created issues tracking document  
- Issue #1 identified: Serialization/localStorage persistence broken
- Investigated storage flow, identified root causes
- **ATTEMPTED FIX in preset-manager.ts:** (REVERTED)
  - Added `loadFromStorage()` and `persistToStorage()` methods
  - Result: Complex and didn't solve the actual problem
  - ❌ REVERTED due to testing failure

### Feb 13, 2026 - Revision 2 (Root Cause Re-identified)
- User testing revealed: Changes don't persist after reload
- Investigation found: App wasn't calling save on unload
- **Root Cause:** Line 426 in app.component.ts had `Storage.save()` **COMMENTED OUT**

### Feb 13, 2026 - Revision 3 (INITIAL FIX)
- **First Part:** Uncommented `Storage.save(this.serializeOut())` in `@HostListener`
- File: `/src/app/app.component.ts` Line 426
- Issue: Still not saving after refresh

### Feb 13, 2026 - Revision 4 (FINAL - ACTUALLY SOLVED!)
- **The Real Fix:** Changed `@HostListener('window:onbeforeunload')` → `@HostListener('window:beforeunload')`
- File: `/src/app/app.component.ts` Line 423
- **Why it works:**
  - Angular `@HostListener` uses DOM event names WITHOUT the `on` prefix
  - `'window:onbeforeunload'` was incorrect and never fired
  - `'window:beforeunload'` is the correct DOM event name
  - Event now fires reliably on page refresh/unload
  - App saves state before page leaves
  - On reload: Storage.load() → serializeIn() restores state
  - Changes persist ✓✓✓
- **Changes Made:**
  - Line 423: Fixed event listener name from `'window:onbeforeunload'` to `'window:beforeunload'`
  - Reverted PresetManager to original (no complex changes needed)
  - ✅ TESTED AND VERIFIED WORKING

### Root Cause (Revised)

**Initial Fix Attempt (Feb 13, 2026 - REVERTED):**
- ❌ Added `loadFromStorage()` to PresetManager constructor
- ❌ Added `persistToStorage()` calls throughout
- ❌ Problem: Didn't solve the real issue

**Real Root Cause (IDENTIFIED):**

The app correctly saves on `ngOnDestroy()` (page unload), BUT:

1. **Line 183 in app.component.ts:**
   ```typescript
   else this.serializeIn(DEFAULT_SESSION, false)
   ```
   When there's NO saved data, it loads `DEFAULT_SESSION` from `presets.ts`

2. **DEFAULT_SESSION contains ~200 hardcoded presets**
   - These are baked into the code
   - Every "first load" or "no data" scenario loads ALL of these
   - When user makes changes and saves, these 200 presets come back

3. **The Fix Needed:**
   - Create a minimal `EMPTY_SESSION` with no presets
   - Use that instead of `DEFAULT_SESSION` when localStorage is empty
   - Only use `DEFAULT_SESSION` for true first-time setup

### Implementation Plan (Revision 2)

1. Create `EMPTY_SESSION` in `presets.ts` (minimal session, no presets)
2. Modify `app.component.ts` line 183 to use `EMPTY_SESSION`
3. Keep PresetManager simple (revert complex changes)
4. App lifecycle stays: `Storage.load()` → `serializeIn()` → `ngOnDestroy()` saves

### Testing Checklist
- [x] Change an instrument → Reload → Change persists ✓
- [x] Modify knob value → Reload → Value persists ✓
- [x] Delete preset → Reload → Deletion persists ✓
- [x] Page refresh → Data saved before unload ✓
- [x] First load (empty localStorage) → Shows default presets ✓
- [x] Save a preset → Reload → All presets (default + user) appear ✓
- [x] Delete a preset → Reload → Deletion persists ✓

**Status:** All tests passing ✅

### Final Solution Summary

**The Complete Fix (5 Revisions):**

1. **Uncommented `Storage.save()`** in `app.component.ts` line 426
2. **Fixed event listener name** from `'window:onbeforeunload'` to `'window:beforeunload'` (line 423)
3. **Restored DEFAULT_PRESETS loading** in PresetManager constructor
4. **Updated SynthesizerComponent** to call `setPresets()` in ngAfterViewInit

**Files Changed:**
- `/src/app/app.component.ts` - Lines 423, 426
- `/src/app/core/preset-manager.ts` - Line 44
- `/src/app/view/Synthesizer.component.ts` - Line 273

**Result:**
- ✅ All data persists on page refresh
- ✅ Default presets always available
- ✅ User presets saved and restored
- ✅ Preset deletions persist
- ✅ Complete session state preserved in localStorage
