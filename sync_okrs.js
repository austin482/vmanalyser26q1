import Database from 'better-sqlite3';
import fs from 'fs';

const db = new Database('austina.db');
const okrs = JSON.parse(fs.readFileSync('localStorage_okrs.json', 'utf8'));

console.log(`Syncing ${okrs.length} OKRs to database...`);

try {
    const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO okrs (id, buName, quarter, objective, owners, keyResults, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const okr of okrs) {
        insertStmt.run(
            okr.id,
            okr.buName,
            okr.quarter,
            okr.objective || '',
            okr.owners || '',
            JSON.stringify(okr.keyResults),
            okr.createdAt,
            okr.updatedAt
        );
        console.log(`✅ Synced BU: ${okr.buName}`);
    }
    console.log('🎉 Sync complete!');
} catch (error) {
    console.error('❌ Sync failed:', error);
} finally {
    db.close();
}
