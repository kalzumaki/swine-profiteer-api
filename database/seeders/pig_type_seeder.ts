import { BaseSeeder } from '@adonisjs/lucid/seeders'
import PigType from '#models/pig_type'
export default class extends BaseSeeder {
  async run() {
    await PigType.createMany([
      {
        name: 'Sow',
        description: 'A female pig that has given birth.',
      },
      {
        name: 'Boar',
        description: 'A male pig that is used for breeding.',
      },
      {
        name: 'Fattener',
        description: 'A pig raised primarily for meat production.',
      },
    ])
  }
}