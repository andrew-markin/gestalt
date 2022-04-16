<template>
  <v-app :key="$i18n.locale">
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
        <v-tooltip bottom open-delay="500">
          <template #activator="{ on, attrs }">
            <div
              id="title"
              class="d-flex align-center text-h5 overflow-x-hidden pr-4"
              @click="setPrefsDialogShown(true)"
              v-bind="attrs" v-on="on">
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
          </template>
          <span>{{ $t('GESTALT_TITLE_TOOLTIP') }}</span>
        </v-tooltip>
        <v-spacer></v-spacer>
        <v-tooltip bottom open-delay="500">
          <template #activator="{ on, attrs }">
            <v-btn
              depressed class="ml-2"
              @click="demandTask({})"
              v-bind="attrs" v-on="on">
              <v-icon left>{{ mdiPlus }}</v-icon>
              {{ $t('TASK') }}
            </v-btn>
          </template>
          <span>{{ $t('NEW_TASK_TOOLTIP') }}</span>
        </v-tooltip>
        <v-tooltip bottom open-delay="500">
          <template #activator="{ on, attrs }">
            <v-btn
              depressed class="ml-2"
              @click="demandTask({ subtask: true })"
              :disabled="!selectedTask"
              v-bind="attrs" v-on="on">
              <v-icon left>{{ mdiPlus }}</v-icon>
              {{ $t('SUBTASK') }}
            </v-btn>
          </template>
          <span>{{ $t('NEW_SUBTASK_TOOLTIP') }}</span>
        </v-tooltip>
        <v-menu
          open-on-hover transition="slide-y-transition" offset-y>
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
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import { mdiPlus, mdiMenu } from '@mdi/js'
import { preferLocale } from './i18n'
import AppMenuList from './components/AppMenuList.vue'
import PrefsDialog from './components/PrefsDialog.vue'
import TaskDialog from './components/TaskDialog.vue'

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
    ...mapActions([
      'copyLink',
      'newGestalt',
      'cloneGestalt',
      'resetAllTasks'
    ]),
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
