import { generateKey } from './utils'
import TaskBoard from './views/TaskBoard.vue'
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [{
    name: 'board',
    path: '/:key([a-zA-Z0-9]{43})',
    component: TaskBoard
  }, {
    path: '*',
    redirect: {
      name: 'board',
      params: { key: generateKey() }
    }
  }]
})
