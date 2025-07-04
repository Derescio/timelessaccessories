import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const BATCH_SIZE = 1000;

async function migrateCities() {
  try {
    const citiesPath = path.join(process.cwd(), 'cities/react-country-state-city-master/data/citiesminified.json');
    
    if (!fs.existsSync(citiesPath)) {
      throw new Error(`Cities data file not found at: ${citiesPath}`);
    }

    console.log(`🏙️ Loading cities data (this may take a moment for the 34MB file)...`);
    const citiesData = JSON.parse(
      fs.readFileSync(citiesPath, 'utf8')
    );

    console.log(`🏙️ Starting migration of cities for ${citiesData.length} countries...`);

    let totalCities = 0;
    let successCount = 0;
    let errorCount = 0;
    let batch: any[] = [];

    // Count total cities first
    for (const countryCities of citiesData) {
      for (const stateCities of countryCities.states) {
        totalCities += stateCities.cities.length;
      }
    }

    console.log(`📊 Total cities to migrate: ${totalCities.toLocaleString()}`);

    for (const countryCities of citiesData) {
      const countryId = countryCities.id;
      
      // Verify country exists
      const country = await prisma.country.findUnique({
        where: { id: countryId }
      });

      if (!country) {
        console.log(`⚠️ Skipping cities for country ID ${countryId} - country not found`);
        continue;
      }

      for (const stateCities of countryCities.states) {
        const stateId = stateCities.id;
        
        // Verify state exists
        const state = await prisma.state.findUnique({
          where: { id: stateId }
        });

        if (!state) {
          console.log(`⚠️ Skipping cities for state ID ${stateId} in ${country.name} - state not found`);
          continue;
        }

        for (const city of stateCities.cities) {
          batch.push({
            id: city.id,
            countryId,
            stateId,
            name: city.name,
            latitude: city.latitude ? parseFloat(city.latitude) : null,
            longitude: city.longitude ? parseFloat(city.longitude) : null,
          });

          if (batch.length >= BATCH_SIZE) {
            const processed = await processBatch(batch);
            successCount += processed.success;
            errorCount += processed.errors;
            
            console.log(`✅ Processed ${successCount.toLocaleString()}/${totalCities.toLocaleString()} cities (${((successCount / totalCities) * 100).toFixed(1)}%)`);
            batch = [];
          }
        }
      }
    }

    // Process remaining cities
    if (batch.length > 0) {
      const processed = await processBatch(batch);
      successCount += processed.success;
      errorCount += processed.errors;
    }

    console.log(`\n🎉 Cities migration completed!`);
    console.log(`✅ Successfully migrated: ${successCount.toLocaleString()} cities`);
    if (errorCount > 0) {
      console.log(`❌ Errors encountered: ${errorCount.toLocaleString()} cities`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function processBatch(cities: any[]): Promise<{ success: number; errors: number }> {
  try {
    const result = await prisma.city.createMany({
      data: cities,
      skipDuplicates: true,
    });
    
    return {
      success: result.count,
      errors: cities.length - result.count
    };
  } catch (error) {
    console.error('❌ Batch processing error:', error);
    return {
      success: 0,
      errors: cities.length
    };
  }
}

// Run the migration
migrateCities()
  .catch(console.error); 