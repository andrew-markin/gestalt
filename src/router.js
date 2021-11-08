import Vue from 'vue'
import VueRouter from 'vue-router'

import TaskBoard from './views/TaskBoard.vue'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [{
    name: 'board',
    path: '/',
    component: TaskBoard
  }, {
    path: '*',
    redirect: { name: 'board' }
  }]
})
