import { v4 as uuidv4 } from 'uuid'
import { TaskStates } from '../consts'

const extend = (tasks) => {
  return tasks.map(({ uuid, subtasks, expanded, deleted, state, ...rest }) => ({
    uuid: uuid || uuidv4(),
    subtasks: extend(subtasks || []),
    expanded: expanded || false,
    deleted: deleted || false,
    computed: { state: undefined },
    ...rest
  }))
}

const reduce = (tasks, remote = false) => {
  return tasks.map(({ subtasks, expanded, deleted, created, computed, ...rest }) => ({
    ...(subtasks.length > 0) && { subtasks: reduce(subtasks, remote) },
    ...(!remote && expanded) && { expanded },
    ...(!remote && deleted) && { deleted },
    ...(!remote && created) && { created },
    ...rest
  }))
}

const findOne = (root, uuid) => {
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

const findSubtasks = (root, uuid) => {
  if (!uuid) return root
  const { task } = findOne(root, uuid)
  if (task) return task.subtasks || []
}

const recomputeStates = (tasks) => {
  for (const task of tasks) {
    if (task.deleted) continue
    recomputeStates(task.subtasks)
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

const merge = (local, remote) => {
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

  const mergeTasks = (local, remote) => {
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
        subtasks: mergeTasks(undefined, remoteTask.subtasks)
      }
    }
    if (!remoteTask) {
      return {
        ...localTask,
        subtasks: mergeTasks(localTask.subtasks, undefined)
      }
    }
    return {
      ...(gte(localTask.changed, remoteTask.changed) ? localTask : remoteTask),
      moved: Math.max((localTask.moved || 0), (remoteTask.moved || 0)),
      subtasks: mergeTasks(localTask.subtasks, remoteTask.subtasks),
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

  return cleanup(mergeTasks(local, remote))
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

export default {
  extend,
  reduce,
  findOne,
  findSubtasks,
  recomputeStates,
  merge,
  transferExpanded
}
