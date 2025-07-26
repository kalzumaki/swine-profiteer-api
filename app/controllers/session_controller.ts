import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserType from '#models/user_type'
import { UserWithSoftDeletes } from '../types/user.js'
export default class SessionController {
  //login
  async store({ request, auth, response }: HttpContext) {
    try {
      const { username, password } = request.only(['username', 'password'])
      if (!username || !password) {
        return response.badRequest('Username and password are required')
      }

      const userCheck = await User.withTrashed().where('username', username).first() as UserWithSoftDeletes | null

      if (!userCheck) {
        return response.unauthorized('Invalid credentials')
      }

      if ((userCheck).deletedAt) {
        return response.forbidden({
          message: 'Your account has been blocked. Please contact administrator.',
        })
      }

      const user = await User.verifyCredentials(username, password)

      // find the user's user type
      const userType = await UserType.find(user.user_type)

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
          user_type: userType ? userType.name : null,
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
