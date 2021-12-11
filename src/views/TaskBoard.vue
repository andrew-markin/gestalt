<template>
  <v-container class="pt-0">
    <task-tree
      class="noselect"
      :tasks="tasks"
      @open="open"
      @move="move"
      @reorder="reorder">
    </task-tree>
  </v-container>
</template>

<script>
import TaskTree from '../components/TaskTree.vue'
import { mapState, mapActions, mapMutations } from 'vuex'

export default {
  components: { TaskTree },
  computed: mapState(['tasks']),
  methods: {
    ...mapActions(['moveTask', 'reorderTask']),
    ...mapMutations(['openTask']),
    open (uuid) {
      this.openTask(uuid)
    },
    move (uuid, target, index) {
      this.moveTask({ uuid, target, index })
    },
    reorder (parent, from, to) {
      this.reorderTask({ parent, from, to })
    }
  }
}
</script>
