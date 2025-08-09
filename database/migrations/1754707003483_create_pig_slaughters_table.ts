import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pig_slaughters'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('pig_slghtr_no')
      table.integer('pig_no').unsigned().references('pigs.pig_no').onDelete('CASCADE')
      table.decimal('slghtr_price').notNullable()
      table.date('slghtr_date').notNullable()
      table.decimal('slghtr_weight', 10, 2).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}