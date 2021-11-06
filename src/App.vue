<template>
  <v-app>
    <v-app-bar
      app
      color="white"
      flat>
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
        <v-btn text>New Task</v-btn>
      </v-container>
    </v-app-bar>
    <v-main class="grey lighten-4">
    </v-main>
  </v-app>
</template>

<script>
export default {
}
</script>

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
