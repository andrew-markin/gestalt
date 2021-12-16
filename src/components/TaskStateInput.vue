<template>
  <div class="d-flex justify-space-between">
    <v-chip
      class="text-button"
      :ripple="false"
      :color="value === 0 ? 'success' : undefined"
      @click="$emit('input', 0)">
      Open
      <v-icon right>radio_button_unchecked</v-icon>
    </v-chip>
    <v-icon>east</v-icon>
    <v-chip
      class="text-button"
      :color="value === 1 ? 'success' : undefined"
      @click="$emit('input', 1)">
      In Progress
      <v-icon right>contrast</v-icon>
    </v-chip>
    <v-icon>east</v-icon>
    <v-chip
      class="text-button"
      :color="value === 2 ? 'success' : undefined"
      @click="$emit('input', 2)">
      Complete
      <v-icon right>circle</v-icon>
    </v-chip>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: Number, default: 0 }
  }
}
</script>
