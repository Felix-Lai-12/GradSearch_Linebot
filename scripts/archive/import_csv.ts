import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { supabase } from '../src/db/supabase';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Loading CSV data...');
    const csvData = fs.readFileSync('/Users/laizelin/Downloads/114_ulistdepartmentlist_college.csv', 'utf-8');

    const records = parse(csvData, {
        columns: false,
        skip_empty_lines: true,
        from_line: 3
    });

    console.log(`Parsed ${records.length} records from CSV.`);

    let addedCount = 0;

    // Cache to avoid constant DB calls
    const schoolCache = new Map<string, string>(); // name -> id
    const programCache = new Map<string, Set<string>>(); // schoolId -> set of program names

    // Pre-cache schools
    const { data: schools } = await supabase.from('schools').select('school_id, name');
    if (schools) {
        for (const s of schools) {
            schoolCache.set(s.name, s.school_id);
            programCache.set(s.school_id, new Set());
        }
    }

    // Pre-cache programs
    const { data: programs } = await supabase.from('programs').select('school_id, name');
    if (programs) {
        for (const p of programs) {
            const set = programCache.get(p.school_id);
            if (set) {
                set.add(p.name);
            }
        }
    }

    const toInsertSchools = [];
    const toInsertPrograms = [];

    // Track locally added schools during this run to avoid duplicate UUIDs
    const newlyAddedSchools = new Map<string, string>();

    for (const row of records) {
        const schoolName = row[3]?.trim();
        const programName = row[6]?.trim();

        if (!schoolName || !programName) continue;

        let schoolId = schoolCache.get(schoolName) || newlyAddedSchools.get(schoolName);

        // If school completely missing, we queue it for creation
        if (!schoolId) {
            schoolId = crypto.randomUUID();
            newlyAddedSchools.set(schoolName, schoolId);
            programCache.set(schoolId, new Set());
            toInsertSchools.push({
                school_id: schoolId,
                name: schoolName,
                country: 'TW',
                public_private: row[1]?.trim() === '公立' ? '公立' : '私立'
            });
            console.log(`Will add new school: ${schoolName}`);
        }

        const programsForSchool = programCache.get(schoolId);
        if (!programsForSchool) continue;

        // CSV might have duplicates mapping to the same program.
        if (!programsForSchool.has(programName)) {
            // New program!
            programsForSchool.add(programName); // Mark as added
            const id = crypto.randomUUID();
            toInsertPrograms.push({
                program_id: id,
                school_id: schoolId,
                name: programName,
                degree: ['碩士']
            });
            addedCount++;
        }
    }

    // Insert new schools first
    if (toInsertSchools.length > 0) {
        console.log(`Inserting ${toInsertSchools.length} new schools...`);
        const { error } = await supabase.from('schools').insert(toInsertSchools);
        if (error) console.error('Error inserting schools:', error);
        else console.log('Successfully inserted missing schools!');
    }

    if (toInsertPrograms.length > 0) {
        // Insert in batches
        const batchSize = 1000;
        for (let i = 0; i < toInsertPrograms.length; i += batchSize) {
            const batch = toInsertPrograms.slice(i, i + batchSize);
            const { error } = await supabase.from('programs').insert(batch);
            if (error) {
                console.error('Error inserting batch:', error);
            } else {
                console.log(`Inserted programs batch ${Math.floor(i / batchSize) + 1}`);
            }
        }
    }

    console.log(`Finished! Added ${addedCount} missing programs.`);
}
main().catch(console.error);
