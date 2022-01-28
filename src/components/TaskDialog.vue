<template>
  <v-dialog
    max-width="600"
    v-model="visible">
    <v-card class="pa-5">
      <div class="d-flex align-center">
        <span class="text-h5">Task</span>
        <v-spacer/><task-state-input v-model="state"/>
      </div>
      <v-form
        ref="form"
        v-model="valid"
        lazy-validation>
        <v-textarea
          autofocus
          label="Description"
          class="my-5"
          rows="6" no-resize
          counter="256"
          v-model="description"
          required :rules="descriptionRules"
          @focus="$moveCursorToEnd"
          @keydown.enter.ctrl.exact.prevent="description += '\n'"
          @keydown.enter.exact.prevent="$refs.saveButton.$el.click()">
        </v-textarea>
      </v-form>
      <div class="d-flex">
        <v-btn
          v-if="task"
          depressed
          @click="deleteTask(task.uuid)">
          Delete
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          depressed
          class="mr-3"
          @click="visible = false">
          Close
        </v-btn>
        <v-btn
          ref="saveButton"
          depressed color="primary"
          :disabled="!visible || !valid || !modified"
          @click="save">
          Save
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import TaskStateInput from './TaskStateInput.vue'

export default {
  components: {
    TaskStateInput
  },
  data: () => ({
    description: '',
    descriptionRules: [
      (value) => (!!value && (value.trim().length > 0)) || 'Description is required',
      (value) => (value.length <= 256) || 'Description must be less than or equal to 256 characters'
    ],
    state: 0,
    valid: true
  }),
  computed: {
    ...mapState(['demandedTask']),
    ...mapGetters(['getTask']),
    visible: {
      get () {
        return !!this.demandedTask
      },
      set (value) {
        if (!value) this.demandTask()
      }
    },
    task () {
      const { uuid } = this.demandedTask || {}
      return this.getTask(uuid)
    },
    trimmedDescription () {
      return this.description.trim()
    },
    modified () {
      if (!this.task) return true
      if (!this.task.data) return false
      const { description, state } = this.task.data
      return (this.trimmedDescription !== description) || (this.state !== state)
    }
  },
  watch: {
    demandedTask () {
      if (this.task) {
        const { description, state } = this.task.data || {}
        this.description = description || ''
        this.state = state || 0
      } else {
        this.description = ''
        this.state = 0
      }
      if (this.$refs.form) this.$refs.form.resetValidation()
    }
  },
  methods: {
    ...mapActions(['upsertTask', 'deleteTask']),
    ...mapMutations(['demandTask']),
    async save () {
      if (!this.demandedTask || !this.modified ||
          !this.$refs.form.validate()) return
      const { uuid, subtask } = this.demandedTask
      await this.upsertTask({
        uuid,
        subtask,
        data: {
          description: this.trimmedDescription,
          state: this.state
        }
      })
      this.visible = false
    }
  }
}
</script>
