// @ts-nocheck

import type { IPreset } from "../core/preset-manager"


export const DEFAULT_SESSION = {
  "presets": [],
  "currentSession": {
    "bpm": 120,
    "volume": -10.874444444444421,
    "octave": 2,
    "channel": 0,
    "tracks": [
      {
        "enabled": true,
        "index": 0,
        "octaveOffset": 1,
        "channel": 0,
        "volume": 5.978888888888889,
        "instrument": {
          "name": "Oscillator",
          "enabled": true,
          "collapsed": false,
          "volume": 0.4,
          "detune": 0,
          "phase": 0,
          "wave": "sine",
          "wavePartial": "",
          "attack": 0.01,
          "decay": 0.1,
          "sustain": 0.5,
          "release": 1
        },
        "nodes": [],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "F#2",
            "A#2",
            "D#3",
            "F#3",
            "F3"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      },
      {
        "enabled": true,
        "index": 1,
        "octaveOffset": 0,
        "channel": 0,
        "volume": 4.332222222222228,
        "instrument": {
          "name": "Oscillator",
          "enabled": true,
          "collapsed": false,
          "volume": 0.4,
          "detune": 0,
          "phase": 0,
          "wave": "triangle",
          "wavePartial": "",
          "attack": 0.01,
          "decay": 0.1,
          "sustain": 0.5,
          "release": 1
        },
        "nodes": [
          {
            "name": "Distortion",
            "enabled": true,
            "collapsed": false,
            "wet": 1,
            "gain": 0.5
          }
        ],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "F#1",
            "A#1",
            "D#2",
            "F#2",
            "F2"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      },
      {
        "enabled": true,
        "index": 2,
        "octaveOffset": -1,
        "channel": 0,
        "volume": -7.004444444444452,
        "instrument": {
          "name": "Sampler",
          "enabled": true,
          "collapsed": false,
          "volume": 0,
          "sample": "Kick1"
        },
        "nodes": [
          {
            "name": "Delay",
            "enabled": true,
            "collapsed": false,
            "wet": 1,
            "delayTime": 0.12,
            "feedback": 0.8
          }
        ],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "F#0",
            "A#0",
            "D#1",
            "F#1",
            "F1"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      },
      {
        "enabled": true,
        "index": 3,
        "octaveOffset": 0,
        "channel": 0,
        "volume": 3.0866666666666656,
        "instrument": {
          "name": "Synth",
          "enabled": true,
          "collapsed": false,
          "volume": 3,
          "detune": 0.5,
          "attack": 0.005,
          "attackCurve": "linear",
          "decay": 0.1,
          "decayCurve": "exponential",
          "release": 1,
          "releaseCurve": "exponential",
          "sustain": 0.3,
          "partialCount": 0,
          "partials": [],
          "phase": 0,
          "type": "triangle",
          "portamento": 0
        },
        "nodes": [
          {
            "name": "Vibrato",
            "enabled": true,
            "collapsed": false,
            "wet": 1,
            "depth": 0.1,
            "maxDelay": 0.005,
            "wave": "sine",
            "wavePartial": "",
            "frequency": 5
          }
        ],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "F#1",
            "A#1",
            "D#2",
            "F#2",
            "F2"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      },
      {
        "enabled": true,
        "index": 4,
        "octaveOffset": 0,
        "channel": 0,
        "volume": 2.9744444444444373,
        "instrument": {
          "name": "AMSynth",
          "enabled": true,
          "collapsed": false,
          "volume": 1,
          "detune": 0,
          "portamento": 0,
          "harmonicity": 3,
          "phase": 0,
          "attack": 0.01,
          "decay": 0.01,
          "sustain": 1,
          "release": 0.5
        },
        "nodes": [],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "F#1",
            "A#1",
            "D#2",
            "F#2",
            "F2"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      },
      {
        "enabled": true,
        "index": 5,
        "octaveOffset": 0,
        "channel": 0,
        "volume": -6.715555555555748,
        "instrument": {
          "name": "DuoSynth",
          "enabled": true,
          "collapsed": false,
          "volume": 0.21999999999999975,
          "detune": 1,
          "harmonicity": 1,
          "portamento": 0,
          "vibratoAmount": 0.13611111111111182,
          "vibratoRate": 1,
          "attack0": 0.01,
          "decay0": 0,
          "release0": 0.5,
          "sustain0": 1,
          "attack1": 0.01,
          "decay1": 0,
          "release1": 0.5,
          "sustain1": 1
        },
        "nodes": [
          {
            "name": "Delay",
            "enabled": true,
            "collapsed": false,
            "wet": 0,
            "delayTime": 0.12944444444444583,
            "feedback": 0.7227777777777771
          }
        ],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "F#1",
            "A#1",
            "D#2",
            "F#2",
            "F2"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      },
      {
        "enabled": true,
        "index": 6,
        "octaveOffset": 1,
        "channel": 0,
        "volume": 5.134444444444448,
        "instrument": {
          "name": "FMSynth",
          "enabled": true,
          "collapsed": false,
          "volume": 0.5,
          "detune": 0.5,
          "portamento": 0,
          "harmonicity": 3,
          "phase": 0,
          "attack": 0.01,
          "decay": 0.01,
          "sustain": 1,
          "release": 0.5
        },
        "nodes": [],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "F#2",
            "A#2",
            "D#3",
            "F#3",
            "F3"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      },
      {
        "enabled": true,
        "index": 7,
        "octaveOffset": 0,
        "channel": 15,
        "volume": 2.9322222222222236,
        "instrument": {
          "name": "Sampler",
          "enabled": true,
          "collapsed": false,
          "volume": 0.5,
          "sample": "Kick3"
        },
        "nodes": [],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "A1",
            "F3"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      },
      {
        "enabled": true,
        "index": 8,
        "octaveOffset": 0,
        "channel": 14,
        "volume": 1.4333333333333365,
        "instrument": {
          "name": "Sampler",
          "enabled": true,
          "collapsed": false,
          "volume": 0.5,
          "sample": "Snare6"
        },
        "nodes": [
          {
            "name": "Distortion",
            "enabled": true,
            "collapsed": false,
            "wet": 0.8405555555555548,
            "gain": 0.5030555555555545
          },
          {
            "name": "Delay",
            "enabled": true,
            "collapsed": false,
            "wet": 0.5830555555555552,
            "delayTime": 0.3844444444444451,
            "feedback": 0.3925000000000005
          }
        ],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "A#3",
            "C3",
            "B2",
            "G#3",
            "G#2",
            "F#2",
            "G2",
            "F2"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      },
      {
        "enabled": true,
        "index": 9,
        "octaveOffset": 0,
        "channel": 13,
        "volume": -2.9999999999999716,
        "instrument": {
          "name": "Sampler",
          "enabled": true,
          "collapsed": false,
          "volume": 0.5,
          "sample": "Hihat2"
        },
        "nodes": [
          {
            "name": "Distortion",
            "enabled": true,
            "collapsed": false,
            "wet": 0.9302777777777778,
            "gain": 1
          }
        ],
        "soloEnabled": false,
        "hold": {
          "enabled": "OFF",
          "activeKeys": [
            "F3",
            "A2",
            "G2"
          ]
        },
        "isMuted": false,
        "isCollapsed": false
      }
    ],
    "sequencers": [
      {
        "index": 7,
        "channel": [
          0
        ],
        "sequence": [
          {
            "id": 0,
            "note": "F#1",
            "time": 0,
            "length": 0.124,
            "velocity": 1
          },
          {
            "id": 1,
            "note": "A#1",
            "time": 0.124,
            "length": "16n",
            "velocity": 1
          },
          {
            "id": 2,
            "note": "D#2",
            "time": 0.25,
            "length": "16n",
            "velocity": 1
          },
          {
            "id": 3,
            "note": "F#2",
            "time": 0.375,
            "length": "16n",
            "velocity": 1
          },
          {
            "id": 4,
            "note": "D#2",
            "time": 0.5,
            "length": "16n",
            "velocity": 1
          },
          {
            "id": 5,
            "note": "A#1",
            "time": 0.625,
            "length": "16n",
            "velocity": 1
          },
          {
            "id": 6,
            "note": "F#1",
            "time": 0.751,
            "length": "16n",
            "velocity": 1
          }
        ],
        "humanize": false,
        "bars": 1,
        "noteLength": "1/16"
      },
      {
        "index": 9,
        "channel": [
          15
        ],
        "sequence": [
          {
            "id": 0,
            "note": "A1",
            "time": 0,
            "length": 0.126,
            "velocity": 1
          },
          {
            "id": 1,
            "note": "A1",
            "time": 0.061,
            "length": 0.125,
            "velocity": 1
          },
          {
            "id": 2,
            "note": "F3",
            "time": 0.249,
            "length": "4n",
            "velocity": 1
          }
        ],
        "humanize": false,
        "bars": 1,
        "noteLength": "1/16"
      },
      {
        "index": 11,
        "channel": [
          14
        ],
        "sequence": [
          {
            "id": 0,
            "note": "F2",
            "time": 1.5,
            "length": "8n",
            "velocity": 1
          },
          {
            "id": 1,
            "note": "A#3",
            "time": 0,
            "length": "16n",
            "velocity": 1
          },
          {
            "id": 2,
            "note": "C3",
            "time": 0.126,
            "length": 0.14300000000000002,
            "velocity": 1
          },
          {
            "id": 3,
            "note": "A#3",
            "time": 0.25,
            "length": "16n",
            "velocity": 1
          },
          {
            "id": 4,
            "note": "B2",
            "time": 0.495,
            "length": "16n",
            "velocity": 1
          },
          {
            "id": 5,
            "note": "G#2",
            "time": 0.811,
            "length": "32n",
            "velocity": 1
          },
          {
            "id": 6,
            "note": "F#2",
            "time": 0.873,
            "length": 0.11699999999999999,
            "velocity": 1
          },
          {
            "id": 7,
            "note": "G#3",
            "time": 0.749,
            "length": "32n",
            "velocity": 1
          },
          {
            "id": 8,
            "note": "G2",
            "time": 0.999,
            "length": 0.03950000000000009,
            "velocity": 1
          }
        ],
        "humanize": false,
        "bars": 2,
        "noteLength": "1/16"
      },
      {
        "index": 13,
        "channel": [
          13
        ],
        "sequence": [
          {
            "id": 0,
            "note": "A2",
            "time": 0.249,
            "length": 0.126,
            "velocity": 1
          },
          {
            "id": 1,
            "note": "F2",
            "time": 0.499,
            "length": 0.124,
            "velocity": 1
          },
          {
            "id": 2,
            "note": "F3",
            "time": 0,
            "length": 0.124,
            "velocity": 1
          },
          {
            "id": 4,
            "note": "G2",
            "time": 0.756,
            "length": 0.244,
            "velocity": 1
          }
        ],
        "humanize": false,
        "bars": 1,
        "noteLength": "1/16"
      }
    ]
  }
}

// {

//     presets: [],
//     currentSession: {
//         "bpm": 120,
//         "volume": 0.49999999999999994,
//         "octave": 1,
//         "channel": 0,
//         "tracks": [
//           {
//             "enabled": true,
//             "index": 0,
//             "channel": 0,
//             "volume": -3,
//             "instrument": {
//               "name": "Oscillator",
//               "enabled": true,
//               "collapsed": false,
//               "detune": 0,
//               "phase": 0,
//               "wave": "sine",
//               "wavePartial": "",
//               "attack": 0.01,
//               "decay": 0.1,
//               "sustain": 0.5,
//               "release": 1
//             },
//             "nodes": [],
//             "soloEnabled": false,
//             "hold": {
//               "enabled": "OFF",
//               "activeKeys": []
//             },
//             "isMuted": false,
//             "isCollapsed": false
//           },
//           {
//             "enabled": true,
//             "index": 1,
//             "channel": 0,
//             "volume": -3,
//             "instrument": {
//               "name": "Oscillator",
//               "enabled": true,
//               "collapsed": false,
//               "detune": 0,
//               "phase": 0,
//               "wave": "triangle",
//               "wavePartial": "",
//               "attack": 0.01,
//               "decay": 0.1,
//               "sustain": 0.5,
//               "release": 1
//             },
//             "nodes": [
//               {
//                 "name": "Distortion",
//                 "enabled": true,
//                 "collapsed": false,
//                 "wet": 1,
//                 "gain": 0.5
//               }
//             ],
//             "soloEnabled": false,
//             "hold": {
//               "enabled": "OFF",
//               "activeKeys": []
//             },
//             "isMuted": false,
//             "isCollapsed": false
//           },
//           {
//             "enabled": true,
//             "index": 2,
//             "channel": 0,
//             "volume": -3,
//             "instrument": {
//               "name": "Sampler",
//               "enabled": true,
//               "collapsed": false,
//               "volume": 0,
//               "sample": "Sweep Fm7"
//             },
//             "nodes": [
//               {
//                 "name": "Delay",
//                 "enabled": true,
//                 "collapsed": false,
//                 "wet": 1,
//                 "delayTime": 0.12,
//                 "feedback": 0.8
//               }
//             ],
//             "soloEnabled": false,
//             "hold": {
//               "enabled": "OFF",
//               "activeKeys": []
//             },
//             "isMuted": false,
//             "isCollapsed": false
//           },
//           {
//             "enabled": true,
//             "index": 3,
//             "channel": 0,
//             "volume": -3,
//             "instrument": {
//               "name": "Synth",
//               "enabled": true,
//               "collapsed": false,
//               "volume": 3,
//               "detune": 0.5,
//               "attack": 0.005,
//               "attackCurve": "linear",
//               "decay": 0.1,
//               "decayCurve": "exponential",
//               "release": 1,
//               "releaseCurve": "exponential",
//               "sustain": 0.3,
//               "partialCount": 0,
//               "partials": [],
//               "phase": 0,
//               "type": "triangle",
//               "portamento": 0
//             },
//             "nodes": [
//               {
//                 "name": "Vibrato",
//                 "enabled": true,
//                 "collapsed": false,
//                 "wet": 1,
//                 "depth": 0.1,
//                 "maxDelay": 0.005,
//                 "wave": "sine",
//                 "wavePartial": "",
//                 "frequency": 5
//               }
//             ],
//             "soloEnabled": false,
//             "hold": {
//               "enabled": "OFF",
//               "activeKeys": []
//             },
//             "isMuted": false,
//             "isCollapsed": false
//           },
//           {
//             "enabled": true,
//             "index": 4,
//             "channel": 0,
//             "volume": -3,
//             "instrument": {
//               "name": "AMSynth",
//               "enabled": true,
//               "collapsed": false,
//               "volume": 1,
//               "detune": 0,
//               "portamento": 0,
//               "harmonicity": 3,
//               "phase": 0,
//               "attack": 0.01,
//               "decay": 0.01,
//               "sustain": 1,
//               "release": 0.5
//             },
//             "nodes": [],
//             "soloEnabled": false,
//             "hold": {
//               "enabled": "OFF",
//               "activeKeys": []
//             },
//             "isMuted": false,
//             "isCollapsed": false
//           },
//           {
//             "enabled": true,
//             "index": 5,
//             "channel": 0,
//             "volume": -16.511111111111255,
//             "instrument": {
//               "name": "DuoSynth",
//               "enabled": true,
//               "collapsed": false,
//               "volume": 0.21999999999999975,
//               "detune": 1,
//               "harmonicity": 1,
//               "portamento": 0,
//               "vibratoAmount": 0.45,
//               "vibratoRate": 1,
//               "attack0": 0.01,
//               "decay0": 0,
//               "release0": 0.5,
//               "sustain0": 1,
//               "attack1": 0.01,
//               "decay1": 0,
//               "release1": 0.5,
//               "sustain1": 1
//             },
//             "nodes": [],
//             "soloEnabled": false,
//             "hold": {
//               "enabled": "OFF",
//               "activeKeys": []
//             },
//             "isMuted": false,
//             "isCollapsed": false
//           }
//         ],
//         "sequencers": []
//       }


    // currentSession: {

    //     bpm: 120,
    //     volume: 1,
    //     octave: 2,
    //     channel: 0,
    //     tracks: [
    //         {
    //             muted: false,
    //             channel: 0,
    //             instrument: {
    //                 name: "DuoSynth",
    //                 enabled: true,
    //                 volume: 0.5,
    //                 detune: 0,
    //                 harmonicity: 1,
    //                 portamento: 0,
    //                 vibratoAmount: 0.5,
    //                 vibratoRate: 5,
    //                 attack0: 2.96,
    //                 decay0: 0,
    //                 release0: 0.5,
    //                 sustain0: 1,
    //                 attack1: 0,
    //                 decay1: 0,
    //                 release1: 0.1600000000000001,
    //                 sustain1: 0.6300000000000001
    //             },
    //             nodes: [
    //                 {
    //                     name: "Delay",
    //                     enabled: true,
    //                     wet: 1,
    //                     delayTime: 0,
    //                     feedback: 0.8200000000000001
    //                 },
    //                 {
    //                     name: "Tremolo",
    //                     enabled: true,
    //                     wet: 0,
    //                     frequency: 87.34000000000009,
    //                     depth: 0.04
    //                 }
    //             ],
    //             volume: -3
    //         },
    //         {
    //             channel: 0,
    //             muted: false,
    //             instrument: {
    //                 name: "FMSynth",
    //                 enabled: true,
    //                 volume: 3,
    //                 detune: 0.5,
    //                 portamento: 0,
    //                 harmonicity: 3,
    //                 phase: 0,
    //                 attack: 0.01,
    //                 decay: 0.01,
    //                 sustain: 1,
    //                 release: 0.5
    //             },
    //             nodes: [],
    //             volume: -3
    //         },
    //         {
    //             channel: 0,
    //             muted: false,
    //             instrument: {
    //                 name: "Oscillator",
    //                 enabled: true,
    //                 detune: 0,
    //                 phase: 0,
    //                 wave: "sine",
    //                 wavePartial: "",
    //                 attack: 0.01,
    //                 decay: 0.1,
    //                 sustain: 0.5,
    //                 release: 1
    //             },
    //             nodes: [],
    //             volume: -3
    //         }
    //     ]
    // }


export const DEFAULT_PRESETS: IPreset[] = 

  [
    {
        "bpm": 120,
        "volume": -10.874444444444421,
        "octave": 2,
        "channel": 0,
        "tracks": [
            {
                "enabled": true,
                "index": 0,
                "octaveOffset": 1,
                "channel": 0,
                "volume": 5.978888888888889,
                "instrument": {
                    "name": "Oscillator",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 0.4,
                    "detune": 0,
                    "phase": 0,
                    "wave": "sine",
                    "wavePartial": "",
                    "attack": 0.01,
                    "decay": 0.1,
                    "sustain": 0.5,
                    "release": 1
                },
                "nodes": [],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "F#2"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            },
            {
                "enabled": true,
                "index": 1,
                "octaveOffset": 0,
                "channel": 0,
                "volume": 4.332222222222228,
                "instrument": {
                    "name": "Oscillator",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 0.4,
                    "detune": 0,
                    "phase": 0,
                    "wave": "triangle",
                    "wavePartial": "",
                    "attack": 0.01,
                    "decay": 0.1,
                    "sustain": 0.5,
                    "release": 1
                },
                "nodes": [
                    {
                        "name": "Distortion",
                        "enabled": true,
                        "collapsed": false,
                        "wet": 1,
                        "gain": 0.5
                    }
                ],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "F#1"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            },
            {
                "enabled": true,
                "index": 2,
                "octaveOffset": -1,
                "channel": 0,
                "volume": -7.004444444444452,
                "instrument": {
                    "name": "Sampler",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 0,
                    "sample": "Kick1"
                },
                "nodes": [
                    {
                        "name": "Delay",
                        "enabled": true,
                        "collapsed": false,
                        "wet": 1,
                        "delayTime": 0.12,
                        "feedback": 0.8
                    }
                ],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "F#0"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            },
            {
                "enabled": true,
                "index": 3,
                "octaveOffset": 0,
                "channel": 0,
                "volume": 3.0866666666666656,
                "instrument": {
                    "name": "Synth",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 3,
                    "detune": 0.5,
                    "attack": 0.005,
                    "attackCurve": "linear",
                    "decay": 0.1,
                    "decayCurve": "exponential",
                    "release": 1,
                    "releaseCurve": "exponential",
                    "sustain": 0.3,
                    "partialCount": 0,
                    "partials": [],
                    "phase": 0,
                    "type": "triangle",
                    "portamento": 0
                },
                "nodes": [
                    {
                        "name": "Vibrato",
                        "enabled": true,
                        "collapsed": false,
                        "wet": 1,
                        "depth": 0.1,
                        "maxDelay": 0.005,
                        "wave": "sine",
                        "wavePartial": "",
                        "frequency": 5
                    }
                ],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "A#1",
                        "D#2",
                        "F#2",
                        "F#1"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            },
            {
                "enabled": true,
                "index": 4,
                "octaveOffset": 0,
                "channel": 0,
                "volume": 2.9744444444444373,
                "instrument": {
                    "name": "AMSynth",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 1,
                    "detune": 0,
                    "portamento": 0,
                    "harmonicity": 3,
                    "phase": 0,
                    "attack": 0.01,
                    "decay": 0.01,
                    "sustain": 1,
                    "release": 0.5
                },
                "nodes": [],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "A#1",
                        "D#2",
                        "F#2",
                        "F#1"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            },
            {
                "enabled": true,
                "index": 5,
                "octaveOffset": 0,
                "channel": 0,
                "volume": -6.715555555555748,
                "instrument": {
                    "name": "DuoSynth",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 0.21999999999999975,
                    "detune": 1,
                    "harmonicity": 1,
                    "portamento": 0,
                    "vibratoAmount": 0.13611111111111182,
                    "vibratoRate": 1,
                    "attack0": 0.01,
                    "decay0": 0,
                    "release0": 0.5,
                    "sustain0": 1,
                    "attack1": 0.01,
                    "decay1": 0,
                    "release1": 0.5,
                    "sustain1": 1
                },
                "nodes": [
                    {
                        "name": "Delay",
                        "enabled": true,
                        "collapsed": false,
                        "wet": 0,
                        "delayTime": 0.12944444444444583,
                        "feedback": 0.7227777777777771
                    }
                ],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "A#1",
                        "D#2",
                        "F#2",
                        "F#1"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            },
            {
                "enabled": true,
                "index": 6,
                "octaveOffset": 1,
                "channel": 0,
                "volume": 5.134444444444448,
                "instrument": {
                    "name": "FMSynth",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 0.5,
                    "detune": 0.5,
                    "portamento": 0,
                    "harmonicity": 3,
                    "phase": 0,
                    "attack": 0.01,
                    "decay": 0.01,
                    "sustain": 1,
                    "release": 0.5
                },
                "nodes": [],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "A#2",
                        "D#3",
                        "F#3",
                        "F#2"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            },
            {
                "enabled": true,
                "index": 7,
                "octaveOffset": 0,
                "channel": 15,
                "volume": 2.9322222222222236,
                "instrument": {
                    "name": "Sampler",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 0.5,
                    "sample": "Kick3"
                },
                "nodes": [],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "F3"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            },
            {
                "enabled": true,
                "index": 8,
                "octaveOffset": 0,
                "channel": 14,
                "volume": 1.4333333333333365,
                "instrument": {
                    "name": "Sampler",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 0.5,
                    "sample": "Snare6"
                },
                "nodes": [
                    {
                        "name": "Distortion",
                        "enabled": true,
                        "collapsed": false,
                        "wet": 0.8405555555555548,
                        "gain": 0.5030555555555545
                    },
                    {
                        "name": "Delay",
                        "enabled": true,
                        "collapsed": false,
                        "wet": 0.5830555555555552,
                        "delayTime": 0.3844444444444451,
                        "feedback": 0.3925000000000005
                    }
                ],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "G#2"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            },
            {
                "enabled": true,
                "index": 9,
                "octaveOffset": 0,
                "channel": 13,
                "volume": -2.9999999999999716,
                "instrument": {
                    "name": "Sampler",
                    "enabled": true,
                    "collapsed": false,
                    "volume": 0.5,
                    "sample": "Hihat2"
                },
                "nodes": [
                    {
                        "name": "Distortion",
                        "enabled": true,
                        "collapsed": false,
                        "wet": 0.9302777777777778,
                        "gain": 1
                    }
                ],
                "soloEnabled": false,
                "hold": {
                    "enabled": "OFF",
                    "activeKeys": [
                        "G2"
                    ]
                },
                "isMuted": false,
                "isCollapsed": false
            }
        ],
        "sequencers": [
            {
                "index": 7,
                "channel": [
                    0
                ],
                "sequence": [
                    {
                        "id": 0,
                        "note": "F#1",
                        "time": 0,
                        "length": 0.124,
                        "velocity": 1
                    },
                    {
                        "id": 1,
                        "note": "A#1",
                        "time": 0.124,
                        "length": "16n",
                        "velocity": 1
                    },
                    {
                        "id": 2,
                        "note": "D#2",
                        "time": 0.25,
                        "length": "16n",
                        "velocity": 1
                    },
                    {
                        "id": 3,
                        "note": "F#2",
                        "time": 0.375,
                        "length": "16n",
                        "velocity": 1
                    },
                    {
                        "id": 4,
                        "note": "D#2",
                        "time": 0.5,
                        "length": "16n",
                        "velocity": 1
                    },
                    {
                        "id": 5,
                        "note": "A#1",
                        "time": 0.625,
                        "length": "16n",
                        "velocity": 1
                    },
                    {
                        "id": 6,
                        "note": "F#1",
                        "time": 0.751,
                        "length": "16n",
                        "velocity": 1
                    }
                ],
                "humanize": false,
                "bars": 1,
                "noteLength": "1/16"
            },
            {
                "index": 9,
                "channel": [
                    15
                ],
                "sequence": [
                    {
                        "id": 0,
                        "note": "A1",
                        "time": 0,
                        "length": 0.126,
                        "velocity": 1
                    },
                    {
                        "id": 1,
                        "note": "A1",
                        "time": 0.061,
                        "length": 0.125,
                        "velocity": 1
                    },
                    {
                        "id": 2,
                        "note": "F3",
                        "time": 0.249,
                        "length": "4n",
                        "velocity": 1
                    }
                ],
                "humanize": false,
                "bars": 1,
                "noteLength": "1/16"
            },
            {
                "index": 11,
                "channel": [
                    14
                ],
                "sequence": [
                    {
                        "id": 0,
                        "note": "F2",
                        "time": 1.5,
                        "length": "8n",
                        "velocity": 1
                    },
                    {
                        "id": 1,
                        "note": "A#3",
                        "time": 0,
                        "length": "16n",
                        "velocity": 1
                    },
                    {
                        "id": 2,
                        "note": "C3",
                        "time": 0.126,
                        "length": 0.14300000000000002,
                        "velocity": 1
                    },
                    {
                        "id": 3,
                        "note": "A#3",
                        "time": 0.25,
                        "length": "16n",
                        "velocity": 1
                    },
                    {
                        "id": 4,
                        "note": "B2",
                        "time": 0.495,
                        "length": "16n",
                        "velocity": 1
                    },
                    {
                        "id": 5,
                        "note": "G#2",
                        "time": 0.811,
                        "length": "32n",
                        "velocity": 1
                    },
                    {
                        "id": 6,
                        "note": "F#2",
                        "time": 0.873,
                        "length": 0.11699999999999999,
                        "velocity": 1
                    },
                    {
                        "id": 7,
                        "note": "G#3",
                        "time": 0.749,
                        "length": "32n",
                        "velocity": 1
                    },
                    {
                        "id": 8,
                        "note": "G2",
                        "time": 0.999,
                        "length": 0.03950000000000009,
                        "velocity": 1
                    }
                ],
                "humanize": false,
                "bars": 2,
                "noteLength": "1/16"
            },
            {
                "index": 13,
                "channel": [
                    13
                ],
                "sequence": [
                    {
                        "id": 0,
                        "note": "A2",
                        "time": 0.249,
                        "length": 0.126,
                        "velocity": 1
                    },
                    {
                        "id": 1,
                        "note": "F2",
                        "time": 0.499,
                        "length": 0.124,
                        "velocity": 1
                    },
                    {
                        "id": 2,
                        "note": "F3",
                        "time": 0,
                        "length": 0.124,
                        "velocity": 1
                    },
                    {
                        "id": 3,
                        "note": "G2",
                        "time": 0.756,
                        "length": 0.244,
                        "velocity": 1
                    }
                ],
                "humanize": false,
                "bars": 1,
                "noteLength": "1/16"
            }
        ],
        "id": 1000,
        "name": "Dirty Bass Song"
    },
    {
      "volume": 0.8500000000000004,
      "octave": 4,
      "channel": 7,
      "tracks": [
        {
          "enabled": true,
          "channel": 7,
          "volume": -3,
          "instrument": {
            "name": "FMSynth",
            "enabled": true,
            "collapsed": false,
            "volume": 1,
            "detune": 0.5,
            "portamento": 0,
            "harmonicity": 3,
            "phase": 0,
            "attack": 0.01,
            "decay": 0.01,
            "sustain": 1,
            "release": 0.5
          },
          "nodes": [
            {
              "name": "Reverb",
              "enabled": true,
              "collapsed": false,
              "wet": 1,
              "decay": 3,
              "preDelay": 0.060000000000000005
            },
            {
              "name": "Phaser",
              "enabled": true,
              "collapsed": false,
              "wet": 1,
              "octaves": 3,
              "baseFrequency": 350,
              "frequency": 0.5,
              "Q": 10
            },
            {
              "name": "Delay",
              "enabled": true,
              "collapsed": false,
              "wet": 1,
              "delayTime": 0.08000000000000003,
              "feedback": 0.4900000000000002
            },
            {
              "name": "Vibrato",
              "enabled": true,
              "collapsed": false,
              "wet": 1,
              "depth": 0.1,
              "maxDelay": 0.005,
              "wave": "triangle",
              "wavePartial": "",
              "frequency": 5
            },
            {
              "name": "Chorus",
              "enabled": true,
              "collapsed": false,
              "wet": 0.5,
              "delayTime": 3.5,
              "depth": 0.7,
              "feedback": 0
            },
            {
              "name": "Reverb",
              "enabled": true,
              "collapsed": false,
              "wet": 1,
              "decay": 3,
              "preDelay": 0
            },
            {
              "name": "Reverb",
              "enabled": true,
              "collapsed": false,
              "wet": 1,
              "decay": 3,
              "preDelay": 1
            },
            {
              "name": "Phaser",
              "enabled": true,
              "collapsed": false,
              "wet": 0,
              "octaves": 3,
              "baseFrequency": 350,
              "frequency": 131.98000000000022,
              "Q": 10
            },
            {
              "name": "Phaser",
              "enabled": true,
              "collapsed": false,
              "wet": 1,
              "octaves": 12,
              "baseFrequency": 503.86999999999955,
              "frequency": 0.5,
              "Q": 1
            },
            {
              "name": "Phaser",
              "enabled": true,
              "collapsed": false,
              "wet": 1,
              "octaves": 3,
              "baseFrequency": 350,
              "frequency": 0.5,
              "Q": 10
            }
          ],
          "soloEnabled": false,
          "hold": {
            "enabled": "HOLD",
            "activeKeys": [
              "A3",
              "B4",
              "F#4",
              "F#3",
              "D2"
            ]
          },
          "isMuted": false,
          "isCollapsed": false
        }
      ],
      "id": 0,
      "name": "singing birds"
    },   
  ]

