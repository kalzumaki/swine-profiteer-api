import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pigs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('user_id').unsigned().references('users.id').onDelete('CASCADE')
      table.integer('pig_type_id').unsigned().references('pig_types.id').onDelete('RESTRICT')
      table.string('name').notNullable()
      table.string('batch_code').notNullable()
      table.string('color').notNullable()
      table.date('dob').nullable()
      table.date('purchase_date').nullable()
      table.decimal('capital' , 10, 2).nullable()
      table.string('sold_to').nullable()
      table.decimal('sale_price', 10, 2).nullable()
      table.date('sold_date').nullable()
      table.decimal('sold_weight', 10, 2).nullable()
      table.enum('status', ['active', 'sold', 'butchered', 'dead']).notNullable().defaultTo('active');
      table.decimal('slaughter_price', 10, 2).nullable()
      table.date('slaughter_date').nullable()
      table.decimal('slaughter_weight', 10, 2).nullable()
      table.boolean('is_healthy').defaultTo(true).nullable()
      table.string('profile').nullable()
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}