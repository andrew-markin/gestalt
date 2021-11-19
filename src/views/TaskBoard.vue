<template>
  <v-container class="pt-0">
    <drop-list
      v-if="tasks.length > 0"
      :items="tasks" column
      @reorder="reorderTask">
      <template #item="{ item: task }">
        <drag
          :key="task.uuid"
          :drag-image-opacity="0.5">
          <v-sheet
            class="task rounded pa-4 my-3 d-flex align-center noselect"
            @click="openTask(task.uuid)">
            <span class="mr-2 text-body-1 text-truncate">
              {{ task.data.description }}
            </span>
          </v-sheet>
        </drag>
      </template>
    </drop-list>
  </v-container>
</template>

<script>
import { Drag, DropList } from 'vue-easy-dnd'
import { mapState, mapActions, mapMutations } from 'vuex'

export default {
  components: { Drag, DropList },
  computed: mapState(['tasks']),
  methods: {
    ...mapActions(['reorderTask']),
    ...mapMutations(['openTask'])
  }
}
</script>

<style scoped>
.task:hover {
  background-color: #fafeff;
}
</style>
