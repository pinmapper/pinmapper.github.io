import { body, circlePath, defineConnector, rectPath } from './geometry'
import { preset } from './preset'

const R_FACE = 4.75
const R_SHELL = 5.7

/**
 * 6-pin mini-DIN (PS/2) as seen on the mating face of the FEMALE socket:
 *   6 ▄ 5
 *  4     3
 *   2   1
 */
export const MINIDIN6 = defineConnector({
  id: 'minidin6',
  name: 'PS/2 (Mini-DIN 6)',
  aliases: ['ps2', 'ps/2', 'mini din', 'minidin', 'keyboard', 'mouse'],
  family: 'DIN',
  description: '6-pin mini-DIN (PS/2 keyboard/mouse)',
  refGender: 'F',
  genderLabels: { M: 'Male plug', F: 'Female socket' },
  pinShape: { kind: 'circle', r: 0.85 },
  body: [
    body('shell', circlePath(0, 0, R_SHELL)),
    body('face', circlePath(0, 0, R_FACE)),
    body('key', rectPath(-0.85, -R_FACE - 0.2, 1.7, 1.7, 0.2)),
    body('key', rectPath(-0.75, -0.75, 1.5, 1.5, 0.15)),
  ],
  pins: [
    { id: '1', label: '1', x: 1.45, y: 2.75 },
    { id: '2', label: '2', x: -1.45, y: 2.75 },
    { id: '3', label: '3', x: 3.2, y: 0.4 },
    { id: '4', label: '4', x: -3.2, y: 0.4 },
    { id: '5', label: '5', x: 2.05, y: -2.4 },
    { id: '6', label: '6', x: -2.05, y: -2.4 },
  ],
  presets: [preset('ps2', 'PS/2 keyboard/mouse', { 1: 'Data', 2: 'NC', 3: 'GND', 4: '+5V', 5: 'Clock', 6: 'NC' })],
  bounds: [-R_SHELL, -R_SHELL, R_SHELL, R_SHELL],
})
