import Vue from 'vue'
import VueRouter from 'vue-router'

import { generateKey } from './crypto'
import TaskBoard from './views/TaskBoard.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [{
    name: 'board',
    path: '/:key([0-9a-fA-F]{64})',
    component: TaskBoard
  }, {
    path: '*',
    redirect: {
      name: 'board',
      params: { key: generateKey() }
    }
  }]
})
