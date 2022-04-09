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
        <v-menu transition="slide-y-transition" offset-y>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              depressed
              class="nominwidth pa-2 ml-2"
              v-bind="attrs"
              v-on="on">
              <v-icon>{{ mdiMenu }}</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item link @click="copyLink">
              <v-icon left>{{ mdiLinkVariant }}</v-icon>
              {{ $t('COPY_LINK') }}
            </v-list-item>
            <v-list-item link @click="newGestalt">
              <v-icon left>{{ mdiOpenInNew }}</v-icon>
              {{ $t('NEW_GESTALT') }}
            </v-list-item>
            <v-list-item link @click="cloneGestalt">
              <v-icon left>{{ mdiContentDuplicate }}</v-icon>
              {{ $t('CLONE_GESTALT') }}
            </v-list-item>
            <v-list-item link @click="resetAllTasks">
              <v-icon left>{{ mdiCircleOutline }}</v-icon>
              {{ $t('RESET_ALL_TASKS') }}
            </v-list-item>
            <v-list-item link @click="toggleDarkTheme">
              <v-icon left>{{ mdiInvertColors }}</v-icon>
              {{ $t('TOGGLE_COLOR_THEME') }}
            </v-list-item>
            <v-subheader>
              {{ $t('APP_LANGUAGE') }}
            </v-subheader>
            <v-list-item-group v-model="$i18n.locale">
              <v-list-item
                v-for="locale in locales"
                :key="locale.value"
                :value="locale.value">
                <v-list-item-title>
                  <v-icon left>{{ mdiTranslate }}</v-icon>
                  {{ locale.title }}
                </v-list-item-title>
              </v-list-item>
            </v-list-item-group>
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
import { preferLocale } from './i18n'
import PrefsDialog from './components/PrefsDialog.vue'
import TaskDialog from './components/TaskDialog.vue'

import {
  mdiPlus, mdiMenu, mdiLinkVariant, mdiOpenInNew, mdiContentDuplicate,
  mdiCircleOutline, mdiInvertColors, mdiTranslate
} from '@mdi/js'

export default {
  components: {
    PrefsDialog,
    TaskDialog
  },
  data: () => ({
    mdiPlus,
    mdiMenu,
    mdiLinkVariant,
    mdiOpenInNew,
    mdiContentDuplicate,
    mdiCircleOutline,
    mdiInvertColors,
    mdiTranslate
  }),
  computed: {
    ...mapState(['selectedTask']),
    ...mapGetters(['synced', 'getPref']),
    title () {
      return this.getPref('title')
    },
    locales () {
      return this.$i18n.availableLocales.map((locale) => ({
        value: locale,
        title: this.$t('_LOCALE_TITLE', locale)
      }))
    }
  },
  watch: {
    title () {
      this.updateTitle()
    },
    '$i18n.locale': function (value) {
      preferLocale(value)
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
      document.title = this.title || this.$t('GESTALT')
    },
    toggleDarkTheme () {
      const dark = !this.$vuetify.theme.dark
      this.$vuetify.theme.dark = dark
      localStorage.setItem('dark', dark)
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
