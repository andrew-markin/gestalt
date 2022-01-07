import { getIdFromKey, pack, unpack } from './utils'
import { TaskStates } from './consts'
import { v4 as uuidv4 } from 'uuid'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const importTasks = (tasks) => {
  return tasks.map(({ uuid, subtasks, expanded, state, ...rest }) => ({
    uuid: uuid || uuidv4(),
    subtasks: importTasks(subtasks || []),
    expanded: expanded || false,
    state: state || 0,
    computed: { state: undefined },
    ...rest
  }))
}

const exportTasks = (tasks) => {
  return tasks.map(({ subtasks, expanded, computed, ...rest }) => ({
    ...(subtasks.length > 0) && { subtasks: exportTasks(subtasks) },
    ...(expanded) && { expanded },
    ...rest
  }))
}

const findTask = (root, uuid) => {
  if (!root || !uuid) return
  let tasks = root
  let index = 0
  const stack = []
  let previous, result
  while (tasks) {
    if (index >= tasks.length) {
      [tasks, index] = stack.pop() || []
      continue
    }
    const task = tasks[index]
    if (result) return { ...result, next: task.uuid }
    if (task.uuid === uuid) result = { task, tasks, index, previous }
    else previous = task.uuid
    index += 1
    if (task.subtasks.length > 0) {
      stack.push([tasks, index])
      tasks = task.subtasks
      index = 0
    }
  }
  return result
}

const findTasks = (root, uuid) => {
  if (!uuid) return root
  const { task } = findTask(root, uuid)
  if (task) return task.subtasks || []
}

const updateComputedStates = (tasks) => {
  for (const task of tasks) {
    updateComputedStates(task.subtasks)
    let state = task.data.state
    for (const subtask of task.subtasks) {
      if (state === TaskStates.InProgress) break
      if (state === subtask.computed.state) continue
      state = TaskStates.InProgress
      break
    }
    task.computed.state = state
  }
}

const store = new Vuex.Store({
  state: {
    key: undefined,
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
    load ({ commit }, key) {
      const id = getIdFromKey(key)
      const json = unpack(localStorage.getItem(id), key)
      const tasks = importTasks((json && JSON.parse(json)) || [])
      commit('update', { key, tasks })
    },
    save ({ state }) {
      const id = getIdFromKey(state.key)
      const json = JSON.stringify(exportTasks(state.tasks))
      localStorage.setItem(id, pack(json, state.key))
    },
    async upsertTask ({ commit, dispatch }, { uuid, subtask, data }) {
      commit('upsertTask', { uuid, subtask, data })
      await dispatch('save')
    },
    async moveTask ({ commit, dispatch }, { uuid, target, index }) {
      commit('moveTask', { uuid, target, index })
      await dispatch('save')
    },
    async reorderTask ({ commit, dispatch }, { parent, from, to }) {
      commit('reorderTask', { parent, from, to })
      await dispatch('save')
    },
    async deleteTask ({ commit, dispatch }, uuid) {
      commit('deleteTask', uuid)
      await dispatch('save')
    },
    async expandTask ({ commit, dispatch }, uuid) {
      if (!uuid) return
      commit('expandTask', uuid)
      await dispatch('save')
    }
  },
  mutations: {
    update (state, { key, tasks }) {
      state.key = key
      state.tasks = tasks
      updateComputedStates(state.tasks)
    },
    upsertTask (state, { uuid, subtask, data }) {
      const now = Date.now()
      if (uuid) {
        // Update existing task
        const { task } = findTask(state.tasks, uuid) || {}
        if (!task) return
        task.data = data
        task.changed = now
        updateComputedStates(state.tasks)
        return
      }
      // Create new task
      const newTask = {
        data,
        uuid: uuidv4(),
        changed: now,
        moved: now,
        subtasks: [],
        computed: { state: undefined }
      }
      if (!state.selectedTask) {
        // Append to the root list
        state.tasks.push(newTask)
        updateComputedStates(state.tasks)
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
      updateComputedStates(state.tasks)
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
      updateComputedStates(state.tasks)
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
      updateComputedStates(state.tasks)
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

export default store
