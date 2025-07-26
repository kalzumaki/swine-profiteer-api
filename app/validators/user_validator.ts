import vine from '@vinejs/vine'

// for creating a new user
export const createUserValidator = vine.compile(
  vine.object({
    user_type: vine.number().min(1).optional(),
    fname: vine.string().trim().minLength(2).maxLength(50),
    lname: vine.string().trim().minLength(2).maxLength(50),
    username: vine.string().trim().minLength(3).maxLength(30).unique(async (db, value) => {
      const user = await db.from('users').where('username', value).first()
      if (user) {
        throw new Error('Username is already taken. Please choose a different one.')
      }
      return true
    }),
    email: vine.string().email().unique(async (db, value) => {
      const user = await db.from('users').where('email', value).first()
      if (user) {
        throw new Error('Email is already registered. Please use a different email address.')
      }
      return true
    }),
    password: vine.string().minLength(6).maxLength(100),
  })
)

// for updating an existing user
export const updateUserValidator = vine.compile(
  vine.object({
    user_type: vine.number().min(1).optional(),
    fname: vine.string().trim().minLength(2).maxLength(50).optional(),
    lname: vine.string().trim().minLength(2).maxLength(50).optional(),
    username: vine.string().trim().minLength(3).maxLength(30).unique(async (db, value, field) => {
      // Exclude current user when checking uniqueness
      const userId = field.meta.userId || 0
      const user = await db.from('users').where('username', value).whereNot('id', userId).first()
      if (user) {
        throw new Error('Username is already taken. Please choose a different one.')
      }
      return true
    }).optional(),
    email: vine.string().email().unique(async (db, value, field) => {
      // Exclude current user when checking uniqueness
      const userId = field.meta.userId || 0
      const user = await db.from('users').where('email', value).whereNot('id', userId).first()
      if (user) {
        throw new Error('Email is already registered. Please use a different email address.')
      }
      return true
    }).optional(),
    password: vine.string().minLength(6).maxLength(100).optional(),
  })
)