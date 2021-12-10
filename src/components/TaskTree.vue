<template>
  <drop-list
    v-if="tasks.length > 0"
    :items="tasks" column
    class="pt-0" :class="{ 'pl-8': !!parent }"
    @insert="$emit('move', $event.data, parent, $event.index)"
    @reorder="$emit('reorder', parent, $event.from, $event.to)">
    <template #item="{ item: task }">
      <drag
        :key="task.uuid"
        :data="task.uuid"
        :drag-image-opacity="0.9">
        <template #default>
          <v-sheet
            :key="task.uuid"
            class="task rounded pa-4 my-3 d-flex align-center noselect"
            @click="$emit('open', task.uuid)">
            <drop
              class="drop-area"
              @drop="$emit('move', $event.data, task.uuid)">
            </drop>
            <span class="mr-2 text-body-1 text-truncate">
              {{ task.data.description }}
            </span>
          </v-sheet>
          <task-tree
            :parent="task.uuid"
            :tasks="task.children"
            @open="forwardOpen"
            @move="forwardMove"
            @reorder="forwardReorder">
          </task-tree>
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
      <div class="feedback" :key="uuid"/>
    </template>
    <template #reordering-feedback>
      <div class="feedback" key="feedback"/>
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
.dragged {
  max-width: 20rem;
  transform: translate(-4rem, -50%);
}
.feedback {
  position: relative;
}
.feedback::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin-top: -7px;
  margin-left: -0.5rem;
  margin-right: -0.5rem;
  border-top: 2px dashed #3F51B5;
}
.task {
  position: relative;
}
.task > .drop-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 20px;
}
.drop-in::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: -25px;
  border: 2px dashed #3F51B5;
  border-radius: 6px;
}
</style>
