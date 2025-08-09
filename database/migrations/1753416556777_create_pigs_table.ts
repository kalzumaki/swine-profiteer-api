import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pigs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('pig_no')
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.enum('pig_type', ['breeding', 'fattening', 'weaning']).notNullable()
      table.string('name', 20).notNullable()
      table.string('batch_code', 20).notNullable()
      table.string('color', 20).notNullable()
      table.date('dob').nullable()
      table.date('purchase_date').nullable()
      table.decimal('capital' , 10, 2).nullable()
      table.string('profile', 100).nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}