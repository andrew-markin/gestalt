<template>
  <v-container class="pt-0">
    <v-sheet
      rounded
      class="task pa-4 my-3 d-flex align-center noselect"
      v-for="task in tasks" :key="task.uuid"
      @click="openTask(task.uuid)">
      <span class="mr-2 text-body-1 text-truncate">
        {{ task.data.description }}
      </span>
    </v-sheet>
  </v-container>
</template>

<script>
import { mapState, mapMutations } from 'vuex'

export default {
  computed: mapState(['tasks']),
  methods: mapMutations(['openTask'])
}
</script>

<style scoped>
.task:hover {
  background-color: #fafeff;
}
</style>
