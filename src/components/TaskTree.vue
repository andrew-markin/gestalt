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
        <template #default>
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
                :class="{ selected: task.uuid === selectedTask }"
                @focus="$emit('select', task.uuid)"
                @dblclick="$emit('open', task.uuid)">
                <div
                  v-if="task.subtasks.length > 0"
                  class="expander ml-n3 d-flex justify-center"
                  @click.prevent.stop="$emit('expand', task.uuid)">
                  <v-icon>
                    {{ task.expanded ? 'expand_less' : 'expand_more' }}
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
          <v-sheet dark class="dragged rounded pa-2 d-flex align-center noselect">
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
    selectedTask: { type: String }
  }
}
</script>

<style scoped>
* {
  --pipe-border: 2px solid #757575;
  --feedback-border: 2px dashed #1B78CC;
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
  background-color: #1B78CC;
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
.selected {
  background-color: #1B78CC;
  color: white;
}
.selected > * > .v-icon {
  color: white;
}
</style>
