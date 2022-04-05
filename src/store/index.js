import { generateKey, keyToRef, pack, unpack, timestamp, adjustTimestamp } from '../utils'
import { Mutex } from 'async-mutex'
import { v4 as uuidv4 } from 'uuid'
import copyToClipboard from 'copy-to-clipboard'
import io from 'socket.io-client'
import Prefs from './prefs'
import router from '../router'
import Tasks from './tasks'
import Vue from 'vue'
import Vuex from 'vuex'

const SYNC_DELAY = 2000
const SYNC_ENSURE_INTERVAL = 30000
const SYNC_ATTEMPTS_COUNT = 10

Vue.use(Vuex)

// Utilities

const unpackContext = (data, key) => {
  const json = unpack(data, key)
  const { prefs, tasks } = (json && JSON.parse(json)) || {}
  return {
    prefs: Prefs.unify(prefs || []),
    tasks: Tasks.extend(tasks || [])
  }
}

const packContext = ({ prefs, tasks }, key, remote = false) => {
  return pack(JSON.stringify({
    prefs: Prefs.unify(prefs),
    tasks: Tasks.reduce(tasks, remote)
  }), key)
}

const mergeContexts = (local, remote) => {
  return {
    prefs: Prefs.merge(local.prefs, remote.prefs),
    tasks: Tasks.merge(local.tasks, remote.tasks)
  }
}

const getBoardLink = (key) => {
  const route = router.resolve({ name: 'board', params: { key } })
  return new URL(route.href, window.location.href).href
}

// Socket.IO setup

const socket = io(process.env.VUE_APP_BACKEND, {
  transports: ['websocket']
})

socket.on('connect', async () => {
  // Adjust local timestams
  let localTimestamp = Date.now()
  const { timestamp: remoteTimestamp } = await submit('now')
  localTimestamp = Math.floor((localTimestamp + Date.now()) / 2)
  adjustTimestamp(remoteTimestamp - localTimestamp)
  store.dispatch('setupSocket')
})

socket.on('changed', () => {
  store.dispatch('sync')
})

const submit = (event, ...args) => {
  return new Promise((resolve, reject) => {
    if (!socket.connected) return reject(new Error('Socket is not connected'))
    socket.emit(event, ...args, (res) => {
      const { error, ...rest } = res || {}
      if (error) reject(new Error(error))
      else resolve(rest)
    })
  })
}

const sleep = (timeout) => {
  return new Promise((resolve) => {
    setTimeout(() => { resolve() }, timeout)
  })
}

let syncTimeout

const syncLater = () => {
  clearTimeout(syncTimeout)
  syncTimeout = setTimeout(() => {
    syncTimeout = undefined
    store.dispatch('sync')
  }, SYNC_DELAY)
}

setInterval(() => {
  store.dispatch('syncIfNeeded')
}, SYNC_ENSURE_INTERVAL)

const syncMutex = new Mutex()

const store = new Vuex.Store({
  state: {
    key: undefined,
    prefs: [],
    tasks: [],
    saved: true,
    version: undefined,
    prefsDialogShown: false,
    selectedTask: undefined,
    demandedTask: undefined
  },
  getters: {
    synced (state) {
      return state.version || ((state.prefs.length === 0) &&
                               (state.tasks.length === 0))
    },
    getPref: (state) => (name) => {
      return Prefs.getValue(state.prefs, name)
    },
    getTask: (state) => (uuid) => {
      const { task } = Tasks.findOne(state.tasks, uuid) || {}
      return task
    }
  },
  actions: {
    async setupSocket ({ state, dispatch }) {
      if (!socket.connected) return
      await submit('ref', keyToRef(state.key))
      await dispatch('sync')
    },
    async resetSocket () {
      if (!socket.connected) return
      await submit('ref', undefined)
    },
    saveLocal ({ state }, { name, value, key }) {
      const itemKey = `gestalt:${keyToRef(key || state.key)}:${name}`
      if (value !== undefined) localStorage.setItem(itemKey, value)
      else localStorage.removeItem(itemKey)
    },
    loadLocal ({ state }, name) {
      const itemKey = `gestalt:${keyToRef(state.key)}:${name}`
      return localStorage.getItem(itemKey) || undefined
    },
    async load ({ commit, dispatch }, key) {
      const release = await syncMutex.acquire()
      try {
        await dispatch('resetSocket')
        commit('setKey', key)
        const data = await dispatch('loadLocal', 'data')
        commit('setContext', unpackContext(data, key))
        const version = await dispatch('loadLocal', 'version')
        commit('setVersion', version)
        await dispatch('setupSocket')
      } catch (err) {
        console.warn('Unable to load state:', err.message)
      } finally {
        release()
      }
    },
    async save ({ state, dispatch, commit }) {
      await dispatch('saveLocal', {
        name: 'data',
        value: packContext(state, state.key)
      })
      commit('setSaved', true)
    },
    async saveIfNeeded ({ state, dispatch }) {
      if (state.saved) return
      await dispatch('save')
      await dispatch('setVersion', undefined)
    },
    copyLink ({ state }) {
      copyToClipboard(getBoardLink(state.key))
    },
    newGestalt () {
      window.open(getBoardLink(generateKey()))
    },
    async cloneGestalt ({ state, dispatch }) {
      const key = generateKey()
      await dispatch('saveLocal', {
        key,
        name: 'data',
        value: packContext(state, key)
      })
      window.open(getBoardLink(key))
    },
    async reopenAllTasks ({ commit, dispatch }) {
      commit('reopenAllTasks')
      await dispatch('saveIfNeeded')
    },
    async setVersion ({ state, commit, dispatch }, value) {
      if (!value) syncLater()
      if (state.version === value) return
      commit('setVersion', value)
      await dispatch('saveLocal', { name: 'version', value })
    },
    async syncIfNeeded ({ state, dispatch }) {
      if (!socket.connected || state.version || syncTimeout) return
      await dispatch('sync')
    },
    async sync ({ state, commit, dispatch }) {
      clearTimeout(syncTimeout)
      syncTimeout = undefined
      if (!socket.connected) return
      const release = await syncMutex.acquire()
      try {
        let attempts = SYNC_ATTEMPTS_COUNT
        let nextContext, nextVersion
        let res = await submit('get', { known: state.version })
        while (attempts-- > 0) { // Consensus loop
          let mergedContext
          if (res.data) {
            res.context = unpackContext(res.data, state.key)
            if (state.version) {
              // There are no local changes...
              if (state.version !== res.version) {
                // There are remote changes...
                nextContext = res.context
                nextVersion = res.version
              }
              break
            }
            mergedContext = mergeContexts(state, res.context)
          } else if ((res.version === state.version) &&
                     (res.version || ((state.prefs.length === 0) &&
                                      (state.tasks.length === 0)))) break

          const data = packContext(mergedContext || state, state.key, true)
          res = await submit('set', { data, version: res.version })
          if (res.success) {
            nextContext = mergedContext || undefined
            nextVersion = res.version
            break
          }
          await sleep(200) // Wait for a while before next attempt
        }
        if (nextContext) {
          Tasks.transferExpanded(state.tasks, nextContext.tasks)
          commit('setContext', nextContext)
          await dispatch('save')
        }
        if (nextVersion) {
          await dispatch('setVersion', nextVersion)
        }
      } catch (err) {
        console.warn('Unable to sync:', err.message)
      } finally {
        release()
      }
    },
    async setPref ({ commit, dispatch }, { name, value }) {
      const release = await syncMutex.acquire()
      try {
        commit('setPref', { name, value })
        await dispatch('saveIfNeeded')
      } catch (err) {
        console.warn('Unable to set preference:', err.message)
      } finally {
        release()
      }
    },
    async upsertTask ({ commit, dispatch }, { uuid, subtask, data }) {
      const release = await syncMutex.acquire()
      try {
        commit('upsertTask', { uuid, subtask, data })
        await dispatch('saveIfNeeded')
      } catch (err) {
        console.warn('Unable to upsert task:', err.message)
      } finally {
        release()
      }
    },
    async moveTask ({ commit, dispatch }, { uuid, target, index }) {
      const release = await syncMutex.acquire()
      try {
        commit('moveTask', { uuid, target, index })
        await dispatch('saveIfNeeded')
      } catch (err) {
        console.warn('Unable to move task:', err.message)
      } finally {
        release()
      }
    },
    async reorderTask ({ commit, dispatch }, { parent, from, to }) {
      const release = await syncMutex.acquire()
      try {
        commit('reorderTask', { parent, from, to })
        await dispatch('saveIfNeeded')
      } catch (err) {
        console.warn('Unable to reorder task:', err.message)
      } finally {
        release()
      }
    },
    async deleteTask ({ commit, dispatch }, uuid) {
      const release = await syncMutex.acquire()
      try {
        commit('deleteTask', uuid)
        await dispatch('saveIfNeeded')
      } catch (err) {
        console.warn('Unable to delete task:', err.message)
      } finally {
        release()
      }
    },
    async expandTask ({ commit, dispatch }, uuid) {
      if (!uuid) return
      const release = await syncMutex.acquire()
      try {
        commit('expandTask', uuid)
        await dispatch('save')
      } catch (err) {
        console.warn('Unable to expand task:', err.message)
      } finally {
        release()
      }
    }
  },
  mutations: {
    setContext (state, { prefs, tasks }) {
      state.prefs = prefs
      state.tasks = tasks
      Tasks.recomputeStates(state.tasks)
      state.saved = false
    },
    setKey (state, value) {
      state.key = value
    },
    setSaved (state, value) {
      state.saved = value
    },
    setVersion (state, value) {
      state.version = value
    },
    setPref (state, { name, value }) {
      Prefs.setValue(state.prefs, name, value)
      state.saved = false
    },
    setPrefsDialogShown (state, value = true) {
      state.prefsDialogShown = value
    },
    upsertTask (state, { uuid, subtask, data }) {
      const now = timestamp()
      if (uuid) {
        // Update existing task
        const { task } = Tasks.findOne(state.tasks, uuid) || {}
        if (!task) return
        task.data = data
        task.changed = now
        Tasks.recomputeStates(state.tasks)
        state.saved = false
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
        state: undefined
      }
      if (!state.selectedTask) {
        // Append to the root list
        state.tasks.push(newTask)
        Tasks.recomputeStates(state.tasks)
        state.selectedTask = newTask.uuid
        state.saved = false
        return
      }
      // Insert at the selected task location
      const { task, tasks, index } = Tasks.findOne(state.tasks, state.selectedTask) || {}
      if (!task) return
      if (subtask) {
        // To the selected task subtasks
        task.subtasks.push(newTask)
        task.expanded = true
      } else {
        // Or next to the selected task
        tasks.splice(index + 1, 0, newTask)
      }
      Tasks.recomputeStates(state.tasks)
      state.selectedTask = newTask.uuid
      state.saved = false
    },
    moveTask (state, { uuid, target, index }) {
      if (uuid === target) return
      const { task, ...source } = Tasks.findOne(state.tasks, uuid)
      if (!task || Tasks.findOne(task.subtasks || [], target)) return
      let targetTasks
      if (target) {
        const { task: targetTask } = Tasks.findOne(state.tasks, target) || {}
        if (!targetTask) return
        targetTask.expanded = true
        targetTasks = targetTask.subtasks
      } else targetTasks = state.tasks
      source.tasks.splice(source.index, 1)
      if (index === undefined) targetTasks.push(task)
      else targetTasks.splice(index, 0, task)
      task.moved = timestamp()
      Tasks.recomputeStates(state.tasks)
      state.saved = false
    },
    reorderTask (state, { parent, from, to }) {
      const tasks = Tasks.findSubtasks(state.tasks, parent)
      if (!tasks) return
      const task = tasks.splice(from, 1)[0]
      task.moved = timestamp()
      tasks.splice(to, 0, task)
      state.saved = false
    },
    deleteTask (state, uuid) {
      if (!uuid) return
      if (state?.demandedTask?.uuid === uuid) state.demandedTask = undefined
      const match = Tasks.findOne(state.tasks, uuid)
      if (!match) return
      match.task.deleted = true
      match.tasks.splice(match.index, 1)
      state.tasks.push(match.task)
      Tasks.recomputeStates(state.tasks)
      state.saved = false
      if (state.selectedTask !== uuid) return
      if (match.previous) state.selectedTask = match.previous
      else if (match.next) state.selectedTask = match.next
      else state.selectedTask = undefined
    },
    reopenAllTasks (state) {
      if (Tasks.reopenAll(state.tasks) === 0) return
      Tasks.recomputeStates(state.tasks)
      state.saved = false
    },
    expandTask (state, uuid) {
      const { task } = Tasks.findOne(state.tasks, uuid) || {}
      if (task) task.expanded = !task.expanded
    },
    selectTask (state, uuid) {
      if (uuid && !Tasks.findOne(state.tasks, uuid)) return
      state.selectedTask = uuid
    },
    demandTask (state, value) {
      state.demandedTask = value
    }
  }
})

export default store
