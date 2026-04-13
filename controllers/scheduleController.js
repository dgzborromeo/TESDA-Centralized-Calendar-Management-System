'use strict';
const { Schedule, ScheduleParticipant, Position, Region, Province, Cluster, Office, sequelize, User, TTI } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

/**
 * Resolve schedule_participants → array of user_ids from user_profiles (best-effort)
 */
async function resolveParticipantUserIds(scheduleId) {
  const participants = await ScheduleParticipant.findAll({ where: { schedule_id: scheduleId } });
  if (!participants.length) return [];
  const userIds = new Set();
  for (const p of participants) {
    const desigId = p.designation_id;
    const targetType = p.target_type ? String(p.target_type).toLowerCase().trim() : '';
    const targetId = p.target_id;
    const isAll = p.is_all;
    let whereClause = 'up.designation_id = ?';
    const params = [desigId];
    if (!isAll && targetId) {
      switch (targetType) {
        case 'region': whereClause += ' AND up.region_id = ?'; params.push(targetId); break;
        case 'province': case 'prov': case 'district': whereClause += ' AND up.province_id = ?'; params.push(targetId); break;
        case 'office': whereClause += ' AND up.office_id = ?'; params.push(targetId); break;
        case 'cluster': whereClause += ' AND up.cluster_id = ?'; params.push(targetId); break;
        case 'tti': case 'school': whereClause += ' AND up.tti_id = ?'; params.push(targetId); break;
        default: break;
      }
    }
    const [rows] = await db.query(`SELECT up.user_id FROM user_profiles up WHERE ${whereClause}`, params);
    rows.forEach(r => userIds.add(r.user_id));
  }
  return Array.from(userIds);
}

/**
 * Resolve schedule_participants → label strings for regional/provincial/executive directors
 * Returns { rdLabel, pdLabel, edLabel, participantsText }
 */
async function resolveParticipantLabels(scheduleId) {
    const participants = await ScheduleParticipant.findAll({
        where: { schedule_id: scheduleId },
        include: [
            { model: Position, as: 'designation' },
            { model: Region, as: 'region', required: false },
            { model: Province, as: 'province', required: false },
            { model: Office, as: 'office', required: false },
            { model: Cluster, as: 'cluster', required: false },
            { model: TTI, as: 'tti', required: false }
        ]
    });

    if (!participants.length) return { rdLabel: null, pdLabel: null, edLabel: null, participantsText: null };

    const rdNames = [], pdNames = [], edNames = [], allNames = [];

for (const p of participants) {
    const posName = p.designation?.name || '';
    const posLower = posName.toLowerCase();
    const targetType = p.target_type ? String(p.target_type).toLowerCase().trim() : '';
    const isAll = p.is_all;

    let locationName = '';

    if (isAll) {
        locationName = '(All)';
    } else {
        // Gagamitin natin ang 'as' aliases na dinefine mo sa model associations
        if (targetType === 'region' && p.region) {
            locationName = `(${p.region.region})`;
        } 
        else if (['province', 'prov', 'district'].includes(targetType) && p.province) {
            locationName = `(${p.province.name})`;
        } 
        else if (targetType === 'office' && p.office) {
            locationName = `(${p.office.abbr || p.office.name})`;
        } 
        else if (targetType === 'cluster' && p.cluster) {
            locationName = `(${p.cluster.name})`;
        } 
        else if (['tti', 'school'].includes(targetType) && p.tti) {
            locationName = `(${p.tti.name})`;
        }
    }

        const label = locationName ? `${posName} ${locationName}` : posName;
        allNames.push(label);

        // Grouping logic (Eksaktong gaya ng original mo)
        if (posLower.includes('regional director')) {
            rdNames.push(isAll ? 'All RDs' : label);
        } else if (posLower.includes('provincial director') || posLower.includes('district director')) {
            pdNames.push(isAll ? 'All PDs' : label);
        } else if (posLower.includes('executive director')) {
            edNames.push(isAll ? 'All EDs' : label);
        }
    }

    return {
        rdLabel: rdNames.length ? [...new Set(rdNames)].join(', ') : null,
        pdLabel: pdNames.length ? [...new Set(pdNames)].join(', ') : null,
        edLabel: edNames.length ? [...new Set(edNames)].join(', ') : null,
        participantsText: allNames.length ? allNames.join(', ') : null,
    };
}

const findLocationConflicts = async (location_id, location_table, start_date, end_date, start_time, end_time, excludeScheduleId = null) => {
    if (!location_id || !location_table || location_table !== 'provinces') return [];

    // 1. Kunin muna natin ang data ng PROBINSYA na pinipili ngayon (hal. Antique)
    // para malaman natin kung sino ang affected_id (Hub) nito.
    const selectedProvince = await Province.findByPk(location_id);
    if (!selectedProvince) return [];

    const selectedHubId = selectedProvince.affected_id;

    return await Schedule.findAll({
        where: {
            id: excludeScheduleId ? { [Op.ne]: excludeScheduleId } : { [Op.not]: null },
            status: { [Op.notIn]: ['Cancelled', 'Expired'] },
            location_table: 'provinces', // Venue conflicts are specific to provinces in this logic

            [Op.and]: [
                { start_date: { [Op.lte]: end_date } },
                { end_date: { [Op.gte]: start_date } },
                {
                    [Op.and]: [
                        { start_time: { [Op.lt]: end_time } },
                        { end_time: { [Op.gt]: start_time } }
                    ]
                }
            ]
        },
        include: [{
            model: Province,
            as: 'province_location',
            required: true,
            include: [{
                model: Province,
                as: 'transit_province',
                required: false
            }],
            where: {
                [Op.or]: [
                    // Case A: Sakto silang pareho ng exact venue (Iloilo vs Iloilo)
                    { id: location_id },

                    // Case B: Ang existing schedule ay gumagamit din ng same Hub (Guimaras vs Antique)
                    // Ibig sabihin, pareho silang "affected_id = Iloilo"
                    { affected_id: location_id }, 

                    // Case C: Kung ang pinipili mong venue ngayon ay isang Hub (Iloilo), 
                    // i-conflict lahat ng schedules na naka-depende sa Hub na ito.
                    ...(selectedHubId ? [{ id: selectedHubId }, { affected_id: selectedHubId }] : [])
                ]
            }
        }]
    });
};

/**
 * HELPER: findConflicts
 */
const findConflicts = async (selectedPositions, start_date, end_date, start_time, end_time, excludeScheduleId = null) => {
    const positions = typeof selectedPositions === 'string' ? JSON.parse(selectedPositions) : selectedPositions;

    return await ScheduleParticipant.findAll({
        include: [
            {
                model: Schedule,
                as: 'schedule',
                attributes: ['id', 'event_title', 'start_date', 'end_date', 'start_time', 'end_time'],
                where: {
                    // 1. Wag isama ang sarili
                    id: excludeScheduleId ? { [Op.ne]: excludeScheduleId } : { [Op.not]: null },
                    
                    // 2. SAFETY: Huwag isama ang mga tapos na o wala na sa calendar
                    status: { [Op.notIn]: ['Cancelled', 'Expired'] }, 

                    // 3. DATE & TIME OVERLAP (Your Original Logic)
                    [Op.and]: [
                        { start_date: { [Op.lte]: end_date } },
                        { end_date: { [Op.gte]: start_date } },
                        {
                            [Op.and]: [
                                { start_time: { [Op.lt]: end_time } },
                                { end_time: { [Op.gt]: start_time } }
                            ]
                        }
                    ]
                }
            },
            {
                model: Position,
                as: 'designation',
                attributes: ['name']
            }
        ],
        where: {
            [Op.or]: positions.map(p => {
                if (p.isAll) {
                    // Kung 'All' ang bago, conflict siya sa kahit anong record ng designation na yan
                    return { designation_id: p.designationId };
                } else {
                    // Kung specific, conflict siya kung:
                    // a) May kaparehong targetId OR b) May record na 'is_all' para sa designation na yan
                    return {
                        designation_id: p.designationId,
                        [Op.or]: [
                            { target_id: p.targetId, target_type: p.targetType },
                            { is_all: true }
                        ]
                    };
                }
            })
        }
    });
};
/**
 * HELPER: formatConflictMessages
 * Dito naku-query yung Cluster name at Office name mula sa database.
 */
const formatConflictMessages = async (conflicts) => {
    // Dito natin itatago ang mga nakuha na nating data para hindi paulit-ulit ang DB query
    const cache = {
        region: {},
        province: {},
        office: {},
        cluster: {},
        tti: {}
    };

    return await Promise.all(conflicts.map(async (c) => {
        let posName = c.designation?.name || 'Participant';
        let locationName = "";

        const type = c.target_type ? String(c.target_type).toLowerCase().trim() : "";
        const targetId = c.target_id;

        // Label adjustment para sa Provincial Director
        if (posName.toLowerCase().includes("regional director") && (type === 'province' || type === 'prov')) {
            posName = "Provincial Director";
        }

        if (c.is_all) {
            locationName = "(All)";
        } else if (targetId) {
            // OPTIMIZATION: Check cache muna bago mag-query sa database
            switch (type) {
                case 'region':
                    if (!cache.region[targetId]) cache.region[targetId] = await Region.findByPk(targetId);
                    locationName = cache.region[targetId] ? `(${cache.region[targetId].region})` : `(Region ID: ${targetId})`;
                    break;

                case 'province':
                case 'prov':
                case 'district':
                    if (!cache.province[targetId]) cache.province[targetId] = await Province.findByPk(targetId);
                    locationName = cache.province[targetId] ? `(${cache.province[targetId].name})` : `(${type.toUpperCase()} ID: ${targetId})`;
                    break;

                case 'office':
                    if (!cache.office[targetId]) cache.office[targetId] = await Office.findByPk(targetId);
                    const off = cache.office[targetId];
                    locationName = off ? `(${off.name || off.abbr})` : `(Office ID: ${targetId})`;
                    break;

                case 'cluster':
                    if (!cache.cluster[targetId]) cache.cluster[targetId] = await Cluster.findByPk(targetId);
                    locationName = cache.cluster[targetId] ? `(${cache.cluster[targetId].name})` : `(Cluster ID: ${targetId})`;
                    break;

                case 'tti':
                case 'school':
                    if (!cache.tti[targetId]) cache.tti[targetId] = await TTI.findByPk(targetId);
                    locationName = cache.tti[targetId] ? `(${cache.tti[targetId].name})` : `(School ID: ${targetId})`;
                    break;

                // Static labels (walang query needed)
                case 'co': locationName = "(Central Office)"; break;
                case 'ro': locationName = "(Regional Office)"; break;
                case 'po': locationName = "(Provincial Office)"; break;
                case 'do': locationName = "(District Office)"; break;
                case 'ti': locationName = "(Training Institute)"; break;

                default:
                    locationName = `(ID: ${targetId})`;
            }
        }

        const sched = c.schedule;
        const formatTime = (timeStr) => {
            if (!timeStr) return "";
            const [h, m] = timeStr.split(':');
            const hour = parseInt(h);
            const suffix = hour >= 12 ? 'PM' : 'AM';
            return `${hour % 12 || 12}:${m} ${suffix}`;
        };

        const dateDisplay = sched.start_date === sched.end_date 
            ? sched.start_date 
            : `${sched.start_date} to ${sched.end_date}`;

        return `${locationName} ${posName} is already a participant in "${sched.event_title}" on ${dateDisplay} (${formatTime(sched.start_time)} - ${formatTime(sched.end_time)})`;
    }));
};

const resolveLocationName = async (type, table, id, manualLocation) => {
    // Pag CO o Others, gamitin lang kung ano ang tinype ng user
    if (type === 'CO' || type === 'Others') {
        return manualLocation;
    }

    try {
        let result = null;
        // Depende sa table, doon tayo maghahanap ng name
        if (table === 'regions') {
            result = await models.Region.findByPk(id);
            return result ? result.region : manualLocation; // .region ang column name sa regions table mo
        } else if (table === 'provinces') {
            result = await models.Province.findByPk(id);
            return result ? result.name : manualLocation;
        } else if (table === 'ttis') {
            result = await models.Tti.findByPk(id);
            return result ? result.name : manualLocation;
        } else if (table === 'offices') {
            result = await models.Office.findByPk(id);
            return result ? result.name : manualLocation;
        }
        
        return manualLocation;
    } catch (error) {
        console.error("Error resolving location name:", error);
        return manualLocation;
    }
};

module.exports = {

    // POST: check conflicts before saving (live conflict preview)
async checkConflict(req, res) {
        try {
            const { selectedPositions, start_date, end_date, start_time, end_time, location_id, location_table } = req.body;
            
            if (!start_date || !start_time || !end_time) {
                return res.json({ conflicts: [] });
            }

            const effectiveEndDate = end_date || start_date;
            let messages = [];
            let conflictingScheduleIds = [];

            // --- 1. TAO CONFLICT (Existing) ---
            if (selectedPositions) {
                const positions = typeof selectedPositions === 'string' ? JSON.parse(selectedPositions) : selectedPositions;
                if (positions.length > 0) {
                    const pConflicts = await findConflicts(positions, start_date, effectiveEndDate, start_time, end_time);
                    const pMessages = await formatConflictMessages(pConflicts);
                    messages.push(...pMessages);
                    pConflicts.forEach(c => { if(c.schedule?.id) conflictingScheduleIds.push(c.schedule.id); });
                }
            }

        const lConflicts = await findLocationConflicts(location_id, location_table, start_date, effectiveEndDate, start_time, end_time);

            if (lConflicts.length > 0) {
                for (const loc of lConflicts) {
                    const isExactSameVenue = Number(loc.location_id) === Number(location_id);

                    if (isExactSameVenue) {
                        messages.push(`The selected office (${loc.location}) is already booked for "${loc.event_title}". Please select a different venue.`);
                    } else {
                        // Gamitin na ang 'transit_province' alias
                        const hub = loc.province_location?.transit_province;
                        const hubName = hub ? hub.name : "the supporting Provincial Office"; 
                        
                        messages.push(`Conflict: The ${hubName} is currently occupied providing assistance for a booking to ${loc.location}. Please select RO as venue.`);
                    }
                    conflictingScheduleIds.push(loc.id);
                }
            }
            return res.json({
                hasConflict: messages.length > 0,
                messages: [...new Set(messages)],
                scheduleIds: [...new Set(conflictingScheduleIds)],
            });
        } catch (err) {
            console.error('checkConflict error:', err);
            return res.status(500).json({ error: err.message });
        }
    },

    // POST: createSchedule
      async createSched(req, res) {
    const t = await sequelize.transaction();
    try {
        const userId = req.user.id; 

        const { 
            event_title, 
            selectedPositions, 
            start_date, 
            end_date, 
            start_time, 
            end_time,
            // Kunin natin ang mga bagong fields mula sa body
            location_type,
            location_table,
            location_id,
            location, // Ito yung manual input string
            ...otherData 
        } = req.body;

        // --- NEW LOCATION LOGIC ---
        // Tatawagin natin ang helper function para makuha ang tamang pangalan
        const finalLocationName = await resolveLocationName(
            location_type, 
            location_table, 
            location_id, 
            location
        );

        // 2. Conflict Detection (Existing Logic...)
let allConflictMessages = [];

        // Check Participants
        if (selectedPositions) {
            const positions = typeof selectedPositions === 'string' ? JSON.parse(selectedPositions) : selectedPositions;
            const pConflicts = await findConflicts(positions, start_date, end_date, start_time, end_time);
            if (pConflicts.length > 0) {
                const pMessages = await formatConflictMessages(pConflicts);
                allConflictMessages.push(...pMessages);
            }
        }

        // Check Location
        const lConflicts = await findLocationConflicts(location_id, location_table, start_date, end_date, start_time, end_time);
        if (lConflicts.length > 0) {
            lConflicts.forEach(loc => {
                allConflictMessages.push(`Venue Conflict: The location is reserved for "${loc.event_title}"`);
            });
        }

        if (allConflictMessages.length > 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            await t.rollback();
            return res.status(409).json({ 
                error: "Schedule Conflict Detected", 
                conflicts: [...new Set(allConflictMessages)]
            });
        }

        // 3. File Handling (Existing Logic...)
        let attachmentFile = null, attachmentPath = null;
        if (req.file) {
            const newFileName = `user_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
            const dir = path.join(__dirname, '..', 'uploads', 'schedules');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            const targetPath = path.join(dir, newFileName);
            fs.renameSync(req.file.path, targetPath);
            attachmentFile = req.file.originalname;
            attachmentPath = `/uploads/schedules/${newFileName}`;
        }

        // 4. Create Schedule Record
        const schedule = await Schedule.create({ 
            ...otherData,
            user_id: userId,
            event_title,
            start_date,
            end_date,
            start_time,
            end_time,
            // I-save ang resolved location name at ang tracking IDs
            location: finalLocationName, 
            location_type,
            location_table,
            location_id,
            status: 'Tentative', 
            attachment_file: attachmentFile, 
            attachment_path: attachmentPath 
        }, { transaction: t });

        // 5. Create Participants (Existing Logic...)
        if (selectedPositions) {
            const positions = typeof selectedPositions === 'string' ? JSON.parse(selectedPositions) : selectedPositions;
            await ScheduleParticipant.bulkCreate(positions.map(p => ({
                schedule_id: schedule.id,
                designation_id: p.designationId,
                target_id: p.targetId || null,
                target_type: p.targetType || null,
                is_all: p.isAll || false
            })), { transaction: t });
        }

        await t.commit();
        return res.status(201).json(schedule);

    } catch (err) {
        if (t && !t.finished) await t.rollback();
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: err.message });
    }
},

    // POST: updateSchedule
// POST: updateSchedule
async updateSched(req, res) {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params;
        const { 
            selectedPositions, 
            start_date, 
            end_date, 
            start_time, 
            end_time, 
            status,
            // I-destructure ang location fields mula sa body
            location_type,
            location_table,
            location_id,
            location 
        } = req.body;
        
        let schedule = await Schedule.findByPk(id, { transaction: t });
        if (!schedule) {
            await t.rollback();
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const previousStatus = schedule.status;

        // --- NEW LOCATION LOGIC ---
        // I-resolve ang location name. 
        // Gagamit tayo ng fallback sa existing schedule data kung undefined ang req.body fields.
        const finalLocationName = await resolveLocationName(
            location_type || schedule.location_type, 
            location_table || schedule.location_table, 
            location_id   || schedule.location_id, 
            location      || schedule.location
        );

        // Conflict Detection (Existing Logic...)
        if (selectedPositions) {
            const conflicts = await findConflicts(
                selectedPositions, 
                start_date || schedule.start_date, 
                end_date || schedule.end_date, 
                start_time || schedule.start_time, 
                end_time || schedule.end_time, 
                id
            );
            if (conflicts.length > 0) {
                if (req.file) fs.unlinkSync(req.file.path);
                await t.rollback();
                const details = await formatConflictMessages(conflicts);
                return res.status(409).json({ 
                    error: "Schedule Conflict Detected", 
                    conflicts: [...new Set(details)] 
                });
            }
        }

        // File Handling (Existing Logic...)
        let attachmentFile = schedule.attachment_file, attachmentPath = schedule.attachment_path;
        if (req.file) {
            const newFileName = `UPDATED_${Date.now()}${path.extname(req.file.originalname)}`;
            const dir = path.join(__dirname, '..', 'uploads', 'schedules');
            const targetPath = path.join(dir, newFileName);
            fs.renameSync(req.file.path, targetPath);
            if (schedule.attachment_path) {
                const oldP = path.join(__dirname, '..', schedule.attachment_path);
                if (fs.existsSync(oldP)) fs.unlinkSync(oldP);
            }
            attachmentFile = req.file.originalname;
            attachmentPath = `/uploads/schedules/${newFileName}`;
        }

        // UPDATE SCHEDULE
        // Isama ang resolved location name at ang tracking IDs sa payload
        const updatePayload = { 
            ...req.body, 
            location: finalLocationName, // Ang readable name (e.g., Region I)
            location_type: location_type || schedule.location_type,
            location_table: location_table || schedule.location_table,
            location_id: location_id || schedule.location_id,
            attachment_file: attachmentFile, 
            attachment_path: attachmentPath 
        };

        if (status === 'Tentative' && previousStatus === 'Expired') {
            updatePayload.createdAt = new Date(); // Reset the clock
        }
        
        await schedule.update(updatePayload, { transaction: t });

        // UPDATE PARTICIPANTS (Existing Logic...)
        if (selectedPositions) {
            const positions = typeof selectedPositions === 'string' ? JSON.parse(selectedPositions) : selectedPositions;
            await ScheduleParticipant.destroy({ where: { schedule_id: id }, transaction: t });
            await ScheduleParticipant.bulkCreate(positions.map(p => ({
                schedule_id: id,
                designation_id: p.designationId,
                target_id: p.targetId || null,
                target_type: p.targetType || null,
                is_all: p.isAll || false
            })), { transaction: t });
        }

        // PROMOTION TO EVENTS (Existing Logic...)
        if (status === 'Final' && previousStatus !== 'Final') {
            // ... (ang promotion logic mo ay gagamit na ng schedule.location na updated na sa itaas)
            // Siguraduhin lang na i-refresh ang schedule object o gamitin ang `finalLocationName` 
            // sa INSERT query kung direct db.query ang gamit mo.
            
            const startDate = schedule.start_date ? String(schedule.start_date).slice(0, 10) : null;
            const endDate = schedule.end_date ? String(schedule.end_date).slice(0, 10) : null;

            if (startDate && schedule.start_time && schedule.end_time) {
                const hostUser = schedule.user_id ? await User.findByPk(schedule.user_id, { attributes: ['id', 'email'] }) : null;
                const { assignedOfficeColor } = require('../utils/specialUsers');
                const eventColor = hostUser ? assignedOfficeColor(hostUser) : '#4f6d8a';
                const { rdLabel, pdLabel, edLabel, participantsText } = await resolveParticipantLabels(id);
                const cleanDescription = (schedule.description || '').replace(/^\[TENTATIVE\]\s*/i, '').trim() || null;

                await db.query('DELETE FROM events WHERE title = ? AND date = ?', [schedule.event_title, startDate], { transaction: t });

                await db.query(
                    `INSERT INTO events (title, type, date, end_date, start_time, end_time, location, description, participants, regional_directors_label, provincial_directors_label, executive_directors_label, color, created_by, is_posted, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
                    [schedule.event_title, 'meeting', startDate, (endDate && endDate !== startDate ? endDate : null), schedule.start_time, schedule.end_time, finalLocationName, cleanDescription, participantsText, rdLabel, pdLabel, edLabel, eventColor, schedule.user_id || 1],
                    { transaction: t }
                );
                // ... rest of the promotion logic
            }
        }

        await t.commit();
        return res.status(200).json(schedule);

    } catch (err) {
        if (t && !t.finished) await t.rollback();
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error(err);
        return res.status(400).json({ error: err.message });
    }
},
    async deleteSched(req, res) {
        try {
            const schedule = await Schedule.findByPk(req.params.id);
            if (schedule?.attachment_path) {
                const p = path.join(__dirname, '..', schedule.attachment_path);
                if (fs.existsSync(p)) fs.unlinkSync(p);
            }
            await Schedule.destroy({ where: { id: req.params.id } });
            return res.status(200).json({ message: 'Deleted successfully' });
        } catch (err) { return res.status(500).json({ error: err.message }); }
    },

    // POST: renewSched — reset Expired back to Tentative, refresh created_at
    async renewSched(req, res) {
        try {
            const schedule = await Schedule.findByPk(req.params.id);
            if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
            if (schedule.status !== 'Expired') {
                return res.status(400).json({ error: 'Only Expired schedules can be renewed.' });
            }
            // Use raw query to update both status and created_at (reset the 5-day clock)
            await db.query(
                'UPDATE schedules SET status = ?, created_at = NOW() WHERE id = ?',
                ['Tentative', req.params.id]
            );
            const updated = await Schedule.findByPk(req.params.id);
            return res.status(200).json({ message: 'Schedule renewed successfully.', schedule: updated });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    },

async getAllSched(req, res) {
    try {
        const data = await Schedule.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name'] 
                },
                { 
                    model: ScheduleParticipant, 
                    as: 'schedule_participants', 
                    required: false,
                    include: [{ model: Position, as: 'designation' }] 
                }
            ],
            order: [['start_date', 'DESC'], ['start_time', 'DESC']]
        });

        const now = new Date();
        const EXPIRE_DAYS = 5;
        const WARN_DAYS = 3;

        // 1. Optimized Auto-expiry
        const toExpireIds = data
            .filter(s => {
                if (s.status !== 'Tentative') return false;
                const created = new Date(s.createdAt);
                const diffDays = (now - created) / (1000 * 60 * 60 * 24);
                return diffDays >= EXPIRE_DAYS;
            })
            .map(s => s.id);

        if (toExpireIds.length > 0) {
            await Schedule.update(
                { status: 'Expired' },
                { where: { id: toExpireIds } }
            );
            // I-update ang local data object para accurate ang response
            data.forEach(s => {
                if (toExpireIds.includes(s.id)) s.status = 'Expired';
            });
        }

        // 2. Global Cache para sa buong map operation
        const cache = { region: {}, province: {}, office: {}, cluster: {}, tti: {} };

        const formattedData = await Promise.all(data.map(async (sched) => {
            const plainSched = sched.get({ plain: true });
            plainSched.host_name = plainSched.user?.name || "Unknown User";

            // Compute days as tentative and warning flag
            const created = new Date(plainSched.createdAt);
            const diffDays = (now - created) / (1000 * 60 * 60 * 24);
            plainSched.days_as_tentative = Math.floor(diffDays);
            plainSched.expiry_warning = plainSched.status === 'Tentative' && diffDays >= WARN_DAYS;
            plainSched.days_until_expiry = plainSched.status === 'Tentative'
                ? Math.max(0, Math.ceil(EXPIRE_DAYS - diffDays))
                : null;

            const sourceParticipants = plainSched.schedule_participants || [];
            plainSched.participantDetails = [];

            if (sourceParticipants.length > 0) {
                plainSched.participantDetails = await Promise.all(sourceParticipants.map(async (p) => {
                    let locationName = "";
                    const type = p.target_type ? String(p.target_type).toLowerCase().trim() : "";
                    const tid = p.target_id;

                    if (p.is_all) {
                        locationName = "(All)";
                    } else if (tid) {
                        // OPTIMIZATION: Memoization Switch
                        switch (type) {
                            case 'region':
                                if (!cache.region[tid]) cache.region[tid] = await Region.findByPk(tid);
                                locationName = cache.region[tid] ? `(${cache.region[tid].region})` : "";
                                break;
                            case 'province': case 'prov': case 'district':
                                if (!cache.province[tid]) cache.province[tid] = await Province.findByPk(tid);
                                locationName = cache.province[tid] ? `(${cache.province[tid].name})` : "";
                                break;
                            case 'office':
                                if (!cache.office[tid]) cache.office[tid] = await Office.findByPk(tid);
                                locationName = cache.office[tid] ? `(${cache.office[tid].name || cache.office[tid].abbr})` : "";
                                break;
                            case 'cluster':
                                if (!cache.cluster[tid]) cache.cluster[tid] = await Cluster.findByPk(tid);
                                locationName = cache.cluster[tid] ? `(${cache.cluster[tid].name})` : "";
                                break;
                            case 'tti': case 'school':
                                if (!cache.tti[tid]) cache.tti[tid] = await TTI.findByPk(tid);
                                locationName = cache.tti[tid] ? `(${cache.tti[tid].name})` : "";
                                break;
                            default:
                                locationName = p.target_type ? `(${p.target_type})` : "";
                        }
                    }

                    return {
                        id: p.id,
                        designation: p.designation?.name || 'Participant',
                        location: locationName
                    };
                }));
            }

            plainSched.rawParticipants = sourceParticipants.map(p => ({
                designation_id: p.designation_id,
                target_id: p.target_id,
                target_type: p.target_type,
                is_all: p.is_all,
            }));

            // Lookup promoted event's is_posted if status is Final or Tentative
            plainSched.promoted_event_id = null;
            plainSched.is_posted = null;
            if (plainSched.status === 'Final' || plainSched.status === 'Tentative') {
                try {
                    const startDate = plainSched.start_date ? String(plainSched.start_date).slice(0, 10) : null;
                    if (startDate && plainSched.event_title) {
                        const [evRows] = await db.query(
                            'SELECT id, is_posted FROM events WHERE title = ? AND date = ? AND created_by = ? LIMIT 1',
                            [plainSched.event_title, startDate, plainSched.user_id]
                        );
                        if (evRows.length > 0) {
                            plainSched.promoted_event_id = evRows[0].id;
                            plainSched.is_posted = evRows[0].is_posted === 1 || evRows[0].is_posted === true;
                        }
                    }
                } catch (_) { /* non-critical */ }
            }

            delete plainSched.schedule_participants;
            return plainSched;
        }));

        return res.status(200).json(formattedData);
    } catch (err) { 
        console.error("Error in getAllSched:", err);
        return res.status(500).json({ error: err.message }); 
    }
},

 async getSchedById(req, res) {
    try {
        const data = await Schedule.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name']
                },
                { 
                    model: ScheduleParticipant, 
                    as: 'schedule_participants', 
                    include: [{ model: Position, as: 'designation' }] 
                }
            ]
        });

        if (!data) return res.status(404).json({ error: 'Not found' });

        const plainSched = data.get({ plain: true });
        
        // Gamitin ang 'user' alias
        plainSched.host_name = plainSched.user?.name || "Unknown User";

        if (plainSched.schedule_participants) {
            plainSched.formattedParticipants = await Promise.all(plainSched.schedule_participants.map(async (p) => {
                let locationName = "";
                const type = p.target_type ? String(p.target_type).toLowerCase().trim() : "";

                if (p.is_all) {
                    locationName = "(All)";
                } else {
                    switch (type) {
                        case 'region':
                            const reg = await Region.findByPk(p.target_id);
                            locationName = reg ? `(${reg.region})` : "";
                            break;
                        case 'province': case 'prov': case 'district':
                            const prov = await Province.findByPk(p.target_id);
                            locationName = prov ? `(${prov.name})` : "";
                            break;
                        case 'office':
                            const off = await Office.findByPk(p.target_id);
                            locationName = off ? `(${off.name || off.abbr})` : "";
                            break;
                        case 'cluster':
                            const clus = await Cluster.findByPk(p.target_id);
                            locationName = clus ? `(${clus.name})` : "";
                            break;
                        case 'tti': case 'school':
                            const ttiRecord = await TTI.findByPk(p.target_id);
                            locationName = ttiRecord ? `(${ttiRecord.name})` : "";
                            break;
                        default:
                            locationName = "";
                    }
                }
                return {
                    id: p.id,
                    designation: p.designation?.name || 'Participant',
                    location: locationName,
                    target_type: p.target_type,
                    target_id: p.target_id
                };
            }));
        }

        delete plainSched.schedule_participants;

        return res.status(200).json(plainSched);
    } catch (err) { 
        return res.status(500).json({ error: err.message }); 
    }
},

    // PATCH: toggleSchedulePosted — post/unpost a schedule to the calendar
    async toggleSchedulePosted(req, res) {
        try {
            const { id } = req.params;
            const { is_posted } = req.body;
            if (typeof is_posted !== 'boolean') return res.status(400).json({ error: 'is_posted must be boolean.' });

            const schedule = await Schedule.findByPk(id);
            if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
            if (schedule.status === 'Expired') return res.status(400).json({ error: 'Expired schedules cannot be posted.' });

            const startDate = schedule.start_date ? String(schedule.start_date).slice(0, 10) : null;
            if (!startDate || !schedule.start_time || !schedule.end_time) {
                return res.status(400).json({ error: 'Schedule is missing date or time.' });
            }

            // Find existing promoted event
            const [existing] = await db.query(
                'SELECT id FROM events WHERE title = ? AND date = ? AND created_by = ? LIMIT 1',
                [schedule.event_title, startDate, schedule.user_id]
            );

            if (existing.length > 0) {
                // Event exists — just toggle is_posted
                await db.query('UPDATE events SET is_posted = ? WHERE id = ?', [is_posted ? 1 : 0, existing[0].id]);
                return res.json({ success: true, is_posted, promoted_event_id: existing[0].id });
            }

            // No event yet — if posting, create it now (works for both Tentative and Final)
            if (!is_posted) return res.json({ success: true, is_posted: false, promoted_event_id: null });

            const { assignedOfficeColor } = require('../utils/specialUsers');
            const hostUser = schedule.user_id ? await User.findByPk(schedule.user_id, { attributes: ['id', 'email'] }) : null;
            const eventColor = hostUser ? assignedOfficeColor(hostUser) : '#4f6d8a';
            const endDate = schedule.end_date ? String(schedule.end_date).slice(0, 10) : null;
            const { rdLabel, pdLabel, edLabel, participantsText } = await resolveParticipantLabels(id);

            // For Tentative, add [TENTATIVE] prefix to description so calendar detects it
            const eventTitle = schedule.event_title || 'Untitled';
            const baseDescription = schedule.description || '';
            const eventDescription = schedule.status === 'Tentative'
                ? (baseDescription.startsWith('[TENTATIVE]') ? baseDescription : `[TENTATIVE]\n${baseDescription}`.trim())
                : baseDescription;

            const [result] = await db.query(
                `INSERT INTO events (title, type, date, end_date, start_time, end_time, location, description, participants, regional_directors_label, provincial_directors_label, executive_directors_label, color, created_by, is_posted, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
                [
                    eventTitle, 'meeting', startDate,
                    endDate && endDate !== startDate ? endDate : null,
                    schedule.start_time, schedule.end_time,
                    schedule.location || null, eventDescription,
                    participantsText, rdLabel, pdLabel, edLabel,
                    eventColor, schedule.user_id || 1
                ]
            );

            return res.json({ success: true, is_posted: true, promoted_event_id: result.insertId });
        } catch (err) {
            console.error('toggleSchedulePosted error:', err);
            return res.status(500).json({ error: err.message });
        }
    }
};