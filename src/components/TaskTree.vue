<template>
  <drop-list
    :class="{ 'mt-3': !parent }"
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
              :class="{ piped: index !== lastTaskIndex }">
              <div
                class="bridge pt-3"
                :class="{ last: index === lastTaskIndex }">
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
              <task-tree
                v-if="(task.subtasks.length > 0) && task.expanded"
                :parent="task.uuid"
                :tasks="task.subtasks"
                :selected-task="selectedTask"
                v-on="$listeners">
              </task-tree>
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
import { Drag, Drop, DropList } from 'vue-easy-dnd'
import { mdiChevronDown, mdiChevronUp } from '@mdi/js'
import TaskStateIcon from './TaskStateIcon.vue'

export default {
  name: 'task-tree',
  components: { Drag, Drop, DropList, TaskStateIcon },
  props: {
    parent: { type: String },
    tasks: { type: Array, default: () => [] },
    selectedTask: { type: String }
  },
  data: () => ({ mdiChevronDown, mdiChevronUp }),
  computed: {
    lastTaskIndex () {
      const tasks = this.tasks
      let index = tasks.length
      while (index-- > 0) {
        if (!tasks[index].deleted) return index
      }
      return undefined
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
.bridge {
  width: 1rem;
  padding-bottom: 1.5rem;
  margin-left: -2px;
  border-bottom: var(--pipe-border);
}
.bridge.last {
  margin-left: 0;
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
