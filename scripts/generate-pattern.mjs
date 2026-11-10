// Generates the seamless doodle tile used as the background pattern mask.
// Run with `npm run pattern` and commit the result along with this script.

import { writeFileSync } from 'node:fs'

import * as mdi from '@mdi/js'

const OUTPUT = new URL('../src/assets/pattern.svg', import.meta.url)

const TILE = 480
const SEED = 20261110
const CANDIDATES = 150
const ICON_SIZE = 24 // MDI view box
const ROTATION = 40 // degrees, both ways
// MDI lines are 2 units thick, the outline eats a half of this width on each side
const THINNING = 0.6

const ICONS = [
  // Tasks and planning
  'mdiCheckboxMarkedOutline',
  'mdiCheckboxMarkedCircleOutline',
  'mdiFormatListChecks',
  'mdiPlaylistCheck',
  'mdiClipboardCheckOutline',
  'mdiCalendarCheckOutline',
  'mdiClockOutline',
  'mdiAlarmCheck',
  'mdiTimerSandEmpty',
  'mdiProgressCheck',
  'mdiFlagOutline',
  'mdiFlagCheckered',
  'mdiBookmarkOutline',
  'mdiPinOutline',
  'mdiTagOutline',
  'mdiPaperclip',
  'mdiFolderOutline',
  'mdiNoteTextOutline',
  'mdiNotebookOutline',
  'mdiPencilOutline',
  'mdiBellOutline',
  'mdiLightbulbOutline',
  'mdiBullseyeArrow',
  'mdiTrophyOutline',
  'mdiStarOutline',
  'mdiRocketLaunchOutline',
  'mdiCompassOutline',
  'mdiStairs',
  'mdiPuzzleOutline',
  'mdiSitemapOutline',
  'mdiFileTreeOutline',
  // Areas of life
  'mdiHomeOutline',
  'mdiBriefcaseOutline',
  'mdiCartOutline',
  'mdiHeartOutline',
  'mdiDumbbell',
  'mdiBookOpenVariant',
  'mdiCoffeeOutline',
  'mdiCarOutline',
  'mdiSproutOutline',
  'mdiHammerWrench',
  'mdiBroom',
  'mdiGiftOutline',
  'mdiAccountGroupOutline',
  'mdiEmailOutline',
  // A few filled ones for variety
  'mdiBrain',
  'mdiAirplane',
  'mdiBicycle',
  'mdiHiking'
]

const SPARKLE = 'mdiStarFourPoints'

// Scale ranges with icon counts, the largest are placed first
const ICON_GROUPS = [
  { count: 10, min: 1.75, max: 1.9 },
  { count: 56, min: 1.45, max: 1.65 },
  { count: 14, min: 1.3, max: 1.4 }
]

const FILLER_COUNT = 20

// Mulberry32
function createRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = createRandom(SEED)
const between = (min, max) => min + random() * (max - min)

function shuffle(items) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// Distance on the torus, so gaps hold across the tile edges
function torusDistance(a, b) {
  let dx = Math.abs(a.x - b.x)
  let dy = Math.abs(a.y - b.y)
  if (dx > TILE / 2) dx = TILE - dx
  if (dy > TILE / 2) dy = TILE - dy
  return Math.hypot(dx, dy)
}

// Mitchell's best-candidate: the point farthest from the edges of placed items
function place(items, radius) {
  let best = null
  let bestGap = -Infinity
  for (let i = 0; i < CANDIDATES; i++) {
    const candidate = { x: random() * TILE, y: random() * TILE }
    let gap = Infinity
    for (const item of items) {
      gap = Math.min(gap, torusDistance(candidate, item) - item.radius - radius)
      if (gap <= bestGap) break
    }
    if (gap > bestGap) {
      best = candidate
      bestGap = gap
    }
  }
  return best
}

const round = (value) => Math.round(value * 10) / 10

// Icons

const scales = ICON_GROUPS.flatMap(({ count, min, max }) =>
  Array.from({ length: count }, () => between(min, max))
).sort((a, b) => b - a)

const items = []

// The names go in rounds, so none repeats before all the others are used. Within
// a round the name taken is the one whose nearest copy is the farthest away
let pending = []

function pickName(point) {
  if (pending.length === 0) pending = shuffle(ICONS)
  let best = 0
  let bestDistance = -Infinity
  pending.forEach((name, index) => {
    let distance = Infinity
    for (const item of items) {
      if (item.name === name) distance = Math.min(distance, torusDistance(point, item))
    }
    if (distance > bestDistance) {
      best = index
      bestDistance = distance
    }
  })
  return pending.splice(best, 1)[0]
}

scales.forEach((scale) => {
  // The icons don't fill their whole box, so the radius is a bit less than a half of it
  const radius = (ICON_SIZE / 2) * scale * 0.85
  const point = place(items, radius)
  items.push({
    ...point,
    radius,
    kind: 'icon',
    name: pickName(point),
    scale,
    angle: between(-ROTATION, ROTATION)
  })
})

// Dots and sparkles in the remaining gaps

for (let i = 0; i < FILLER_COUNT; i++) {
  const sparkle = i % 2 === 0
  const size = sparkle ? between(0.45, 0.6) : between(1.6, 2.2)
  const radius = sparkle ? (ICON_SIZE / 2) * size : size
  const point = place(items, radius)
  items.push(
    sparkle
      ? { ...point, radius, kind: 'icon', name: SPARKLE, scale: size, angle: between(-20, 20) }
      : { ...point, radius, kind: 'dot', size }
  )
}

// SVG

const used = [...new Set(items.filter((item) => item.kind === 'icon').map((item) => item.name))]
const ids = new Map(used.map((name, index) => [name, `i${index}`]))

// The icons are scaled less than twice, so a tenth of a unit is enough
const compact = (path) =>
  path.replace(/\d*\.\d+/g, (value) => String(round(Number(value))).replace(/^0\./, '.'))

const defs = used.map(
  (name) => `<path id="${ids.get(name)}" transform="translate(-12 -12)" d="${compact(mdi[name])}"/>`
)

// Everything crossing an edge is repeated on the opposite side
function copies(item) {
  const shiftsX = [0]
  const shiftsY = [0]
  if (item.x - item.radius * 1.2 < 0) shiftsX.push(TILE)
  if (item.x + item.radius * 1.2 > TILE) shiftsX.push(-TILE)
  if (item.y - item.radius * 1.2 < 0) shiftsY.push(TILE)
  if (item.y + item.radius * 1.2 > TILE) shiftsY.push(-TILE)
  return shiftsX.flatMap((dx) => shiftsY.map((dy) => ({ x: item.x + dx, y: item.y + dy })))
}

function shapes(kind) {
  return items
    .filter((item) => item.kind === kind)
    .flatMap((item) =>
      copies(item).map(({ x, y }) =>
        kind === 'dot'
          ? `<circle cx="${round(x)}" cy="${round(y)}" r="${round(item.size)}"/>`
          : `<use href="#${ids.get(item.name)}" transform="translate(${round(x)} ${round(y)}) ` +
            `rotate(${round(item.angle)}) scale(${round(item.scale)})"/>`
      )
    )
}

// The icons are thinned by a black outline over their white fill inside a mask
const svg = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">`,
  `<defs>${defs.join('')}</defs>`,
  `<mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${TILE}" height="${TILE}">`,
  `<g fill="#fff" stroke="#000" stroke-width="${THINNING}" stroke-linejoin="round">`,
  ...shapes('icon'),
  `</g>`,
  `</mask>`,
  `<rect width="${TILE}" height="${TILE}" mask="url(#m)"/>`,
  ...shapes('dot'),
  `</svg>`,
  ''
].join('\n')

writeFileSync(OUTPUT, svg)
console.log(`${OUTPUT.pathname}: ${items.length} items, ${svg.length} bytes`)
