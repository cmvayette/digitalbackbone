import { SQLiteEventStore } from '../event-store/sqlite-store';
import { RelationshipRegistry } from '../relationship-registry';
import { ConstraintEngine } from '../constraint-engine';
import { DocumentRegistry } from '../document-registry';
import { EventSourcingHolonRepository } from './persistence-adapter';
import { seedDevelopmentData } from './index';
import path from 'path';
import dotenv from 'dotenv';
import { InMemoryEventStore } from '../event-store';

dotenv.config();

async function runSeed() {
    console.log('🚀 Initializing Seed Runner...');

    // 1. Initialize Persistence (SQLite)
    const dbPath = process.env.DB_PATH || path.resolve(__dirname, '../../som.db');
    console.log(`Using Database: ${dbPath}`);
    const eventStore = new SQLiteEventStore(dbPath);

    // 2. Initialize Core Engines
    const documentRegistry = new DocumentRegistry();
    const constraintEngine = new ConstraintEngine(documentRegistry);

    // 3. Initialize Adapters
    // Use our wrapper to ensuring holon creations generate events in SQLite
    const holonRegistry = new EventSourcingHolonRepository(eventStore);

    // Relationship Registry already writes to EventStore passed in constructor
    const relationshipRegistry = new RelationshipRegistry(constraintEngine, eventStore);

    // 4. Run Seed
    // Note: We cast eventStore to any because seedDevelopmentData might expect InMemoryEventStore specifically
    // but we are passing a compatible interface.
    try {
        await seedDevelopmentData({
            holonRegistry: holonRegistry as any, // Cast because of private inner differences
            relationshipRegistry,
            eventStore: eventStore as unknown as InMemoryEventStore, // Type assertion for compatibility
            constraintEngine,
            documentRegistry
        });
        console.log('✅ Seed Runner Completed Successfully.');
    } catch (error) {
        console.error('❌ Data Seeding Failed:', error);
        process.exit(1);
    }
}

runSeed();
