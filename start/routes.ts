import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import { throttle } from '#start/limiter'
// controllers
import SessionController from '#controllers/session_controller'

router.get('/', async () => {
  return {
    hello: 'world',
  }
}).use(throttle)
// login
router.post('/login', [SessionController, 'store']).use(throttle)

// auth guard
router
  .group(() => {
    // logout
    router.delete('/logout', [SessionController, 'destroy'])
  })
  .use(middleware.auth({ guards: ['api'] }))
