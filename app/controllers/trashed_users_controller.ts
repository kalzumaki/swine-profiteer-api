import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class TrashedUsersController {
  // restore user
  async update({ params, response }: HttpContext) {
    try {
      const user = await User.withTrashed().where('id', params.id).firstOrFail()

      await (user as any).restore()

      return response.ok({
        message: `User ${(user as any).username} restored successfully.`,
        user: {
          id: (user as any).id,
          username: (user as any).username,
          email: (user as any).email,
          fname: (user as any).fname,
          lname: (user as any).lname,
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred while restoring the user.',
        error: error.message,
      })
    }
  }
}
