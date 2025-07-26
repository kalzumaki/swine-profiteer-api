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

// register
router.post('/register', [UsersController, 'store']).use(throttle)

// auth guard
router
  .group(() => {
    // logout
    router.delete('/logout', [SessionController, 'destroy'])

    // user management
    router.put('/user/:id', [UsersController, 'update']) // update user
    router.delete('/block/:id', [UsersController, 'destroy']) // block user
    router.get('/profile', [UsersController, 'profile']) // get current user profile
    router.put('/profile', [UsersController, 'updateProfile']) // update current user profile
    // trashed users management
    router.put('/restore/:id', [TrashedUsersController, 'update']) // restore user
    router.get('/trashed/users', [TrashedUsersController, 'index']) // all blocked users

    // tokens
    router.get('/tokens', async ({ auth }) => {
      return User.accessTokens.all(auth.user!)
    })
  })
  .use(middleware.auth({ guards: ['api'] }))
