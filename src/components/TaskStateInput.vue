<template>
  <div class="d-inline">
    <v-btn
      v-for="state of states" :key="state.value"
      depressed rounded class="ml-1"
      :color="state.value === value && state.color || undefined"
      :class="{ 'muted-1': state.value !== value }"
      :text="state.value !== value"
      @click="$emit('input', state.value) && blur()">
      {{ state.title }}
      <v-icon right>{{ state.icon }}</v-icon>
    </v-btn>
  </div>
</template>

<script>
import { mdiCircle, mdiCircleHalfFull, mdiCircleOutline } from '@mdi/js'

import { TaskStates } from '../consts'

export default {
  props: {
    value: { type: Number, default: 0 }
  },
  computed: {
    states () {
      return [{
        value: TaskStates.Set,
        title: this.$t('TASK_STATE_SET'),
        icon: mdiCircleOutline,
        color: undefined
      }, {
        value: TaskStates.InProgress,
        title: this.$t('TASK_STATE_IN_PROGRESS'),
        icon: mdiCircleHalfFull,
        color: 'primary'
      }, {
        value: TaskStates.Complete,
        title: this.$t('TASK_STATE_COMPLETE'),
        icon: mdiCircle,
        color: 'success'
      }]
    },
    blur () {
      let focusable = this.$el.parentElement
      while (focusable && (focusable.getAttribute('tabindex') !== '0')) {
        focusable = focusable.parentElement
      }
      return () => { focusable && focusable.focus() }
    }
  }
}
</script>
