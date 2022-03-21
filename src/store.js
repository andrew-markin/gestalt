import { getFirestore, doc, runTransaction } from 'firebase/firestore'
import { getIdFromKey, pack, unpack, digest } from './utils'
import { initializeApp } from 'firebase/app'
import { TaskStates } from './consts'
import { v4 as uuidv4 } from 'uuid'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

// Initialize Firebase

initializeApp({
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VUE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_FIREBASE_APP_ID
})

const db = getFirestore()

// Utilities

const unifyPrefs = (prefs) => {
  return prefs.map(({ name, value, changed }) => ({ name, value, changed }))
}

const importTasks = (tasks) => {
  return tasks.map(({ uuid, subtasks, expanded, deleted, state, ...rest }) => ({
    uuid: uuid || uuidv4(),
    subtasks: importTasks(subtasks || []),
    expanded: expanded || false,
    deleted: deleted || false,
    computed: { state: undefined },
    ...rest
  }))
}

const exportTasks = (tasks, remote = false) => {
  return tasks.map(({ subtasks, expanded, deleted, created, computed, ...rest }) => ({
    ...(subtasks.length > 0) && { subtasks: exportTasks(subtasks, remote) },
    ...(!remote && expanded) && { expanded },
    ...(!remote && deleted) && { deleted },
    ...(!remote && created) && { created },
    ...rest
  }))
}

const unpackContext = (data, key) => {
  const json = unpack(data, key)
  const { prefs, tasks } = (json && JSON.parse(json)) || {}
  return {
    prefs: unifyPrefs(prefs || []),
    tasks: importTasks(tasks || [])
  }
}

const packContext = ({ prefs, tasks }, key, remote = false) => {
  return pack(JSON.stringify({
    prefs: unifyPrefs(prefs),
    tasks: exportTasks(tasks, remote)
  }), key)
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
    if (task.deleted) continue
    updateComputedStates(task.subtasks)
    let state = task.data.state
    for (const subtask of task.subtasks) {
      if (subtask.deleted) continue
      if (state === TaskStates.InProgress) break
      if (state === subtask.computed.state) continue
      state = TaskStates.InProgress
      break
    }
    task.computed.state = state
  }
}

const mergePrefs = (localPrefs, remotePrefs) => {
  const mergedPrefsMap = new Map()
  for (const localPref of localPrefs || []) {
    mergedPrefsMap.set(localPref.name, localPref)
  }
  for (const remotePref of remotePrefs || []) {
    const localPref = mergedPrefsMap.get(remotePref.name)
    if (!localPref || (remotePref.changed > localPref.changed)) {
      mergedPrefsMap.set(remotePref.name, remotePref)
    }
  }
  return Array.from(mergedPrefsMap.values())
}

const mergeTasks = (local, remote) => {
  const buildLookupMap = (tasks) => {
    const result = new Map()
    const populateResult = (tasks) => {
      for (const task of tasks || []) {
        result.set(task.uuid, task)
        populateResult(task.subtasks)
      }
    }
    populateResult(tasks)
    return result
  }

  const localLookupMap = buildLookupMap(local)
  const remoteLookupMap = buildLookupMap(remote)
  const mergedTasks = new Set()

  // Helper functions
  const gt = (left, right) => (left || 0) > (right || 0)
  const gte = (left, right) => (left || 0) >= (right || 0)

  const Merge = {
    BOTH: 0,
    LOCAL: 1,
    REMOTE: 2
  }

  const merge = (local, remote) => {
    const localTasks = local || []
    const remoteTasks = remote || []
    let localIndex = 0
    let remoteIndex = 0
    const result = []
    const addToResult = (uuid) => {
      mergedTasks.add(uuid)
      result.push(resolveTask(uuid))
    }
    while (true) {
      const localTask = localTasks[localIndex]
      const remoteTask = remoteTasks[remoteIndex]
      if (!localTask && !remoteTask) break
      let decision
      if (!localTask) decision = Merge.REMOTE
      else if (!remoteTask) decision = Merge.LOCAL
      else if (localTask.uuid === remoteTask.uuid) decision = Merge.BOTH
      else if (gte(remoteTask.moved, localTask.moved)) decision = Merge.REMOTE
      else decision = Merge.LOCAL
      if (decision === Merge.LOCAL) {
        localIndex++
        if (mergedTasks.has(localTask.uuid)) continue
        const checkTask = remoteLookupMap.get(localTask.uuid)
        if (checkTask && gt(checkTask.moved, localTask.moved)) continue
        addToResult(localTask.uuid)
      } else if (decision === Merge.REMOTE) {
        remoteIndex++
        if (mergedTasks.has(remoteTask.uuid)) continue
        const checkTask = localLookupMap.get(remoteTask.uuid)
        if (checkTask && gt(checkTask.moved, remoteTask.moved)) continue
        addToResult(remoteTask.uuid)
      } else /* decision === Merge.BOTH */ {
        localIndex++
        remoteIndex++
        addToResult(localTask.uuid)
      }
    }
    return result
  }

  const resolveTask = (uuid) => {
    const localTask = localLookupMap.get(uuid)
    const remoteTask = remoteLookupMap.get(uuid)
    if (!localTask && !remoteTask) return undefined
    if (!localTask) {
      return {
        ...remoteTask,
        subtasks: merge(undefined, remoteTask.subtasks)
      }
    }
    if (!remoteTask) {
      return {
        ...localTask,
        subtasks: merge(localTask.subtasks, undefined)
      }
    }
    return {
      ...(gte(localTask.changed, remoteTask.changed) ? localTask : remoteTask),
      moved: Math.max((localTask.moved || 0), (remoteTask.moved || 0)),
      subtasks: merge(localTask.subtasks, remoteTask.subtasks),
      expanded: localTask.expanded,
      deleted: localTask.deleted
    }
  }

  const cleanup = (tasks) => {
    const result = []
    for (const task of tasks) {
      if (!task || task.deleted || (!task.created && !remoteLookupMap.has(task.uuid))) continue
      task.subtasks = cleanup(task.subtasks)
      task.created = false // Reset 'locally created' state
      result.push(task)
    }
    return result
  }

  return cleanup(merge(local, remote))
}

const mergeContexts = (local, remote) => {
  return {
    prefs: mergePrefs(local.prefs, remote.prefs),
    tasks: mergeTasks(local.tasks, remote.tasks)
  }
}

const transferExpanded = (source, target) => {
  const expanded = new Set()
  const copyExpanded = (tasks) => {
    for (const task of tasks || []) {
      if (task.expanded) expanded.add(task.uuid)
      copyExpanded(task.subtasks)
    }
  }
  const pasteExpanded = (tasks) => {
    for (const task of tasks || []) {
      if (expanded.has(task.uuid)) task.expanded = true
      pasteExpanded(task.subtasks)
    }
  }
  copyExpanded(source)
  pasteExpanded(target)
}

const getTimestamp = () => {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000)
}

const store = new Vuex.Store({
  state: {
    key: undefined,
    prefs: [],
    tasks: [],
    digest: undefined, // rename to stamp?
    prefsDialogShown: false,
    selectedTask: undefined,
    demandedTask: undefined
  },
  getters: {
    getPref: (state) => (name) => {
      const pref = state.prefs.find(pref => pref.name === name) || {}
      return pref.value
    },
    getTask: (state) => (uuid) => {
      if (!uuid) return undefined
      const { task } = findTask(state.tasks, uuid) || {}
      return task
    }
  },
  actions: {
    saveLocal ({ state }, { name, value }) {
      const id = getIdFromKey(state.key)
      localStorage.setItem(`gestalt:${id}:${name}`, value)
    },
    loadLocal ({ state }, name) {
      const id = getIdFromKey(state.key)
      return localStorage.getItem(`gestalt:${id}:${name}`)
    },
    async load ({ commit, dispatch }, key) {
      commit('setKey', key)
      const data = await dispatch('loadLocal', 'data')
      commit('setContext', unpackContext(data, key))
      const digest = await dispatch('loadLocal', 'digest')
      commit('setDigest', digest)
    },
    save ({ state, dispatch }) {
      dispatch('saveLocal', {
        name: 'data',
        value: packContext(state, state.key)
      })
      // const id = getIdFromKey(state.key)
      // localStorage.setItem(id, packContext(state, state.key))
    },
    setDigest ({ state, commit, dispatch }, value) {
      if (state.digest === value) return
      commit('setDigest', value)
      dispatch('saveLocal', { name: 'digest', value })
      // TODO: If value is undefined then start sync timer
    },
    async sync ({ state, commit, dispatch }) {
      console.log('Syncing...')
      try {
        const id = getIdFromKey(state.key)
        const consensus = {}
        await runTransaction(db, async (transaction) => {
          const docRef = doc(db, 'gestalts', id)
          const obj = await transaction.get(docRef)
          let { data } = (obj && obj.data()) || {}

          if (data) {
            const remote = {
              digest: digest(data),
              context: unpackContext(data, state.key)
            }

            if (state.digest) {
              // There are no local changes...
              if (state.digest !== remote.digest) {
                // There are remote changes...
                consensus.context = remote.context
                consensus.digest = remote.digest
              }
              return
            }
            consensus.context = mergeContexts(state, remote.context)
          }

          data = packContext(consensus.context || state, state.key, true)
          await transaction.set(docRef, { data })
          consensus.digest = digest(data)
        })
        if (consensus.context) {
          transferExpanded(state.tasks, consensus.context.tasks)
          commit('setContext', consensus.context)
          await dispatch('save')
        }
        if (consensus.digest) {
          await dispatch('setDigest', consensus.digest)
        }
        console.log('Done.')
      } catch (err) {
        console.error('Error updating document:', err)
      }
    },
    async setPref ({ commit, dispatch }, { name, value }) {
      commit('setPref', { name, value })
      await dispatch('setDigest', undefined)
      await dispatch('save')
    },
    async upsertTask ({ commit, dispatch }, { uuid, subtask, data }) {
      commit('upsertTask', { uuid, subtask, data })
      await dispatch('setDigest', undefined)
      await dispatch('save')
    },
    async moveTask ({ commit, dispatch }, { uuid, target, index }) {
      commit('moveTask', { uuid, target, index })
      await dispatch('setDigest', undefined)
      await dispatch('save')
    },
    async reorderTask ({ commit, dispatch }, { parent, from, to }) {
      commit('reorderTask', { parent, from, to })
      await dispatch('setDigest', undefined)
      await dispatch('save')
    },
    async deleteTask ({ commit, dispatch }, uuid) {
      commit('deleteTask', uuid)
      await dispatch('setDigest', undefined)
      await dispatch('save')
    },
    async expandTask ({ commit, dispatch }, uuid) {
      if (!uuid) return
      commit('expandTask', uuid)
      await dispatch('save')
    }
  },
  mutations: {
    setContext (state, { prefs, tasks }) {
      state.prefs = prefs
      state.tasks = tasks
      updateComputedStates(state.tasks)
    },
    setKey (state, value) {
      state.key = value
    },
    setDigest (state, value) {
      state.digest = value
    },
    setPref (state, { name, value }) {
      const now = getTimestamp()
      const pref = state.prefs.find(pref => pref.name === name)
      if (pref) {
        pref.value = value
        pref.changed = now
      } else {
        state.prefs.push({ name, value, changed: now })
      }
    },
    setPrefsDialogShown (state, value = true) {
      state.prefsDialogShown = value
    },
    upsertTask (state, { uuid, subtask, data }) {
      const now = getTimestamp()
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
        expanded: false,
        deleted: false,
        created: true, // Created locally
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
      task.moved = getTimestamp()
      updateComputedStates(state.tasks)
    },
    reorderTask (state, { parent, from, to }) {
      const tasks = findTasks(state.tasks, parent)
      if (!tasks) return
      const task = tasks.splice(from, 1)[0]
      task.moved = getTimestamp()
      tasks.splice(to, 0, task)
    },
    deleteTask (state, uuid) {
      if (!uuid) return
      if (state?.demandedTask?.uuid === uuid) state.demandedTask = undefined
      const match = findTask(state.tasks, uuid)
      if (!match) return
      match.task.deleted = true
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
