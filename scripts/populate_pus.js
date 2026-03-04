require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse/sync');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CSV_URL = 'https://github.com/mykeels/inec-polling-units/raw/refs/heads/master/polling-units.csv';

async function populate() {
    console.log('--- INEC Polling Unit Seeder ---');
    console.log('Downloading CSV data...');
    
    try {
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);
        const csvText = await response.text();
        
        console.log('Parsing CSV...');
        const records = parse(csvText, {
            columns: true,
            skip_empty_lines: true
        });
        
        console.log(`Total records found: ${records.length}`);
        
        // Caches to avoid redundant lookups/inserts
        const stateCache = new Map(); // name -> id
        const lgaCache = new Map();   // stateId:name -> id
        const wardCache = new Map();  // lgaId:name -> id

        let processed = 0;
        let puCount = 0;
        const BATCH_SIZE = 500;
        let batch = [];

        console.log('Processing records...');

        for (const record of records) {
            const { name, ward_name, local_government_name, state_name } = record;
            
            // 1. Ensure State exists
            let stateId = stateCache.get(state_name);
            if (!stateId) {
                const { data, error } = await supabase
                    .from('states')
                    .upsert({ name: state_name }, { onConflict: 'name' })
                    .select('id')
                    .single();
                
                if (error) {
                    console.error(`Error upserting state ${state_name}:`, error.message);
                    continue;
                }
                stateId = data.id;
                stateCache.set(state_name, stateId);
            }

            // 2. Ensure LGA exists
            const lgaKey = `${stateId}:${local_government_name}`;
            let lgaId = lgaCache.get(lgaKey);
            if (!lgaId) {
                const { data, error } = await supabase
                    .from('lgas')
                    .upsert({ state_id: stateId, name: local_government_name }, { onConflict: 'state_id, name' })
                    .select('id')
                    .single();
                
                if (error) {
                    console.error(`Error upserting LGA ${local_government_name}:`, error.message);
                    continue;
                }
                lgaId = data.id;
                lgaCache.set(lgaKey, lgaId);
            }

            // 3. Ensure Ward exists
            const wardKey = `${lgaId}:${ward_name}`;
            let wardId = wardCache.get(wardKey);
            if (!wardId) {
                const { data, error } = await supabase
                    .from('wards')
                    .upsert({ lga_id: lgaId, name: ward_name }, { onConflict: 'lga_id, name' })
                    .select('id')
                    .single();
                
                if (error) {
                    console.error(`Error upserting ward ${ward_name}:`, error.message);
                    continue;
                }
                wardId = data.id;
                wardCache.set(wardKey, wardId);
            }

            // 4. Queue Polling Unit for batch insertion
            batch.push({
                ward_id: wardId,
                name: name,
                code: null // CSV doesn't seem to have a flat 'code' but name usually contains it
            });

            if (batch.length >= BATCH_SIZE) {
                const { error } = await supabase.from('polling_units').upsert(batch, { onConflict: 'ward_id, name' });
                if (error) {
                    console.error('Batch insert error:', error.message);
                } else {
                    puCount += batch.length;
                }
                batch = [];
                
                processed += BATCH_SIZE;
                process.stdout.write(`\rProcessed: ${processed}...`);
            }
        }

        // Final batch
        if (batch.length > 0) {
            const { error } = await supabase.from('polling_units').upsert(batch, { onConflict: 'ward_id, name' });
            if (!error) puCount += batch.length;
        }

        console.log('\n--- Seeding Complete ---');
        console.log(`Final Counts:`);
        console.log(`- States: ${stateCache.size}`);
        console.log(`- LGAs: ${lgaCache.size}`);
        console.log(`- Wards: ${wardCache.size}`);
        console.log(`- Polling Units: ${puCount}`);

    } catch (err) {
        console.error('Fatal Seeding Error:', err.message);
        process.exit(1);
    }
}

populate();
