const ROMO_EMAIL = (process.env.ROMO_EMAIL || 'romo@tesda.gov.ph').toLowerCase();
const OSEC_EMAIL = (process.env.OSEC_EMAIL || 'osec@tesda.gov.ph').toLowerCase();
const PO_EMAIL = (process.env.PO_EMAIL || 'po@tesda.gov.ph').toLowerCase();
const SMO_EMAIL = (process.env.SMO_EMAIL || 'smo@tesda.gov.ph').toLowerCase();
const CO_EMAIL = (process.env.CO_EMAIL || 'co@tesda.gov.ph').toLowerCase();
const ICTO_EMAIL = (process.env.ICTO_EMAIL || 'icto@tesda.gov.ph').toLowerCase();
const AS_EMAIL = (process.env.AS_EMAIL || 'as@tesda.gov.ph').toLowerCase();
const PLO_EMAIL = (process.env.PLO_EMAIL || 'plo@tesda.gov.ph').toLowerCase();
const PIO_EMAIL = (process.env.PIO_EMAIL || 'pio@tesda.gov.ph').toLowerCase();
const QSO_EMAIL = (process.env.QSO_EMAIL || 'qso@tesda.gov.ph').toLowerCase();
const FMS_EMAIL = (process.env.FMS_EMAIL || 'fms@tesda.gov.ph').toLowerCase();
const CLGEO_EMAIL = (process.env.CLGEO_EMAIL || 'clgeo@tesda.gov.ph').toLowerCase();
const EBETO_EMAIL = (process.env.EBETO_EMAIL || 'ebeto@tesda.gov.ph').toLowerCase();
const CLUSTER_OSEC_EMAIL = (process.env.CLUSTER_OSEC_EMAIL || 'cluster.osec@tesda.gov.ph').toLowerCase();
const CLUSTER_ODDG_PP_EMAIL = (process.env.CLUSTER_ODDG_PP_EMAIL || 'cluster.oddg.pp@tesda.gov.ph').toLowerCase();
const CLUSTER_ODDG_AI_EMAIL = (process.env.CLUSTER_ODDG_AI_EMAIL || 'cluster.oddg.ai@tesda.gov.ph').toLowerCase();
const CLUSTER_ODDG_SC_EMAIL = (process.env.CLUSTER_ODDG_SC_EMAIL || 'cluster.oddg.sc@tesda.gov.ph').toLowerCase();
const CLUSTER_ODDG_PL_EMAIL = (process.env.CLUSTER_ODDG_PL_EMAIL || 'cluster.oddg.pl@tesda.gov.ph').toLowerCase();
const CLUSTER_ODDG_FLA_EMAIL = (process.env.CLUSTER_ODDG_FLA_EMAIL || 'cluster.oddg.fla@tesda.gov.ph').toLowerCase();
const CLUSTER_ODDG_TESDO_EMAIL = (process.env.CLUSTER_ODDG_TESDO_EMAIL || 'cluster.oddg.tesdo@tesda.gov.ph').toLowerCase();

const ROMO_COLOR = '#3b82f6'; // blue
const OSEC_COLOR = '#ef4444'; // red
const PO_COLOR = '#ec4899'; // pink
const SMO_COLOR = '#ef4444'; // red
const CO_COLOR = '#3b82f6'; // blue
const ICTO_COLOR = '#06b6d4'; // vivid cyan
const AS_COLOR = '#06b6d4'; // vivid cyan
const PLO_COLOR = '#8b5cf6'; // purple
const PIO_COLOR = '#ef4444'; // red
const QSO_COLOR = '#ec4899'; // pink
const FMS_COLOR = '#22c55e'; // green
const CLGEO_COLOR = '#f59e0b'; // orange
const EBETO_COLOR = '#8b5cf6'; // purple

const OFFICE_COLOR_PALETTE = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
];

function isRomoUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === ROMO_EMAIL;
}

function isOsecUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === OSEC_EMAIL;
}

function isPoUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === PO_EMAIL;
}

function isSmoUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === SMO_EMAIL;
}

function isCoUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === CO_EMAIL;
}

function isIctoUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === ICTO_EMAIL;
}

function isAsUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === AS_EMAIL;
}

function isPloUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === PLO_EMAIL;
}

function isPioUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === PIO_EMAIL;
}

function isQsoUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === QSO_EMAIL;
}

function isFmsUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === FMS_EMAIL;
}

function isClgeoUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === CLGEO_EMAIL;
}

function isEbetoUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email === EBETO_EMAIL;
}

function colorFromUserId(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return OFFICE_COLOR_PALETTE[0];
  return OFFICE_COLOR_PALETTE[Math.abs(n) % OFFICE_COLOR_PALETTE.length];
}

/**
 * "Assigned office color" used for legend/UI.
 * - OSEC: forced red
 * - ROMO: forced blue
 * - others: stable palette color based on user id
 */
function assignedOfficeColor(user) {
  const email = String(user?.email || '').toLowerCase();
  if (email === CLUSTER_OSEC_EMAIL) return OSEC_COLOR;
  if (email === CLUSTER_ODDG_PP_EMAIL) return PO_COLOR;
  if (email === CLUSTER_ODDG_AI_EMAIL) return AS_COLOR;
  if (email === CLUSTER_ODDG_SC_EMAIL) return CLGEO_COLOR;
  if (email === CLUSTER_ODDG_PL_EMAIL) return PLO_COLOR;
  if (email === CLUSTER_ODDG_FLA_EMAIL) return FMS_COLOR;
  if (email === CLUSTER_ODDG_TESDO_EMAIL) return ROMO_COLOR;
  if (isOsecUser(user)) return OSEC_COLOR;
  if (isRomoUser(user)) return ROMO_COLOR;
  if (isPoUser(user)) return PO_COLOR;
  if (isSmoUser(user)) return SMO_COLOR;
  if (isCoUser(user)) return CO_COLOR;
  if (isIctoUser(user)) return ICTO_COLOR;
  if (isAsUser(user)) return AS_COLOR;
  if (isPloUser(user)) return PLO_COLOR;
  if (isPioUser(user)) return PIO_COLOR;
  if (isQsoUser(user)) return QSO_COLOR;
  if (isFmsUser(user)) return FMS_COLOR;
  if (isClgeoUser(user)) return CLGEO_COLOR;
  if (isEbetoUser(user)) return EBETO_COLOR;
  return colorFromUserId(user?.id);
}

module.exports = {
  ROMO_EMAIL,
  OSEC_EMAIL,
  PO_EMAIL,
  SMO_EMAIL,
  CO_EMAIL,
  ICTO_EMAIL,
  AS_EMAIL,
  PLO_EMAIL,
  PIO_EMAIL,
  QSO_EMAIL,
  FMS_EMAIL,
  CLGEO_EMAIL,
  EBETO_EMAIL,
  CLUSTER_OSEC_EMAIL,
  CLUSTER_ODDG_PP_EMAIL,
  CLUSTER_ODDG_AI_EMAIL,
  CLUSTER_ODDG_SC_EMAIL,
  CLUSTER_ODDG_PL_EMAIL,
  CLUSTER_ODDG_FLA_EMAIL,
  CLUSTER_ODDG_TESDO_EMAIL,
  ROMO_COLOR,
  OSEC_COLOR,
  PO_COLOR,
  SMO_COLOR,
  CO_COLOR,
  ICTO_COLOR,
  AS_COLOR,
  PLO_COLOR,
  PIO_COLOR,
  QSO_COLOR,
  FMS_COLOR,
  CLGEO_COLOR,
  EBETO_COLOR,
  isRomoUser,
  isOsecUser,
  isPoUser,
  isSmoUser,
  isCoUser,
  isIctoUser,
  isAsUser,
  isPloUser,
  isPioUser,
  isQsoUser,
  isFmsUser,
  isClgeoUser,
  isEbetoUser,
  colorFromUserId,
  assignedOfficeColor,
};

