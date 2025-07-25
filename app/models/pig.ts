import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import PigType from '#models/pig_type'
import User from '#models/user'
export default class Pig extends BaseModel {
  // Pigs have a many-to-one relationship with PigType and User
  @belongsTo(() => PigType)
  declare pigType: BelongsTo<typeof PigType>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
  // Pigs columns
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare pigTypeId: number

  @column()
  declare name: string

  @column()
  declare batch_code: string

  @column()
  declare color: string

  @column.date()
  declare dob: DateTime | null

  @column.date()
  declare purchaseDate: DateTime | null

  @column()
  declare capital: number | null

  @column()
  declare soldTo: string | null

  @column()
  declare salePrice: number | null

  @column.date()
  declare soldDate: DateTime | null

  @column()
  declare soldWeight: number | null

  @column()
  declare status: 'active' | 'sold' | 'butchered' | 'dead'

  @column()
  declare slaughterPrice: number | null
  
  @column()
  declare slaughterWeight: number | null

  @column.date()
  declare slaughterDate: DateTime | null

  @column()
  declare isHealthy: boolean | null

  @column()
  declare profile: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}