import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserType from '#models/user_type'
import { UserWithSoftDeletes, UserResponse } from '../types/user.js'

export default class TrashedUsersController {
  private async formatUserResponse(user: UserWithSoftDeletes): Promise<UserResponse> {
    const userType = await UserType.find(user.user_type)

    return {
      id: user.id,
      user_type: userType ? userType.name : null,
      username: user.username,
      email: user.email,
      fname: user.fname,
      lname: user.lname,
      profile: user.profile,
    }
  }

  // restore user
  async update({ params, response }: HttpContext) {
    try {
      const user = (await User.withTrashed()
        .where('id', params.id)
        .firstOrFail()) as UserWithSoftDeletes

      if (!user.deletedAt) {
        return response.badRequest({
          message: `'User ${user.username} is not blocked.'`,
        })
      }
      await user.restore()
      const userResponse = await this.formatUserResponse(user)

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

      if (users.length === 0) {
        return response.ok({
          message: 'No trashed users found.',
          users: [],
        })
      }
      const userResponses: UserResponse[] = await Promise.all(
        users.map((user) => this.formatUserResponse(user))
      )

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
