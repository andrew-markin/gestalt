<template>
  <v-container class="pt-0">
    <div id="outside" @click="select()"/>
    <task-tree
      class="noselect"
      :tasks="tasks"
      :selected-task="selectedTask"
      @open="open"
      @move="move"
      @reorder="reorder"
      @expand="expand"
      @select="select">
    </task-tree>
  </v-container>
</template>

<script>
import TaskTree from '../components/TaskTree.vue'
import { mapState, mapActions, mapMutations } from 'vuex'

export default {
  components: { TaskTree },
  computed: mapState(['tasks', 'selectedTask']),
  methods: {
    ...mapActions(['moveTask', 'reorderTask', 'expandTask']),
    ...mapMutations(['selectTask', 'demandTask']),
    open (uuid) {
      this.selectTask(uuid)
      this.demandTask({ uuid })
    },
    move (uuid, target, index) {
      this.moveTask({ uuid, target, index })
    },
    reorder (parent, from, to) {
      this.reorderTask({ parent, from, to })
    },
    expand (uuid) {
      this.selectTask(uuid)
      this.expandTask(uuid)
    },
    select (uuid) {
      this.selectTask(uuid)
    }
  }
}
</script>

<style scoped>
#outside {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
