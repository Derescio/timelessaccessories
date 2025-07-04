import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const shippingRates = [
  {
    countryCode: 'US',
    countryName: 'United States',
    rate: 1500, // $15.00
    freeShippingThreshold: 40000, // $400.00
    isActive: true
  },
  {
    countryCode: 'CA',
    countryName: 'Canada',
    rate: 1000, // $10.00
    freeShippingThreshold: 40000, // $400.00
    isActive: true
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    rate: 2000, // $20.00
    freeShippingThreshold: 40000, // $400.00
    isActive: true
  },
  {
    countryCode: 'FALLBACK',
    countryName: 'Default International',
    rate: 2500, // $25.00
    freeShippingThreshold: 40000, // $400.00
    isActive: true
  }
]

async function main() {
  console.log('🚚 Seeding shipping rates...')

  for (const rate of shippingRates) {
    const existingRate = await prisma.shippingRate.findUnique({
      where: { countryCode: rate.countryCode }
    })

    if (existingRate) {
      console.log(`⚠️  Shipping rate for ${rate.countryName} already exists, skipping...`)
      continue
    }

    const created = await prisma.shippingRate.create({
      data: rate
    })

    console.log(`✅ Created shipping rate for ${created.countryName}: $${(created.rate / 100).toFixed(2)}`)
  }

  console.log('🎉 Shipping rates seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding shipping rates:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 