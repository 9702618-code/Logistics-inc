import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/stackers' // Перенаправляємо на головний екран
    },
    {
      path: '/stackers',
      name: 'stackers-list',
      component: () => import('../views/StackerListView.vue') // Ми створимо це далі
    },
    {
      path: '/stackers/:id',
      name: 'stacker-detail',
      component: () => import('../views/StackerDetailView.vue')
    },
    {
      path: '/stackers/new',
      name: 'stacker-new',
      component: () => import('../views/StackerFormView.vue')
    },
    {
      path: '/stackers/:id/edit',
      name: 'stacker-edit',
      component: () => import('../views/StackerFormView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

export default router