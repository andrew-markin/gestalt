<template>
  <v-dialog
    max-width="600"
    v-model="visible">
    <v-card class="pa-5">
      <div class="d-flex align-center">
        <span class="text-h5 mr-10">Task</span>
        <task-state-input
          class="d-inline flex-grow-1"
          v-model="state">
        </task-state-input>
      </div>
      <v-form
        ref="form"
        v-model="valid"
        lazy-validation>
        <v-textarea
          autofocus
          label="Description"
          class="mt-5 mb-5"
          rows="6" no-resize
          counter="256"
          v-model="description"
          required :rules="descriptionRules"
          @focus="moveCursorToEnd"
          @keydown.enter.ctrl.exact.prevent="description += '\n'"
          @keydown.enter.exact.prevent="$refs.saveButton.$el.click()">
        </v-textarea>
      </v-form>
      <div class="d-flex">
        <v-btn
          v-if="task"
          depressed dark color="deep-orange"
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
          :disabled="!demandedTask || !valid"
          @click="save">
          Save
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import TaskStateInput from './TaskStateInput.vue'
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'

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
    moveCursorToEnd (event) {
      const element = event.target
      const position = element.value.length
      element.setSelectionRange(position, position)
    },
    async save () {
      if (!this.demandedTask || !this.$refs.form.validate()) return
      if (!this.task || (this.description !== this.task.data.description) ||
          (this.state !== this.task.data.state)) {
        const { uuid, subtask } = this.demandedTask
        await this.upsertTask({
          uuid,
          subtask,
          data: {
            description: this.description.trim(),
            state: this.state
          }
        })
      }
      this.demandTask()
    }
  }
}
</script>
