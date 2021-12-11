<template>
  <drop-list
    :items="tasks" column no-animations
    @insert="$emit('move', $event.data, parent, $event.index)"
    @reorder="$emit('reorder', parent, $event.from, $event.to)">
    <template #item="{ item: task, index }">
      <drag
        :key="task.uuid"
        :data="task.uuid"
        :drag-image-opacity="0.9">
        <template #default>
          <div class="my-3 d-flex">
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
                class="task rounded px-3 d-flex align-center"
                @click="$emit('open', task.uuid)">
                <span class="text-body-1 text-truncate">
                  {{ task.data.description }}
                </span>
                <drop
                  class="drop-area"
                  @drop="$emit('move', $event.data, task.uuid)">
                </drop>
              </v-sheet>
              <task-tree
                :parent="task.uuid"
                :tasks="task.children"
                @open="forwardOpen"
                @move="forwardMove"
                @reorder="forwardReorder">
              </task-tree>
            </div>
          </div>
        </template>
        <template #drag-image>
          <v-sheet dark class="dragged rounded indigo pa-2 d-flex align-center noselect">
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
import { Drag, Drop, DropList } from 'vue-easy-dnd'

export default {
  name: 'task-tree',
  components: { Drag, Drop, DropList },
  props: {
    tasks: { type: Array, default: () => [] },
    parent: { type: String }
  },
  methods: {
    forwardOpen () {
      this.$emit('open', ...arguments)
    },
    forwardMove () {
      this.$emit('move', ...arguments)
    },
    forwardReorder () {
      this.$emit('reorder', ...arguments)
    }
  }
}
</script>

<style scoped>
* {
  --pipe-border: 2px solid #757575;
  --feedback-border: 2px dashed #3F51B5;
}
.trunk {
  width: 1rem;
  margin-left: 1rem;
}
.trunk.piped {
  border-left: 2px solid;
  border-left: var(--pipe-border);
}
.bridge {
  width: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: var(--pipe-border);
}
.bridge.last {
  border-left: var(--pipe-border);
  border-bottom-left-radius: 4px;
}
.task {
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
  margin: 15px;
}
.dragged {
  max-width: 20rem;
  transform: translate(-4rem, -50%);
}
.drop-in::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: -15px;
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
