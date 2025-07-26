import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserType from '#models/user_type'
import User from '#models/user'
export default class extends BaseSeeder {
  async run() {
    await UserType.createMany([{ name: 'admin' }, { name: 'hog raiser' }])
    await User.createMany([
      {
        user_type: 1,
        fname: 'Admin',
        lname: 'User',
        email: 'admin.test@gmail.com',
        username: 'admin',
        password: 'Admin@123',
      },
      {
        user_type: 2,
        fname: 'Hog',
        lname: 'Raiser',
        email: 'hog.raiser@gmail.com',
        username: 'hograiser',
        password: 'Hog@123',
      },
    ])
  }
}
