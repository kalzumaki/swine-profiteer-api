import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserType from '#models/user_type'
import { UserWithSoftDeletes } from '../types/user.js'
interface CustomCookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'lax' | 'strict' | 'none' | boolean
  maxAge: number
  path: string
}
export default class SessionController {
  //login
  async store({ request, auth, response }: HttpContext) {
    try {
      const { username, password } = request.only(['username', 'password'])
      if (!username || !password) {
        return response.badRequest('Username and password are required')
      }

      const userCheck = (await User.withTrashed()
        .where('username', username)
        .first()) as UserWithSoftDeletes | null

      if (!userCheck) {
        return response.unauthorized({
          message: 'Account not found. Please check your username or register for a new account.',
        })
      }

      if (userCheck.deletedAt) {
        return response.forbidden({
          message: 'Your account has been blocked. Please contact administrator.',
        })
      }

      const user = await User.verifyCredentials(username, password)
      if (!user.isEmailVerified) {
        return response.forbidden({
          message:
            'Please verify your email address before logging in. Check your inbox for a verification email.',
          email: user.email,
          requires_verification: true,
        })
      }
      // find the user's user type
      const userType = await UserType.find(user.user_type)

      const token = await auth.use('api').createToken(user, ['*'], {
        name: `${user.username}-login-token`,
      })
      const isProduction: boolean = process.env.NODE_ENV === 'production'

      const cookieOptions: CustomCookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 60 * 60,
        path: '/',
      }

      response.cookie('token', token.value!.release(), cookieOptions)

      return response.ok({
        message: 'Login successful',
        user: {
          id: user.id,
          user_type: userType ? userType.name : null,
        },
      })
    } catch (error) {
      if (error.message === 'Invalid user credentials') {
        return response.unauthorized({
          message: 'Incorrect password. Please try again.',
        })
      }

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

      const isProduction: boolean = process.env.NODE_ENV === 'production'

      const cookieOptions: CustomCookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      }

      response.clearCookie('token', cookieOptions)

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
