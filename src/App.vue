<template>
  <v-app>
    <v-app-bar
      app
      color="white"
      elevation="2"
      elevate-on-scroll>
      <v-container class="py-0 fill-height">
        <v-avatar
          class="mr-3"
          size="32">
          <div id="favicon">
            <object
              type="image/svg+xml"
              data="favicon.svg"
              width="100%"
              height="100%">
            </object>
          </div>
        </v-avatar>
        <span class="text-h5 mr-3">Gestalt</span>
        <v-spacer></v-spacer>
        <v-btn
          depressed
          @click="openTask()">
          New Task
        </v-btn>
      </v-container>
    </v-app-bar>
    <task-dialog></task-dialog>
    <v-main class="grey lighten-4">
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import TaskDialog from './components/TaskDialog.vue'
import { mapMutations } from 'vuex'

export default {
  components: {
    TaskDialog
  },
  methods: mapMutations(['openTask'])
}
</script>

<style>
.noselect {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently supported by Chrome and Opera */
}
</style>

<style scoped>
#favicon {
  --favicon-extent: 32px;
  width: var(--favicon-extent);
  height: var(--favicon-extent);
  min-width: var(--favicon-extent);
  min-height: var(--favicon-extent);
  max-width: var(--favicon-extent);
  max-height: var(--favicon-extent);
  display: inline-block;
}
</style>
