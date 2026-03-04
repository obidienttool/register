require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { parse } = require('csv-parse/sync');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

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
        const BATCH_SIZE = 1000;
        let batchMap = new Map(); // Use a Map to deduplicate within the batch

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

            // 4. Queue Polling Unit for batch insertion (deduplicated by ward_id + name)
            const puKey = `${wardId}:${name}`;
            batchMap.set(puKey, {
                ward_id: wardId,
                name: name,
                code: null
            });

            if (batchMap.size >= BATCH_SIZE) {
                const batchArray = Array.from(batchMap.values());
                const { error } = await supabase.from('polling_units').upsert(batchArray, { onConflict: 'ward_id, name' });
                if (error) {
                    console.error('\nBatch insert error:', error.message);
                } else {
                    puCount += batchArray.length;
                }
                batchMap.clear();

                processed += BATCH_SIZE;
                process.stdout.write(`\rProcessed: ${processed}...`);
            }
        }

        // Final batch
        if (batchMap.size > 0) {
            const batchArray = Array.from(batchMap.values());
            const { error } = await supabase.from('polling_units').upsert(batchArray, { onConflict: 'ward_id, name' });
            if (!error) puCount += batchArray.length;
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
