import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class TokenExpirationMiddleware {
 async handle(ctx: HttpContext, next: NextFn) {
    try {
      await next()
    } catch (error) {
      if (error.status === 401 && error.code === 'E_INVALID_AUTH_TOKEN') {
        ctx.response.clearCookie('token')
        
        return ctx.response.unauthorized({
          message: 'Your session has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        })
      }
      
      throw error
    }
  }
}