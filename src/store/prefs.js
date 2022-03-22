import { timestamp } from '../utils'

const unify = (prefs) => {
  return prefs.map(({ name, value, changed }) => ({ name, value, changed }))
}

const getValue = (prefs, name) => {
  const pref = prefs.find(pref => pref.name === name) || {}
  return pref.value
}

const setValue = (prefs, name, value) => {
  const now = timestamp()
  const pref = prefs.find(pref => pref.name === name)
  if (pref) {
    pref.value = value
    pref.changed = now
  } else {
    prefs.push({ name, value, changed: now })
  }
}

const merge = (localPrefs, remotePrefs) => {
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

export default {
  unify,
  getValue,
  setValue,
  merge
}
