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
                class="task rounded pr-3 d-flex"
                :class="{ 'pl-3': !taskIsExpandable(task) }"
                @click="$emit('open', task.uuid)">
                <div
                  v-if="taskIsExpandable(task)"
                  class="expander d-flex justify-center"
                  @click.prevent.stop="$emit('expand', task.uuid)">
                  <v-icon>
                    {{ taskIsExpanded(task.uuid) ? 'expand_less' : 'expand_more' }}
                  </v-icon>
                </div>
                <div class="d-flex align-center overflow-hidden">
                  <span class="text-body-1 text-truncate">
                    {{ task.data.description }}
                  </span>
                </div>
                <drop
                  class="drop-area"
                  @drop="$emit('move', $event.data, task.uuid)">
                </drop>
              </v-sheet>
              <task-tree
                v-if="taskIsExpanded(task.uuid)"
                :parent="task.uuid"
                :tasks="task.children"
                :expanded-tasks="expandedTasks"
                @open="forwardOpen"
                @move="forwardMove"
                @reorder="forwardReorder"
                @expand="forwardExpand">
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
    parent: { type: String },
    tasks: { type: Array, default: () => [] },
    expandedTasks: { type: Array, default: () => [] }
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
    },
    forwardExpand () {
      this.$emit('expand', ...arguments)
    },
    taskIsExpandable (task) {
      return task.children && task.children.length > 0
    },
    taskIsExpanded (uuid) {
      return this.expandedTasks.findIndex((item) => item === uuid) >= 0
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
.expander {
  width: 2rem;
  padding-left: 3px;
  z-index: 100;
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
