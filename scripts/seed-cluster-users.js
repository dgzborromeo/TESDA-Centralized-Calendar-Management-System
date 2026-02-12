/**
 * Seed cluster user accounts (7 clusters).
 * Usage: node backend/scripts/seed-cluster-users.js
 *
 * Default password for all cluster accounts: cluster123
 * Override via env:
 *  - CLUSTER_OSEC_PASSWORD
 *  - CLUSTER_ODDG_PP_PASSWORD
 *  - CLUSTER_ODDG_AI_PASSWORD
 *  - CLUSTER_ODDG_SC_PASSWORD
 *  - CLUSTER_ODDG_PL_PASSWORD
 *  - CLUSTER_ODDG_FLA_PASSWORD
 *  - CLUSTER_ODDG_TESDO_PASSWORD
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { resolveUserNameConfig } = require('../utils/userName');
const { CLUSTER_LEGEND } = require('../utils/clusterLegend');

const CLUSTERS = CLUSTER_LEGEND.map((c) => ({
  name: `Cluster - ${c.name}`,
  email: c.account?.email,
  role: c.account?.role || 'user',
  password: c.account?.defaultPassword || 'cluster123',
})).filter((c) => c.email);

async function seed() {
  const cfg = await resolveUserNameConfig(db);
  if (!cfg.insertColumn) {
    console.error('Users table has no supported name column (name/full_name/fullname/username/first_name).');
    process.exit(1);
  }

  let created = 0;
  let existing = 0;

  for (const cluster of CLUSTERS) {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [cluster.email]);
    if (rows.length > 0) {
      existing += 1;
      console.log(`Exists: ${cluster.email}`);
      continue;
    }

    const hash = await bcrypt.hash(cluster.password, 10);
    await db.query(
      `INSERT INTO users (${cfg.insertColumn}, email, password, role) VALUES (?, ?, ?, ?)`,
      [cluster.name, cluster.email, hash, cluster.role]
    );
    created += 1;
    console.log(`Created: ${cluster.email} / ${cluster.password}`);
  }

  console.log(`Done. Created: ${created}, Existing: ${existing}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
