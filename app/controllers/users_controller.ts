import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import UserType from '#models/user_type'
import { createUserValidator, updateUserValidator } from '../validators/user_validator.js'
import MailController from '#controllers/mail_controller'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import fs from 'fs/promises'
import path from 'path'
import { ChangePasswordDataForm, ChangePasswordResponse } from '../types/user.js'

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

      try {
        const mailController = new MailController()
        const mockRequest = { only: () => ({ email: user.email }) }
        const mockResponse = { ok: () => {}, internalServerError: () => {} }

        await mailController.sendVerification({
          request: mockRequest,
          response: mockResponse,
        } as any)
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
      }

      const userType = await UserType.find(user.user_type)

      return response.created({
        message: `User ${user.username} created successfully. Please check your email to verify your account.`,
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
        verification_sent: true,
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

      let profileFileName = user.profile

      if (payload.profile) {
        try {
          const uploadDir = app.makePath('storage/uploads/profiles')

          try {
            await fs.access(uploadDir)
          } catch {
            await fs.mkdir(uploadDir, { recursive: true })
          }

          if (user.profile) {
            const oldImagePath = app.makePath('storage/uploads/profiles', user.profile)
            try {
              await fs.unlink(oldImagePath)
            } catch {
              // Ignore
            }
          }
          const fileExtension = path.extname(payload.profile.clientName || '')
          const fileName = `${cuid()}${fileExtension}`

          await payload.profile.move(uploadDir, { name: fileName })

          profileFileName = fileName
        } catch (uploadError) {
          return response.badRequest({
            message: 'Failed to upload profile image',
            error: uploadError.message,
          })
        }
      }

      const { profile, ...restPayload } = payload

      const cleanPayload = Object.fromEntries(
        Object.entries(restPayload).filter(([_, value]) => value !== undefined)
      )

      if (profileFileName !== undefined && profileFileName !== null) {
        cleanPayload.profile = profileFileName
      }

      await user.merge(cleanPayload).save()

      const profileImageUrl = user.profile
        ? `${process.env.TUNNEL_URL}/api/profile-image/${user.profile}`
        : null

      return response.ok({
        message: `Profile updated successfully.`,
        user: {
          id: user.id,
          fname: user.fname,
          lname: user.lname,
          username: user.username,
          email: user.email,
          profile: user.profile,
          profile_image_url: profileImageUrl,
        },
      })
    } catch (error) {
      if (error.messages) {
        const fileErrors = error.messages.profile
        if (fileErrors) {
          if (fileErrors.some((msg: string) => msg.includes('size'))) {
            return response.badRequest({
              message: 'Profile image size exceeds the 10MB limit.',
              errors: error.messages,
            })
          }
          if (fileErrors.some((msg: string) => msg.includes('extnames'))) {
            return response.badRequest({
              message: 'Invalid profile image format. Only JPG, JPEG, and PNG are allowed.',
              errors: error.messages,
            })
          }
        }
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

  // get current authenticated user
  async me({ auth, response }: HttpContext) {
    try {
      const user = await auth.use('api').authenticate()

      // Get user type
      const userType = await UserType.find(user.user_type)

      const profileImageUrl = user.profile
        ? `${process.env.TUNNEL_URL}/api/profile-image/${user.profile}`
        : null

      return response.ok({
        id: user.id,
        user_type: userType ? userType.name : null,
        fname: user.fname,
        lname: user.lname,
        username: user.username,
        email: user.email,
        profile: user.profile,
        profile_image_url: profileImageUrl,
      })
    } catch (error) {
      return response.unauthorized({
        message: 'Unauthorized access',
      })
    }
  }

  // change password (authenticated)
  async changePassword({auth, response, request}: HttpContext)
  {
    try {
      const user = await auth.use('api').authenticate()

      const data: ChangePasswordDataForm = request.only(['current_pass', 'new_pass', 'confirm'])

      // validate
      if (data.new_pass !== data.confirm){
        return response.badRequest({
          message: "New Password and Confirm Password doesn't match"
        })
      }
      // check if all inputs are filled.
      if (!data.current_pass || !data.new_pass || !data.confirm){
        return response.badRequest({
          message: 'All password fields are required.'
        })
      }
      // verify current pass
      const isMatch = await user.verifyPassword(data.current_pass)
      if (!isMatch){
        return response.badRequest({
          message: "Current Password is incorrect"
        })
      }
       // update password
      user.password = data.new_pass
      await user.save()

      const res: ChangePasswordResponse = {
        message: 'Password changed successfully.',
        status: true,
      }

      return response.ok(res)
    } catch (error) {
      return response.internalServerError({
        message: 'An error occurred while changing the password.',
        error: error.message,
      })
    }
  }
}
