<template>
  <drop-list
    :class="{ 'mt-3': !parent, hoverable: !dragInProgress }"
    :items="tasks" column no-animations
    @insert="$emit('move', $event.data, parent, $event.index)"
    @reorder="$emit('reorder', parent, $event.from, $event.to)">
    <template #item="{ item: task, index }">
      <drag
        :key="task.uuid"
        :data="task.uuid"
        :drag-image-opacity="0.9"
        @dragstart="$emit('select', task.uuid)">
        <template #default v-if="!task.deleted">
          <div class="d-flex">
            <div
              v-if="!!parent"
              class="trunk mt-n3"
              :class="{ piped: tasks.length - index > 1 }">
              <div
                class="bridge pt-3"
                :class="{ last: tasks.length - index === 1 }">
              </div>
            </div>
            <div class="flex-grow-1 overflow-hidden">
              <v-sheet
                tabindex="0"
                class="task rounded mb-3 px-3 d-flex"
                :dark="task.uuid === selectedTask"
                :class="{ primary: task.uuid === selectedTask }"
                @focus="$emit('select', task.uuid)"
                @dblclick="$emit('open', task.uuid)">
                <div
                  v-if="task.subtasks.length > 0"
                  class="expander ml-n3 d-flex justify-center"
                  @click.prevent.stop="$emit('expand', task.uuid)"
                  @dblclick.prevent.stop>
                  <v-icon>
                    {{ task.expanded ? mdiChevronUp : mdiChevronDown }}
                  </v-icon>
                </div>
                <div class="d-flex flex-grow-1 align-center overflow-hidden">
                  <span class="text-body-1 text-truncate">
                    {{ task.data.description }}
                  </span>
                </div>
                <div class="ml-3 d-flex align-center">
                  <task-state-icon :state="task.state"/>
                </div>
                <drop
                  class="drop-area"
                  @drop="$emit('move', $event.data, task.uuid)">
                </drop>
              </v-sheet>
              <transition
                :css="false"
                @enter="slideIn"
                @leave="slideOut"
                @after-enter="resetSlide"
                @after-leave="resetSlide">
                <div v-if="(task.subtasks.length > 0) && task.expanded">
                  <div>
                    <task-tree
                      :parent="task.uuid"
                      :tasks="task.subtasks"
                      :selected-task="selectedTask"
                      v-on="$listeners">
                    </task-tree>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </template>
        <template #drag-image>
          <v-sheet dark class="primary dragged rounded pa-2 d-flex align-center noselect">
            <span class="text-body-1 text-truncate">
              {{ task.data.description }}
            </span>
          </v-sheet>
        </template>
      </drag>
    </template>
    <template #feedback="{ data: uuid }">
      <div
        :key="uuid"
        class="feedback"
        :class="{ shrinked: !!parent }">
      </div>
    </template>
    <template #reordering-feedback>
      <div
        key="feedback"
        class="feedback"
        :class="{ shrinked: !!parent }">
      </div>
    </template>
  </drop-list>
</template>

<script>
import { mdiChevronDown, mdiChevronUp } from '@mdi/js'
import { Drag, DragAwareMixin, Drop, DropList } from 'vue-easy-dnd'

import TaskStateIcon from './TaskStateIcon.vue'

// Subtasks slide out of their parent task on expanding and back on collapsing:
// the wrapper height and the subtasks offset change together, so the subtasks
// stay attached to the bottom edge of the growing or shrinking wrapper
const SLIDE_IN = { duration: 220, bezier: [0.05, 0.7, 0.1, 1] } // Decelerating
const SLIDE_OUT = { duration: 180, bezier: [0.3, 0, 0.8, 0.15] } // Accelerating
// The clip region reaches the gap above, so the tree lines in it slide too
const SLIDE_CLIP = 'inset(-12px 0 0 0)'

const reducedMotion = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)')

// The output of a cubic Bézier timing function for the given input
const ease = ([x1, y1, x2, y2], x) => {
  const at = (t, p1, p2) => 3 * (1 - t) * (1 - t) * t * p1 + 3 * (1 - t) * t * t * p2 + t * t * t
  let low = 0
  let high = 1
  for (let i = 0; i < 20; i++) {
    const t = (low + high) / 2
    if (at(t, x1, x2) < x) low = t
    else high = t
  }
  return at((low + high) / 2, y1, y2)
}

// The element is the wrapper changing its height, its only child is the inner
// wrapper moving the subtasks (not the tree itself, which resets its styles).
// The slides are tracked on the parent, as an expanding one replaces the
// wrapper being collapsed with a new one
const slide = (el, from, to, { duration, bezier }, done) => {
  if (reducedMotion && reducedMotion.matches) return done()
  const tree = el.firstElementChild
  const height = tree.offsetHeight
  const parent = el.parentNode
  // Continue from the current state when an opposite slide is interrupted
  let current = from
  const last = parent._slide
  if (last) {
    const progress = (performance.now() - last.start) / last.duration
    if (progress < 1) current = last.from + (last.to - last.from) * ease(last.bezier, progress)
  }
  if (!height || (Math.abs(to - current) < 0.01)) return done()
  duration *= Math.abs(to - current)
  const record = parent._slide = { start: performance.now(), duration, from: current, to, bezier }
  // Transitions start with the next frame, so its time is more precise
  requestAnimationFrame((time) => { record.start = time })
  const timing = `${duration}ms cubic-bezier(${bezier.join(', ')})`
  // Jump to the start state without transitions, then transition to the end one
  el.style.transition = tree.style.transition = 'none'
  el.style.clipPath = SLIDE_CLIP
  el.style.height = `${current * height}px`
  tree.style.transform = `translateY(${(current - 1) * height}px)`
  el.offsetHeight // eslint-disable-line no-unused-expressions -- Apply the start state
  el.style.transition = `height ${timing}`
  tree.style.transition = `transform ${timing}`
  el.style.height = `${to * height}px`
  tree.style.transform = `translateY(${(to - 1) * height}px)`
  const finish = (event) => {
    if (event && event.target !== el) return
    el.removeEventListener('transitionend', finish)
    clearTimeout(timeout)
    done()
  }
  el.addEventListener('transitionend', finish)
  const timeout = setTimeout(finish, duration + 50) // In case no transition runs
}

export default {
  name: 'task-tree',
  mixins: [DragAwareMixin],
  components: {
    Drag,
    Drop,
    DropList,
    DragAwareMixin, // eslint-disable-line
    TaskStateIcon
  },
  props: {
    parent: { type: String },
    tasks: { type: Array, default: () => [] },
    selectedTask: { type: String }
  },
  data: () => ({ mdiChevronDown, mdiChevronUp }),
  methods: {
    slideIn (el, done) {
      slide(el, 0, 1, SLIDE_IN, done)
    },
    slideOut (el, done) {
      slide(el, 1, 0, SLIDE_OUT, done)
    },
    resetSlide (el) {
      el.style.height = el.style.transition = el.style.clipPath = ''
      const tree = el.firstElementChild
      if (tree) tree.style.transform = tree.style.transition = ''
    }
  }
}
</script>

<style scoped>
* {
  --pipe-border: 2px solid var(--v-pipe-base);
  --feedback-border: 3px dashed var(--v-primary-base);
}
.trunk {
  width: 1rem;
  margin-left: 1rem;
}
.trunk.piped {
  border-left: var(--pipe-border);
}
/* The bridge fills the trunk's content box: it starts right after the trunk
   border (or draws its own on the last item) and ends at the task. A negative
   margin compensating the border breaks at fractional scaling, as browsers
   round border widths to device pixels but not margins. */
.bridge {
  padding-bottom: 1.5rem;
  border-bottom: var(--pipe-border);
}
.bridge.last {
  border-left: var(--pipe-border);
  border-bottom-left-radius: 4px;
}
.task {
  background: var(--v-foreground-base);
  position: relative;
  height: 3rem;
  cursor: pointer;
}
.task > .drop-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 20px;
}
.hoverable .task:hover {
  background: var(--v-hover-base);
}
.task:focus {
  outline: none;
}
.expander {
  width: 2rem;
  padding-left: 3px;
  z-index: 1;
}
.dragged {
  max-width: 20rem;
  transform: translate(-4rem, -50%);
}
.drop-area.drop-in::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: -20px;
  border: var(--feedback-border);
  border-radius: 4px;
}
.feedback {
  position: relative;
}
.feedback.shrinked {
  margin-left: 2rem;
}
.feedback::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin-top: -7px;
  border-top: var(--feedback-border);
}
</style>
