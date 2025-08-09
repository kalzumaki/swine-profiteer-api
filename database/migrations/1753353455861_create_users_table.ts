import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table
        .integer('user_type')
        .unsigned()
        .references('user_types.id')
        .onDelete('RESTRICT')
        .notNullable()
      table.string('fname', 20).notNullable()
      table.string('lname', 20).notNullable()
      table.string('email', 254).notNullable().unique()
      table.boolean('is_email_verified').defaultTo(false).notNullable()
      table.string('verification_token', 100).nullable()
      table.timestamp('verification_expires_at').nullable()
      table.timestamp('email_verified_at').nullable()
      table.string('username', 20).notNullable().unique()
      table.string('password', 255).notNullable()
      table.string('profile', 100).nullable()
      table.timestamp('deleted_at').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
