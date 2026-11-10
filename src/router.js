import Vue from 'vue'
import VueRouter from 'vue-router'

import { generateKey } from './utils'
import TaskBoard from './views/TaskBoard.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [{
    name: 'board',
    path: '/:key([a-zA-Z0-9]{43})',
    component: TaskBoard
  }, {
    path: '*',
    // Generate a fresh key on every redirect (not once at module load)
    redirect: () => ({
      name: 'board',
      params: { key: generateKey() }
    })
  }]
})
