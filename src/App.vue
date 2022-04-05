<template>
  <v-app>
    <v-app-bar
      app
      elevation="2"
      elevate-on-scroll
      color="foreground">
      <v-container class="d-flex py-0 noselect overflow-x-hidden">
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
        <div
          id="title"
          class="d-flex align-center text-h5 overflow-x-hidden pr-4"
          @click="setPrefsDialogShown(true)">
          <span class="font-weight-medium mr-2">Gestalt:</span>
          <span
            class="text-truncate"
            :class="{ 'muted-1': !title }">
            {{ title || 'Untitled' }}
          </span>
          <v-badge
            class="ml-2"
            dot offset-y="-6"
            :value="modified">
          </v-badge>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          depressed class="ml-2"
          @click="demandTask({})">
          <v-icon left>add</v-icon>
          Task
        </v-btn>
        <v-btn
          depressed class="ml-2"
          @click="demandTask({ subtask: true })"
          :disabled="!selectedTask">
          <v-icon left>add</v-icon>
          Subtask
        </v-btn>
        <v-menu transition="slide-y-transition" offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              depressed
              class="nominwidth pa-2 ml-2"
              v-bind="attrs"
              v-on="on">
              <v-icon>menu</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item link @click="copyLink">
              <v-icon left>share</v-icon>
              Copy link
            </v-list-item>
            <v-list-item link @click="newGestalt">
              <v-icon left>open_in_new</v-icon>
              New Gestalt
            </v-list-item>
            <v-list-item link @click="cloneGestalt">
              <v-icon left>content_copy</v-icon>
              Clone Gestalt
            </v-list-item>
            <v-list-item link @click="reopenAllTasks">
              <v-icon left>radio_button_unchecked</v-icon>
              Reopen all tasks
            </v-list-item>
            <v-list-item link @click="toggleDarkTheme">
              <v-icon left>invert_colors</v-icon>
              Toggle color theme
            </v-list-item>
          </v-list>
        </v-menu>
      </v-container>
    </v-app-bar>
    <prefs-dialog></prefs-dialog>
    <task-dialog></task-dialog>
    <v-main class="background">
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import PrefsDialog from './components/PrefsDialog.vue'
import TaskDialog from './components/TaskDialog.vue'

export default {
  components: {
    PrefsDialog,
    TaskDialog
  },
  computed: {
    ...mapState(['selectedTask']),
    ...mapGetters(['modified', 'getPref']),
    title () {
      return this.getPref('title')
    }
  },
  watch: {
    title () {
      document.title = this.title || 'Gestalt'
    }
  },
  methods: {
    ...mapActions([
      'copyLink',
      'newGestalt',
      'cloneGestalt',
      'reopenAllTasks'
    ]),
    ...mapMutations([
      'setPrefsDialogShown',
      'demandTask'
    ]),
    toggleDarkTheme () {
      const dark = !this.$vuetify.theme.dark
      this.$vuetify.theme.dark = dark
      localStorage.setItem('dark', dark)
    }
  }
}
</script>

<style>
html {
  overflow-y: auto;
}
.noselect {
  -webkit-touch-callout: none; /* iOS Safari */
  -webkit-user-select: none; /* Safari */
  -khtml-user-select: none; /* Konqueror HTML */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* Internet Explorer/Edge */
  user-select: none; /* Non-prefixed version, currently supported by Chrome and Opera */
}
.muted-1 {
  opacity: 0.5;
}
.muted-2 {
  opacity: 0.25;
}
.v-icon {
  transition: none !important;
}
.nominwidth {
  min-width: 0 !important
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
#title {
  cursor: pointer;
}
</style>
