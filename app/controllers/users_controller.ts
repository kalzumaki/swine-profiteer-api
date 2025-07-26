import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserType from '#models/user_type'
import { createUserValidator, updateUserValidator } from '../validators/user_validator.js'

export default class UsersController {
  // block user
  async destroy({ params, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)

      // Check if user is already blocked
      if (user.deletedAt) {
        return response.badRequest({
          message: `User ${user.username} is already blocked.`,
        })
      }

      await user.delete()

      return response.ok({
        message: `User ${user.username} blocked successfully.`,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred while blocking the user.',
        error: error.message,
      })
    }
  }

  // create new user
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createUserValidator)

      const userData = {
        ...payload,
        user_type: payload.user_type || 2,
      }

      const user = await User.create(userData)

      const userType = await UserType.find(user.user_type)

      return response.created({
        message: `User ${user.username} created successfully.`,
        user: {
          id: user.id,
          user_type: user.user_type,
          user_type_name: userType ? userType.name : null,
          fname: user.fname,
          lname: user.lname,
          username: user.username,
          email: user.email,
          profile: user.profile,
        },
      })
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          message: 'Validation failed',
          errors: error.messages,
        })
      }

      if (error.code === 'ER_DUP_ENTRY' || error.constraint) {
        let message = 'Duplicate entry found.'
        if (error.constraint?.includes('username')) {
          message = 'Username is already taken. Please choose a different one.'
        } else if (error.constraint?.includes('email')) {
          message = 'Email is already registered. Please use a different email address.'
        }

        return response.badRequest({
          message: 'Validation failed',
          errors: [{ field: 'duplicate', message }],
        })
      }

      return response.internalServerError({
        message: 'An error occurred while creating the user.',
        error: error.message,
      })
    }
  }

  // update user (admin )
  async update({ params, request, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)

      const payload = await request.validateUsing(updateUserValidator, {
        meta: { userId: params.id },
      })

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined)
      )

      await user.merge(cleanPayload).save()

      const userType = await UserType.find(user.user_type)

      return response.ok({
        message: `User ${user.username} updated successfully.`,
        user: {
          id: user.id,
          user_type: user.user_type,
          user_type_name: userType ? userType.name : null,
          fname: user.fname,
          lname: user.lname,
          username: user.username,
          email: user.email,
          profile: user.profile,
        },
      })
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          message: 'Validation failed',
          errors: error.messages,
        })
      }

      if (error.code === 'ER_DUP_ENTRY' || error.constraint) {
        let message = 'Duplicate entry found.'
        if (error.constraint?.includes('username')) {
          message = 'Username is already taken. Please choose a different one.'
        } else if (error.constraint?.includes('email')) {
          message = 'Email is already registered. Please use a different email address.'
        }

        return response.badRequest({
          message: 'Validation failed',
          errors: [{ field: 'duplicate', message }],
        })
      }

      if (error.status === 404) {
        return response.notFound({
          message: 'User not found',
        })
      }

      return response.internalServerError({
        message: 'An error occurred while updating the user.',
        error: error.message,
      })
    }
  }
  // update current authenticated user profile
  async updateProfile({ request, auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.unauthorized('You must be logged in to update your profile.')
      }
      const user = auth.user!

      const payload = await request.validateUsing(updateUserValidator, {
        meta: { userId: user.id },
      })

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined)
      )

      await user.merge(cleanPayload).save()

      const userType = await UserType.find(user.user_type)

      return response.ok({
        message: `Profile updated successfully.`,
        user: {
          id: user.id,
          user_type: user.user_type,
          user_type_name: userType ? userType.name : null,
          fname: user.fname,
          lname: user.lname,
          username: user.username,
          email: user.email,
          profile: user.profile,
        },
      })
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          message: 'Validation failed',
          errors: error.messages,
        })
      }

      if (error.code === 'ER_DUP_ENTRY' || error.constraint) {
        let message = 'Duplicate entry found.'
        if (error.constraint?.includes('username')) {
          message = 'Username is already taken. Please choose a different one.'
        } else if (error.constraint?.includes('email')) {
          message = 'Email is already registered. Please use a different email address.'
        }

        return response.badRequest({
          message: 'Validation failed',
          errors: [{ field: 'duplicate', message }],
        })
      }

      return response.internalServerError({
        message: 'An error occurred while updating your profile.',
        error: error.message,
      })
    }
  }

  // get current authenticated user profile
  async profile({ auth, response }: HttpContext) {
    try {
      if (!auth.user) {
        return response.unauthorized('You must be logged in to view your profile.')
      }

      const user = auth.user!
      const userType = await UserType.find(user.user_type)

      return response.ok({
        message: 'Profile retrieved successfully.',
        user: {
          id: user.id,
          user_type: user.user_type,
          user_type_name: userType ? userType.name : null,
          fname: user.fname,
          lname: user.lname,
          username: user.username,
          email: user.email,
          profile: user.profile,
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred while retrieving your profile.',
        error: error.message,
      })
    }
  }
}
