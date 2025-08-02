import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class ExtractTokenMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    const token = request.cookie('token')

    if (token && !request.header('authorization')) {
      request.request.headers['authorization'] = `Bearer ${token}`
    }

    await next()
  }
}
