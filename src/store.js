import Vue from 'vue'
import Vuex from 'vuex'
import { v4 as uuidv4 } from 'uuid'

Vue.use(Vuex)

const store = new Vuex.Store({
  state: {
    tasks: [],
    openedTask: undefined
  },
  getters: {
    tasks (state) {
      return state.tasks
    },
    taskByUuid: (state) => (uuid) => {
      if (!uuid) return undefined
      return state.tasks.find(task => task.uuid === uuid)
    }
  },
  actions: {
    init ({ dispatch }) {
      dispatch('loadTasks')
    },
    loadTasks ({ commit }) {
      const json = localStorage.getItem('tasks')
      const tasks = JSON.parse(json) || []
      commit('updateTasks', tasks)
    },
    saveTasks ({ state }) {
      const json = JSON.stringify(state.tasks)
      localStorage.setItem('tasks', json)
    },
    async upsertTask ({ commit, dispatch }, { uuid, data }) {
      commit('upsertTask', { uuid, data })
      await dispatch('saveTasks')
    },
    async deleteTask ({ commit, dispatch }, uuid) {
      commit('deleteTask', uuid)
      await dispatch('saveTasks')
    },
    async reorderTask ({ commit, dispatch }, { from, to }) {
      commit('reorderTask', { from, to })
      await dispatch('saveTasks')
    }
  },
  mutations: {
    updateTasks (state, value) {
      state.tasks = value
    },
    upsertTask (state, { uuid, data }) {
      const task = state.tasks.find(task => task.uuid === uuid)
      const now = Date.now()
      if (task) {
        task.data = data
        task.changed = now
      } else {
        const changed = now
        const moved = now
        state.tasks.push({ uuid, data, changed, moved })
      }
    },
    deleteTask (state, uuid) {
      if (!uuid) return
      if (state.openedTask === uuid) state.openedTask = undefined
      const index = state.tasks.findIndex(task => task.uuid === uuid)
      if (index >= 0) state.tasks.splice(index, 1)
    },
    reorderTask (state, { from, to }) {
      const task = state.tasks.splice(from, 1)[0]
      task.moved = Date.now()
      state.tasks.splice(to, 0, task)
    },
    openTask (state, uuid) {
      state.openedTask = uuid || uuidv4()
    },
    closeTask (state) {
      state.openedTask = undefined
    }
  }
})

store.dispatch('init')

export default store
