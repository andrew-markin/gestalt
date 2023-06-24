<template>
  <v-dialog
    max-width="650"
    overlay-color="grey darken-3"
    v-model="visible">
    <v-card class="pa-5 rounded-lg">
      <span class="text-h5">{{ $t('GESTALT') }}</span>
      <v-form
        ref="form"
        v-model="valid"
        lazy-validation>
        <v-text-field
          autofocus
          :label="$t('TITLE')"
          class="my-5"
          v-model="title"
          :placeholder="$t('UNTITLED')"
          :rules="titleRules"
          counter="64"
          @focus="$moveCursorToEnd"
          @keydown.enter.exact.prevent="$refs.saveButton.$el.click()">
        </v-text-field>
      </v-form>
      <div class="d-flex">
        <v-spacer></v-spacer>
        <v-tooltip bottom open-delay="500">
          <template #activator="{ on, attrs }">
            <v-btn
              depressed class="mr-3"
              v-bind="attrs" v-on="on"
              @click="visible = false">
              {{ $t('CLOSE_DIALOG') }}
            </v-btn>
          </template>
          <span>{{ $t('CLOSE_DIALOG_TOOLTIP') }}</span>
        </v-tooltip>
        <v-tooltip bottom open-delay="500">
          <template #activator="{ on, attrs }">
            <v-btn
              ref="saveButton"
              depressed color="primary"
              :disabled="!visible || !valid || !modified"
              v-bind="attrs" v-on="on"
              @click="save">
              {{ $t('SAVE_DIALOG') }}
            </v-btn>
          </template>
          <span>{{ $t('SAVE_DIALOG_TOOLTIP') }}</span>
        </v-tooltip>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'

export default {
  data: () => ({
    title: '',
    valid: true
  }),
  computed: {
    ...mapState(['prefsDialogShown']),
    ...mapGetters(['getPref']),
    visible: {
      get () {
        return !!this.prefsDialogShown
      },
      set (value) {
        if (!value) this.setPrefsDialogShown(false)
      }
    },
    titleRules () {
      return [
        (value) => (value.length <= 64) || this.$t('TITLE_LENGTH_LIMIT_MESSAGE')
      ]
    },
    savedTitle () {
      return this.getPref('title')
    },
    trimmedTitle () {
      return this.title.trim() || undefined
    },
    modified () {
      return this.trimmedTitle !== this.savedTitle
    }
  },
  watch: {
    prefsDialogShown (value) {
      this.title = (value && this.savedTitle) || ''
      if (this.$refs.form) this.$refs.form.resetValidation()
    }
  },
  methods: {
    ...mapActions(['setPref']),
    ...mapMutations(['setPrefsDialogShown']),
    async save () {
      if (!this.visible || !this.modified || !this.$refs.form.validate()) return
      await this.setPref({ name: 'title', value: this.trimmedTitle })
      this.visible = false
    }
  }
}
</script>
