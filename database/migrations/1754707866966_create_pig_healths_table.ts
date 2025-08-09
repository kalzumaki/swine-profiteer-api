import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pig_healths'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('pig_health_no')
      table.integer('pig_no').unsigned().references('pigs.pig_no').onDelete('CASCADE')
      table.boolean('is_healthy').defaultTo(true).notNullable()
      table.string('health_report', 100).nullable()
      table.date('checked_at').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}