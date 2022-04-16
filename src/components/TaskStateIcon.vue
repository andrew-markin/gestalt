<template>
  <v-tooltip bottom open-delay="500">
    <template #activator="{ on, attrs }">
      <v-icon
        :class="{ 'muted-2': muted }"
        v-bind="attrs" v-on="on">
        {{ icon }}
      </v-icon>
    </template>
    <span>{{ tootip }}</span>
  </v-tooltip>
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
    tootip () {
      switch (this.state) {
        case TaskStates.Set: return this.$t('TASK_STATE_SET_TOOLTIP')
        case TaskStates.InProgress: return this.$t('TASK_STATE_IN_PROGRESS_TOOLTIP')
        case TaskStates.Complete: return this.$t('TASK_STATE_COMPLETE_TOOLTIP')
        default: return undefined
      }
    },
    muted () {
      return this.state === TaskStates.Set
    }
  }
}
</script>
