import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { UserWithSoftDeletes, UserResponse } from '../types/user.js'

export default class TrashedUsersController {
  // restore user
  async update({ params, response }: HttpContext) {
    try {
      const user = (await User.withTrashed()
        .where('id', params.id)
        .firstOrFail()) as UserWithSoftDeletes

      await user.restore()

      const userResponse: UserResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        profile: user.profile,
      }

      return response.ok({
        message: `User ${user.username} restored successfully.`,
        user: userResponse,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred while restoring the user.',
        error: error.message,
      })
    }
  }

  // get all trashed users
  async index({ response }: HttpContext) {
    try {
      const users = (await User.onlyTrashed().exec()) as UserWithSoftDeletes[]

      const userResponses: UserResponse[] = users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        profile: user.profile,
      }))

      return response.ok({
        message: 'Trashed users retrieved successfully.',
        users: userResponses,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch trashed users.',
        error: error.message,
      })
    }
  }
}
