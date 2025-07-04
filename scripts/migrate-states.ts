import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function migrateStates() {
  try {
    const statesPath = path.join(process.cwd(), 'cities/react-country-state-city-master/data/statesminified.json');
    
    if (!fs.existsSync(statesPath)) {
      throw new Error(`States data file not found at: ${statesPath}`);
    }

    const statesData = JSON.parse(
      fs.readFileSync(statesPath, 'utf8')
    );

    console.log(`🏛️ Starting migration of states for ${statesData.length} countries...`);

    let totalStates = 0;
    let successCount = 0;
    let errorCount = 0;

    // Count total states first
    for (const countryStates of statesData) {
      totalStates += countryStates.states.length;
    }

    console.log(`📊 Total states to migrate: ${totalStates}`);

    for (const countryStates of statesData) {
      const countryId = countryStates.id;
      
      // Verify country exists
      const country = await prisma.country.findUnique({
        where: { id: countryId }
      });

      if (!country) {
        console.log(`⚠️ Skipping states for country ID ${countryId} - country not found`);
        errorCount += countryStates.states.length;
        continue;
      }

      for (const state of countryStates.states) {
        try {
          await prisma.state.upsert({
            where: { id: state.id },
            update: {
              countryId,
              name: state.name,
              stateCode: state.state_code,
              latitude: state.latitude ? parseFloat(state.latitude) : null,
              longitude: state.longitude ? parseFloat(state.longitude) : null,
              hasCities: state.hasCities || false,
            },
            create: {
              id: state.id,
              countryId,
              name: state.name,
              stateCode: state.state_code,
              latitude: state.latitude ? parseFloat(state.latitude) : null,
              longitude: state.longitude ? parseFloat(state.longitude) : null,
              hasCities: state.hasCities || false,
            },
          });
          successCount++;
          
          if (successCount % 100 === 0) {
            console.log(`✅ Processed ${successCount}/${totalStates} states...`);
          }
        } catch (error) {
          console.error(`❌ Error processing state ${state.name} in ${country.name}:`, error);
          errorCount++;
        }
      }
    }

    console.log(`\n🎉 States migration completed!`);
    console.log(`✅ Successfully migrated: ${successCount} states`);
    if (errorCount > 0) {
      console.log(`❌ Errors encountered: ${errorCount} states`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateStates()
  .catch(console.error); 