#BUGS


getter values that are used by knobs are called constantly!! All of the nodes are used like that

Add enabled button for each track E M S 

Add button to stop all animations!!!
  including css transitions
  gifs
  visual?

Replace SVG animations with canvas stuff

clear sequencer button

knob lowest value is 0.1 attack

Make adsr release till endless

Removing samples is hard. Feeling is bad

UI not updating after adding/removing Effects

Sequencer.isPlaying is not Reactive when starting all 

Add track octave shift!

There are many places where for example serializeIn will overwrite the ToneJs Source or Effect instance without destroying the object correctly!

#Unfinished

add lil-gui for visual? Enable in settings?

open visuals in seperate window for beaming
gif animation lower opacity -> https://stackoverflow.com/questions/6890218/css-background-image-opacity

redo/undo not working soo well. Too many saves on knob change (debounce?)

upload file as sample and save in browser db

Volume vs Gain

Arpeggiator in Synth and per Track

Global Play / Stop button

Menu styling and text

Epilepsy warning on welcome

Save Menu Options in LocalStorage too
  Also save visual

Timeline line is not synced with Transport time

Keys are terrible

Make keybinding class?

Save Screen Shot

Midi access - Firefox

implement more synths, oscs and effects

Disable Visuals completly remove() in p5 sketch




#IDEAs

import export json to save presets

CHANNELS ARE BASICLY GROUPS? USE INDEX TO GROUP THEM VISUALLY?

- Add humanize knob

- Use Oscilloscope's frequency for visuals

- on disconnecting nodes or anything ramp down volume of affected track

- Enter fullscreen mode and disable all UI

- velocity knob?
- Midi has velocity

- Master track no instrument, but add effects before gain out
- Show ADSR 
- drum machine generator
  set: drum parts (hihat, snare etc) 
       random (aber im takt) or steady 4/4 8/8 2/4 etc or 16 bars triggering triggering
  Make sampler with predefined drums
       

- loop mode recording - set a loop length and start record and play. loop runns and playing will overdub. also make undo 


- Loop recordings?
- Add knob automation (startVal, endVal, curve, duration)

- upload presets to database? 


- Add different colors for different octaves (only for black keys?)
- hide keyboard
- Mode - random octaves on all keys (changes after pressed?)
- Pressing keys changes the color of the background/keys. Colors are chose by my synesthesia palette
- moodlight background ease smoothly between colors