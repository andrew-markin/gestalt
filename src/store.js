import Vue from 'vue'
import Vuex from 'vuex'
import { v4 as uuidv4 } from 'uuid'

Vue.use(Vuex)

const expandTasks = (tasks) => {
  return tasks.map(({ children, ...rest }) => ({
    children: expandTasks(children || []),
    ...rest
  }))
}

const squashTasks = (tasks) => {
  return tasks.map(({ children, ...rest }) => ({
    ...(children.length > 0) && { children: squashTasks(children) },
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

const store = new Vuex.Store({
  state: {
    tasks: [],
    openedTask: undefined
  },
  getters: {
    tasks (state) {
      return state.tasks
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
    },
    loadTasks ({ commit }) {
      const json = localStorage.getItem('tasks')
      const tasks = expandTasks(JSON.parse(json) || [])
      commit('updateTasks', tasks)
    },
    saveTasks ({ state }) {
      const json = JSON.stringify(squashTasks(state.tasks))
      localStorage.setItem('tasks', json)
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
    }
  },
  mutations: {
    updateTasks (state, value) {
      state.tasks = value
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
