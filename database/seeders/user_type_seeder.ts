import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserType from '#models/user_type'
import User from '#models/user'
export default class extends BaseSeeder {
  async run() {
    await UserType.createMany([
      { name: 'admin', },
      { name: 'pig raiser', },
    ])
    await User.create({
      user_type: 1,
      fname: 'Admin',
      lname: 'User',
      email: 'admin.test@gmail.com',
      username: 'admin',
      password: 'Admin@123',
    })
  }
}