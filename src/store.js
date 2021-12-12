import Vue from 'vue'
import Vuex from 'vuex'
import { v4 as uuidv4 } from 'uuid'

Vue.use(Vuex)

const importTasks = (tasks) => {
  return tasks.map(({ children, ...rest }) => ({
    children: importTasks(children || []),
    ...rest
  }))
}

const exportTasks = (tasks) => {
  return tasks.map(({ children, ...rest }) => ({
    ...(children.length > 0) && { children: exportTasks(children) },
    ...rest
  }))
}

const findTask = (root, uuid) => {
  if (!root || !uuid) return
  const scope = [root]
  while (scope.length > 0) {
    const tasks = scope.shift()
    for (let index = 0; index < tasks.length; index++) {
      const task = tasks[index]
      if (task.uuid === uuid) return { task, tasks, index }
      if (task.children && (task.children.length > 0)) {
        scope.push(task.children)
      }
    }
  }
}

const findTasks = (root, uuid) => {
  if (!uuid) return root
  const { task } = findTask(root, uuid)
  if (task) return task.children || []
}

const toggleSetValue = (set, value, target) => {
  if (!value) return
  const index = set.findIndex((item) => item === value)
  if ((index >= 0) && (target !== true)) set.splice(index, 1)
  if ((index < 0) && (target !== false)) set.push(value)
}

const store = new Vuex.Store({
  state: {
    tasks: [],
    expandedTasks: [],
    selectedTask: undefined,
    openedTask: undefined
  },
  getters: {
    tasks (state) {
      return state.tasks
    },
    expandedTasks (state) {
      return state.expandedTasks
    },
    selectedTask (state) {
      return state.selectedTask
    },
    getTask: (state) => (uuid) => {
      if (!uuid) return undefined
      const { task } = findTask(state.tasks, uuid) || {}
      return task
    }
  },
  actions: {
    init ({ dispatch }) {
      dispatch('loadTasks')
      dispatch('loadExpandedTasks')
    },
    loadTasks ({ commit }) {
      const json = localStorage.getItem('tasks')
      const tasks = importTasks(JSON.parse(json) || [])
      commit('updateTasks', tasks)
    },
    saveTasks ({ state }) {
      const json = JSON.stringify(exportTasks(state.tasks))
      localStorage.setItem('tasks', json)
    },
    loadExpandedTasks ({ commit }) {
      const json = localStorage.getItem('expandedTasks')
      const expandedTasks = JSON.parse(json) || []
      commit('updateExpandedTasks', expandedTasks)
    },
    saveExpandedTasks ({ state }) {
      const json = JSON.stringify(state.expandedTasks)
      localStorage.setItem('expandedTasks', json)
    },
    async upsertTask ({ commit, dispatch }, { uuid, data }) {
      commit('upsertTask', { uuid, data })
      await dispatch('saveTasks')
    },
    async moveTask ({ commit, dispatch }, { uuid, target, index }) {
      commit('moveTask', { uuid, target, index })
      await dispatch('saveTasks')
    },
    async reorderTask ({ commit, dispatch }, { parent, from, to }) {
      commit('reorderTask', { parent, from, to })
      await dispatch('saveTasks')
    },
    async deleteTask ({ commit, dispatch }, uuid) {
      commit('deleteTask', uuid)
      await dispatch('saveTasks')
    },
    async expandTask ({ commit, dispatch }, uuid) {
      if (!uuid) return
      commit('expandTask', uuid)
      await dispatch('saveExpandedTasks')
    }
  },
  mutations: {
    updateTasks (state, value) {
      state.tasks = value
    },
    updateExpandedTasks (state, value) {
      state.expandedTasks = value
    },
    upsertTask (state, { uuid, data }) {
      const now = Date.now()
      const { task } = findTask(state.tasks, uuid) || {}
      if (task) {
        task.data = data
        task.changed = now
      } else {
        const changed = now
        const moved = now
        state.tasks.push({ uuid, data, changed, moved, children: [] })
      }
    },
    moveTask (state, { uuid, target, index }) {
      if (uuid === target) return
      const { task, ...source } = findTask(state.tasks, uuid)
      if (!task || findTask(task.children || [], target)) return
      const targetTasks = findTasks(state.tasks, target)
      if (!targetTasks) return
      source.tasks.splice(source.index, 1)
      if (index === undefined) targetTasks.push(task)
      else targetTasks.splice(index, 0, task)
      task.moved = Date.now()
      toggleSetValue(state.expandedTasks, target, true)
    },
    reorderTask (state, { parent, from, to }) {
      const tasks = findTasks(state.tasks, parent)
      if (!tasks) return
      const task = tasks.splice(from, 1)[0]
      task.moved = Date.now()
      tasks.splice(to, 0, task)
    },
    deleteTask (state, uuid) {
      if (!uuid) return
      if (state.openedTask === uuid) state.openedTask = undefined
      const match = findTask(state.tasks, uuid)
      if (match) match.tasks.splice(match.index, 1)
    },
    expandTask (state, uuid, value) {
      toggleSetValue(state.expandedTasks, uuid, value)
    },
    selectTask (state, uuid) {
      if (uuid && !findTasks(state.tasks, uuid)) return
      state.selectedTask = uuid
    },
    openTask (state, uuid) {
      if (uuid && !findTasks(state.tasks, uuid)) return
      state.openedTask = uuid || uuidv4()
    },
    closeTask (state) {
      state.openedTask = undefined
    }
  }
})

store.dispatch('init')

export default store
