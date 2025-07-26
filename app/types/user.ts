import User from '#models/user'

// interface for soft delete methods
export interface SoftDeletesMethods {
    restore(): Promise<void>
    trashed(): boolean
}

// extending User model with soft delete methods
export type UserWithSoftDeletes = User & SoftDeletesMethods

// response for user data
export interface UserResponse {
    id: number
    user_type: string | null
    fname: string
    lname: string
    username: string
    email: string
    profile?: string | null
}

// login response
export interface UserLoginResponse {
    message: string
    type: string
    token: string
    token_expires_at: Date
    user: UserResponse
}

// interface for register response
export interface UserRegisterResponse {
    message: string
    user: UserResponse
}