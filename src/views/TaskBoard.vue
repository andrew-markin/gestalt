<template>
  <v-container class="pt-0">
    <drop-list
      v-if="tasks.length > 0"
      :items="tasks" column
      @reorder="reorderTask">
      <template #item="{ item: task }">
        <drag
          :key="task.uuid"
          :drag-image-opacity="0.9">
          <v-sheet
            class="task rounded pa-4 my-3 d-flex align-center noselect"
            @click="openTask(task.uuid)">
            <drop
              class="drop-area"
              @drop="appendChild">
            </drop>
            <span class="mr-2 text-body-1 text-truncate">
              {{ task.data.description }}
            </span>
          </v-sheet>
          <template #drag-image>
            <v-sheet dark class="dragged rounded indigo pa-2 d-flex align-center noselect">
              <span class="text-body-1 text-truncate">
                {{ task.data.description }}
              </span>
            </v-sheet>
          </template>
        </drag>
      </template>
      <template #reordering-feedback>
        <div class="feedback" key="feedback"/>
      </template>
    </drop-list>
  </v-container>
</template>

<script>
import { Drag, Drop, DropList } from 'vue-easy-dnd'
import { mapState, mapActions, mapMutations } from 'vuex'

export default {
  components: { Drag, Drop, DropList },
  computed: mapState(['tasks']),
  methods: {
    ...mapActions(['reorderTask']),
    ...mapMutations(['openTask']),
    appendChild (event) {
      console.log('Append child', event)
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
