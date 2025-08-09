import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pig_sales'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('pig_sale_no')
      table.integer('pig_no').unsigned().references('pigs.pig_no').onDelete('CASCADE')
      table.string('sold_to', 20).notNullable()
      table.decimal('sales_price', 6,2).notNullable()
      table.date('sold_date').notNullable()
      table.decimal('sold_weight', 6,2).notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}