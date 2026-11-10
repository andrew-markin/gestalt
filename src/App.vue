<template>
  <v-app :key="$i18n.locale">
    <v-app-bar
      id="bar"
      app short flat
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
            <span class="font-weight-medium mr-2">{{ $t('GESTALT') }}:</span>
            <span
              class="text-truncate"
              :class="{ 'muted-1': !title }">
              {{ title || $t('UNTITLED') }}
            </span>
            <v-badge
              class="ml-2"
              dot offset-y="-6"
              :value="!synced">
            </v-badge>
          </div>
        <v-spacer></v-spacer>
        <v-btn
          depressed class="ml-2"
          @click="demandTask({})">
          <v-icon left>{{ mdiPlus }}</v-icon>
          {{ $t('TASK') }}
          </v-btn>
          <v-btn
            depressed class="ml-2"
            @click="demandTask({ subtask: true })"
            :disabled="!selectedTask">
            <v-icon left>{{ mdiPlus }}</v-icon>
            {{ $t('SUBTASK') }}
          </v-btn>
        <v-menu
          transition="slide-y-transition" offset-y
          content-class="rounded-lg" min-width="300">
          <template #activator="{ on, attrs }">
            <v-btn
              depressed class="nominwidth pa-2 ml-2"
              v-bind="attrs" v-on="on">
              <v-icon>{{ mdiMenu }}</v-icon>
            </v-btn>
          </template>
          <app-menu-list></app-menu-list>
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
import { mdiMenu, mdiPlus } from '@mdi/js'
import { mapGetters, mapMutations, mapState } from 'vuex'

import AppMenuList from './components/AppMenuList.vue'
import PrefsDialog from './components/PrefsDialog.vue'
import TaskDialog from './components/TaskDialog.vue'
import { preferLocale } from './i18n'

export default {
  components: {
    AppMenuList,
    PrefsDialog,
    TaskDialog
  },
  data: () => ({ mdiPlus, mdiMenu }),
  computed: {
    ...mapState(['selectedTask']),
    ...mapGetters(['synced', 'getPref']),
    title () {
      return this.getPref('title')
    }
  },
  watch: {
    title () {
      this.updateTitle()
    },
    '$i18n.locale': function (value) {
      preferLocale(value)
      this.updateTitle()
    }
  },
  methods: {
    ...mapMutations([
      'setPrefsDialogShown',
      'demandTask'
    ]),
    updateTitle () {
      document.title = `${this.$t('GESTALT')}: ${this.title || this.$t('UNTITLED')}`
    }
  },
  created () {
    this.updateTitle()
  }
}
</script>

<style>
/* Only the task area below the app bar scrolls, not the whole page */
html {
  overflow: hidden;
}
.v-main {
  height: 100vh;
  height: 100dvh;
}
.v-main__wrap {
  overflow-y: auto;
  /* Reserve space for the scrollbar, so the layout doesn't jump when it
     appears, on both sides to keep the tasks aligned with the app bar */
  scrollbar-gutter: stable both-edges;
}
/* Thin scrollbars without arrow buttons, colored like the tree lines.
   Chromium and Safari are styled with ::-webkit-scrollbar, which gives full
   control (Chromium ignores it once scrollbar-width or scrollbar-color is set),
   and Firefox, which doesn't support it, with the standard properties. */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track,
::-webkit-scrollbar-corner {
  background: transparent;
}
::-webkit-scrollbar-button {
  display: none;
}
::-webkit-scrollbar-thumb {
  background: var(--v-pipe-base);
  background-clip: padding-box;
  /* The transparent border makes the visible thumb 4px wide */
  border: 3px solid transparent;
  border-radius: 5px;
}
::-webkit-scrollbar-thumb:hover,
::-webkit-scrollbar-thumb:active {
  border-width: 2px;
}
@supports not selector(::-webkit-scrollbar) {
  html {
    scrollbar-width: thin;
    scrollbar-color: var(--v-pipe-base) transparent;
  }
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
#bar {
  border-bottom: 1px solid var(--v-border-base) !important;
}
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
