<template>
  <v-icon :class="{ 'muted-2': muted }">{{ icon }}</v-icon>
</template>

<script>
import { mdiCircleOutline, mdiCircleHalfFull, mdiCircle } from '@mdi/js'
import { TaskStates } from '../consts'

export default {
  props: {
    state: { type: Number, default: TaskStates.Set }
  },
  computed: {
    icon () {
      switch (this.state) {
        case TaskStates.Set: return mdiCircleOutline
        case TaskStates.InProgress: return mdiCircleHalfFull
        case TaskStates.Complete: return mdiCircle
        default: return undefined
      }
    },
    muted () {
      return this.state === TaskStates.Set
    }
  }
}
</script>
