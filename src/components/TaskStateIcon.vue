<template>
  <v-icon :class="{ 'muted-2': muted }">{{ icon }}</v-icon>
</template>

<script>
import { TaskStates } from '../consts'

export default {
  props: {
    state: { type: Number, default: TaskStates.Set }
  },
  computed: {
    icon () {
      switch (this.state) {
        case TaskStates.Set: return 'radio_button_unchecked'
        case TaskStates.InProgress: return 'contrast'
        case TaskStates.Complete: return 'circle'
        default: return undefined
      }
    },
    muted () {
      return this.state === TaskStates.Set
    }
  }
}
</script>
