import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import { throttle } from '#start/limiter'

// models
import User from '#models/user'
// controllers
import SessionController from '#controllers/session_controller'
import UsersController from '#controllers/users_controller'
import TrashedUsersController from '#controllers/trashed_users_controller'

router
  // default route
  .get('/', async () => {
    return {
      hello: 'world',
    }
  })
  .use(throttle)

// login
router.post('/login', [SessionController, 'store']).use(throttle)

// auth guard
router
  .group(() => {
    // logout
    router.delete('/logout', [SessionController, 'destroy'])

    // block user
    router.delete('/block/:id', [UsersController, 'destroy'])

    // restore user
    router.put('/restore/:id', [TrashedUsersController, 'update'])

    // all tokens
    router.get('/tokens', async ({ auth }) => {
      return User.accessTokens.all(auth.user!)
    })
    // all trashed users
    router.get('/trashed/users', [TrashedUsersController, 'index'])
  })
  .use(middleware.auth({ guards: ['api'] }))
