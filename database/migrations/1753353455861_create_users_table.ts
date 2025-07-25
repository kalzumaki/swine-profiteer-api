import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.integer('user_type').unsigned().references('user_types.id').onDelete('RESTRICT').notNullable()
      table.string('fname').notNullable()
      table.string('lname').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('username', 50).notNullable().unique()
      table.string('password').notNullable()
      table.string('profile').nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}