import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class SessionController {
  //login
  async store({ request, auth, response }: HttpContext) {
    try {
      const { username, password } = request.only(['username', 'password'])
      if (!username || !password) {
        return response.badRequest('Username and password are required')
      }

      const userCheck = await User.withTrashed().where('username', username).first()

      if (!userCheck) {
        return response.unauthorized('Invalid credentials')
      }

      if ((userCheck as any).deletedAt) {
        return response.forbidden({
          message: 'Your account has been blocked. Please contact administrator.',
        })
      }

      const user = await User.verifyCredentials(username, password)

      const token = await auth.use('api').createToken(user, ['*'], {
        name: `${user.username}-login-token`,
      })
      return response.ok({
        message: 'Login successful',
        type: token.type,
        token: token.value!.release(),
        token_expires_at: token.expiresAt,
        user: {
          id: user.id,
          fname: user.fname,
          lname: user.lname,
          username: user.username,
          email: user.email,
          profile: user.profile,
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred during login. Please try again.',
        error: error.message,
      })
    }
  }
  //logout
  async destroy({ auth, response }: HttpContext) {
    try {
      await auth.use('api').invalidateToken()
      return response.ok({
        message: 'Logout successful',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred during logout. Please try again.',
        error: error.message,
      })
    }
  }
}
