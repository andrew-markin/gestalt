import { getFirestore, doc, runTransaction } from 'firebase/firestore'
import { getIdFromKey, pack, unpack, digest, timestamp } from '../utils'
import { initializeApp } from 'firebase/app'
import { v4 as uuidv4 } from 'uuid'
import Prefs from './prefs'
import Tasks from './tasks'
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
      return Prefs.getValue(state.prefs, name)
    },
    getTask: (state) => (uuid) => {
      const { task } = Tasks.findOne(state.tasks, uuid) || {}
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
          Tasks.transferExpanded(state.tasks, consensus.context.tasks)
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
      Tasks.recomputeStates(state.tasks)
    },
    setKey (state, value) {
      state.key = value
    },
    setDigest (state, value) {
      state.digest = value
    },
    setPref (state, { name, value }) {
      Prefs.setValue(state.prefs, name, value)
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
    },
    reorderTask (state, { parent, from, to }) {
      const tasks = Tasks.findSubtasks(state.tasks, parent)
      if (!tasks) return
      const task = tasks.splice(from, 1)[0]
      task.moved = timestamp()
      tasks.splice(to, 0, task)
    },
    deleteTask (state, uuid) {
      if (!uuid) return
      if (state?.demandedTask?.uuid === uuid) state.demandedTask = undefined
      const match = Tasks.findOne(state.tasks, uuid)
      if (!match) return
      match.task.deleted = true
      Tasks.recomputeStates(state.tasks)
      if (state.selectedTask !== uuid) return
      if (match.previous) state.selectedTask = match.previous
      else if (match.next) state.selectedTask = match.next
      else state.selectedTask = undefined
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
