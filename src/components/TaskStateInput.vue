<template>
  <div class="d-inline">
    <v-btn
      v-for="state of states" :key="state.value"
      depressed rounded class="ml-1"
      :color="state.value === value ? 'success' : undefined"
      :text="state.value !== value"
      @click="$emit('input', state.value) && blur()">
      {{ state.title }}
      <v-icon right>{{ state.icon }}</v-icon>
    </v-btn>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: Number, default: 0 }
  },
  computed: {
    states: () => [
      { value: 0, title: 'Open', icon: 'radio_button_unchecked' },
      { value: 1, title: 'In Progress', icon: 'contrast' },
      { value: 2, title: 'Complete', icon: 'circle' }
    ],
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
