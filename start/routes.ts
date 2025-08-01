import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import { throttle } from '#start/limiter'

// models
import User from '#models/user'
// controllers
import SessionController from '#controllers/session_controller'
import UsersController from '#controllers/users_controller'
import TrashedUsersController from '#controllers/trashed_users_controller'
import MailController from '#controllers/mail_controller'
import { HttpContext } from '@adonisjs/core/http'
const extractTokenFromCookie = async ({ request }: HttpContext, next: () => Promise<void>) => {
  const token = request.cookie('token')

  if (token && !request.header('authorization')) {
    request.request.headers['authorization'] = `Bearer ${token}`
  }

  await next()
}
router
  // default route
  .get('/', async () => {
    return {
      message: 'Swine Profiteer API',
      version: '1.0.0',
    }
  })
  .use(throttle)

// login
router.post('/login', [SessionController, 'store']).use(throttle)

// register
router.post('/register', [UsersController, 'store']).use(throttle)

// email verification
router.post('/send-verification', [MailController, 'sendVerification']).use(throttle)
router.get('/verify-email', [MailController, 'showVerificationForm']) // Show form
router.post('/verify-email', [MailController, 'verifyEmail']).use(throttle) // Process verification
router.post('/resend-verification', [MailController, 'resendVerification']).use(throttle)

// auth guard
router
  .group(() => {
    // logout
    router.delete('/logout', [SessionController, 'destroy'])

    // get current user
    router.get('/me', [UsersController, 'me'])

    // user management
    router.put('/user/:id', [UsersController, 'update']) // update user
    router.delete('/block/:id', [UsersController, 'destroy']) // block user

    router.put('/profile', [UsersController, 'updateProfile']) // update current user profile
    // trashed users management
    router.put('/restore/:id', [TrashedUsersController, 'update']) // restore user
    router.get('/trashed/users', [TrashedUsersController, 'index']) // all blocked users

    // tokens
    router.get('/tokens', async ({ auth }) => {
      return User.accessTokens.all(auth.user!)
    })
  })
  .use([extractTokenFromCookie, middleware.auth({ guards: ['api'] }), middleware.tokenExpiration()])
