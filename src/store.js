import Vue from 'vue'
import Vuex from 'vuex'
import { v4 as uuidv4 } from 'uuid'

Vue.use(Vuex)

const importTasks = (tasks) => {
  return tasks.map(({ uuid, subtasks, expanded, state, ...rest }) => ({
    uuid: uuid || uuidv4(),
    subtasks: importTasks(subtasks || []),
    expanded: expanded || false,
    state: state || 0,
    ...rest
  }))
}

const exportTasks = (tasks) => {
  return tasks.map(({ subtasks, expanded, ...rest }) => ({
    ...(subtasks.length > 0) && { subtasks: exportTasks(subtasks) },
    ...(expanded) && { expanded },
    ...rest
  }))
}

const findTask = (root, uuid) => {
  if (!root || !uuid) return
  const scope = [root]
  let previous, result
  while (scope.length > 0) {
    const tasks = scope.shift()
    for (let index = 0; index < tasks.length; index++) {
      const task = tasks[index]
      if (result) return { previous, next: task.uuid, ...result }
      if (task.uuid === uuid) result = { task, tasks, index }
      else previous = task.uuid
      if (task.subtasks && (task.subtasks.length > 0)) {
        scope.push(task.subtasks)
      }
    }
  }
  if (result) return { previous, ...result }
}

const findTasks = (root, uuid) => {
  if (!uuid) return root
  const { task } = findTask(root, uuid)
  if (task) return task.subtasks || []
}

const store = new Vuex.Store({
  state: {
    tasks: [],
    selectedTask: undefined,
    demandedTask: undefined
  },
  getters: {
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
      const tasks = importTasks(JSON.parse(json) || [])
      commit('updateTasks', tasks)
    },
    saveTasks ({ state }) {
      const json = JSON.stringify(exportTasks(state.tasks))
      localStorage.setItem('tasks', json)
    },
    async upsertTask ({ commit, dispatch }, { uuid, subtask, data }) {
      commit('upsertTask', { uuid, subtask, data })
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
      await dispatch('saveTasks')
    }
  },
  mutations: {
    updateTasks (state, value) {
      state.tasks = value
    },
    upsertTask (state, { uuid, subtask, data }) {
      const now = Date.now()
      if (uuid) {
        // Update existing task
        const { task } = findTask(state.tasks, uuid) || {}
        if (!task) return
        task.data = data
        task.changed = now
        return
      }
      // Create new task
      const newTask = {
        data,
        uuid: uuidv4(),
        changed: now,
        moved: now,
        subtasks: []
      }
      if (!state.selectedTask) {
        // Append to the root list
        state.tasks.push(newTask)
        state.selectedTask = newTask.uuid
        return
      }
      // Insert at the selected task location
      const { task, tasks, index } = findTask(state.tasks, state.selectedTask) || {}
      if (!task) return
      if (subtask) {
        // To the selected task subtasks
        task.subtasks.push(newTask)
        task.expanded = true
      } else {
        // Or next to the selected task
        tasks.splice(index + 1, 0, newTask)
      }
      state.selectedTask = newTask.uuid
    },
    moveTask (state, { uuid, target, index }) {
      if (uuid === target) return
      const { task, ...source } = findTask(state.tasks, uuid)
      if (!task || findTask(task.subtasks || [], target)) return
      let targetTasks
      if (target) {
        const { task: targetTask } = findTask(state.tasks, target) || {}
        if (!targetTask) return
        targetTask.expanded = true
        targetTasks = targetTask.subtasks
      } else targetTasks = state.tasks
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
      if (state?.demandedTask?.uuid === uuid) state.demandedTask = undefined
      const match = findTask(state.tasks, uuid)
      if (!match) return
      match.tasks.splice(match.index, 1)
      if (state.selectedTask !== uuid) return
      if (match.previous) state.selectedTask = match.previous
      else if (match.next) state.selectedTask = match.next
      else state.selectedTask = undefined
    },
    expandTask (state, uuid) {
      const { task } = findTask(state.tasks, uuid) || {}
      if (task) task.expanded = !task.expanded
    },
    selectTask (state, uuid) {
      if (uuid && !findTask(state.tasks, uuid)) return
      state.selectedTask = uuid
    },
    demandTask (state, value) {
      state.demandedTask = value
    }
  }
})

store.dispatch('init')

export default store
