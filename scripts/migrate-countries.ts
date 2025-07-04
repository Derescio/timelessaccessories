import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function migrateCountries() {
  try {
    const countriesPath = path.join(process.cwd(), 'cities/react-country-state-city-master/data/countriesminified.json');
    
    if (!fs.existsSync(countriesPath)) {
      throw new Error(`Countries data file not found at: ${countriesPath}`);
    }

    const countriesData = JSON.parse(
      fs.readFileSync(countriesPath, 'utf8')
    );

    console.log(`🌍 Starting migration of ${countriesData.length} countries...`);

    let successCount = 0;
    let errorCount = 0;

    for (const country of countriesData) {
      try {
        await prisma.country.upsert({
          where: { id: country.id },
          update: {
            name: country.name,
            iso2: country.iso2,
            iso3: country.iso3,
            numericCode: country.numeric_code,
            phoneCode: country.phone_code,
            capital: country.capital,
            currency: country.currency,
            currencyName: country.currency_name,
            currencySymbol: country.currency_symbol,
            native: country.native,
            region: country.region,
            subregion: country.subregion,
            emoji: country.emoji,
            tld: country.tld,
            latitude: country.latitude ? parseFloat(country.latitude) : null,
            longitude: country.longitude ? parseFloat(country.longitude) : null,
            hasStates: country.hasStates || false,
          },
          create: {
            id: country.id,
            name: country.name,
            iso2: country.iso2,
            iso3: country.iso3,
            numericCode: country.numeric_code,
            phoneCode: country.phone_code,
            capital: country.capital,
            currency: country.currency,
            currencyName: country.currency_name,
            currencySymbol: country.currency_symbol,
            native: country.native,
            region: country.region,
            subregion: country.subregion,
            emoji: country.emoji,
            tld: country.tld,
            latitude: country.latitude ? parseFloat(country.latitude) : null,
            longitude: country.longitude ? parseFloat(country.longitude) : null,
            hasStates: country.hasStates || false,
          },
        });
        successCount++;
        
        if (successCount % 50 === 0) {
          console.log(`✅ Processed ${successCount} countries...`);
        }
      } catch (error) {
        console.error(`❌ Error processing country ${country.name}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Countries migration completed!`);
    console.log(`✅ Successfully migrated: ${successCount} countries`);
    if (errorCount > 0) {
      console.log(`❌ Errors encountered: ${errorCount} countries`);
    }

    // Update existing shipping rates with country references
    console.log(`\n🔗 Updating shipping rates with country references...`);
    await updateShippingRateReferences();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function updateShippingRateReferences() {
  try {
    const shippingRates = await prisma.shippingRate.findMany();
    
    for (const rate of shippingRates) {
      const country = await prisma.country.findUnique({
        where: { iso2: rate.countryCode }
      });
      
      if (country) {
        await prisma.shippingRate.update({
          where: { id: rate.id },
          data: { countryId: country.id }
        });
        console.log(`🔗 Linked shipping rate for ${country.name}`);
      }
    }
  } catch (error) {
    console.error('❌ Error updating shipping rate references:', error);
  }
}

// Run the migration
migrateCountries()
  .catch(console.error); 