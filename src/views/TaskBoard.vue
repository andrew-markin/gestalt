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
import { mapState, mapActions, mapMutations } from 'vuex'
import TaskTree from '../components/TaskTree.vue'

export default {
  components: { TaskTree },
  computed: {
    ...mapState(['tasks', 'selectedTask']),
    gestaltKey () {
      return this.$route.params.key
    }
  },
  watch: {
    gestaltKey () {
      this.loadGestalt()
    }
  },
  methods: {
    ...mapActions(['load', 'moveTask', 'reorderTask', 'expandTask', 'selectTask']),
    ...mapMutations(['demandTask']),
    loadGestalt () {
      this.load(this.gestaltKey)
    },
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
  },
  mounted () {
    this.loadGestalt()
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
