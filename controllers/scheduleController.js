'use strict';
const { Schedule, ScheduleParticipant, Position, Region, Province, Cluster, Office, sequelize, User } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

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
                attributes: ['event_title', 'start_date', 'end_date', 'start_time', 'end_time'],
                where: {
                    // 1. Huwag isama ang sarili kung update ito
                    id: excludeScheduleId ? { [Op.ne]: excludeScheduleId } : { [Op.not]: null },
                    
                    // 2. DATE OVERLAP: (ExistingStart <= NewEnd) AND (ExistingEnd >= NewStart)
                    [Op.and]: [
                        { start_date: { [Op.lte]: end_date } },
                        { end_date: { [Op.gte]: start_date } },
                        
                        // 3. TIME OVERLAP: (ExistingStartTime < NewEndTime) AND (ExistingEndTime > NewStartTime)
                        // Nilagay natin ito sa loob ng parehong Op.and para gumana lang siya kung PASOK ang date.
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
                    return { designation_id: p.designationId };
                } else {
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
    return await Promise.all(conflicts.map(async (c) => {
        let posName = c.designation?.name || 'Participant';
        let locationName = "";

        // Siguraduhin nating lowercase at walang extra space para sa switch logic
        const type = c.target_type ? String(c.target_type).toLowerCase().trim() : "";

        // Label adjustment para sa Provincial Director
        if (posName.toLowerCase().includes("regional director") && type === 'province') {
            posName = "Provincial Director";
        }

        if (c.is_all) {
            locationName = "(All)";
        } else {
            switch (type) {
                case 'region':
                    const reg = await Region.findByPk(c.target_id);
                    locationName = reg ? `(${reg.region})` : `(Region ID: ${c.target_id})`;
                    break;

                // DITO ANG FIX: Pinagsama natin ang province at district 
                // dahil sabi mo pareho silang nasa 'provinces' table.
                case 'province':
                case 'prov':
                case 'district': 
                    const prov = await Province.findByPk(c.target_id);
                    // 'name' lang ang column mo sa model, kaya prov.name lang dapat
                    locationName = prov ? `(${prov.name})` : `(${type.toUpperCase()} ID: ${c.target_id})`;
                    break;

                case 'office':
                    const off = await Office.findByPk(c.target_id);
                    locationName = off ? `(${off.name || off.abbr})` : `(Office ID: ${c.target_id})`;
                    break;

                case 'cluster':
                    const clus = await Cluster.findByPk(c.target_id);
                    locationName = clus ? `(${clus.name})` : `(Cluster ID: ${c.target_id})`;
                    break;

                case 'co': locationName = "(Central Office)"; break;
                case 'ro': locationName = "(Regional Office)"; break;
                case 'po': locationName = "(Provincial Office)"; break;
                case 'do': locationName = "(District Office)"; break;
                case 'ti': locationName = "(Training Institute)"; break;
                
                default:
                    // Kung hindi pumasok sa cases sa itaas, dito babagsak
                    locationName = c.target_id ? `(ID: ${c.target_id})` : "";
            }
        }

        const sched = c.schedule;
        const formatTime = (timeStr) => {
            if (!timeStr) return "";
            const [h, m] = timeStr.split(':');
            const hour = parseInt(h);
            return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
        };

        const dateDisplay = sched.start_date === sched.end_date 
            ? sched.start_date 
            : `${sched.start_date} to ${sched.end_date}`;

        return `${locationName} ${posName} is already a participant in "${sched.event_title}" on ${dateDisplay} (${formatTime(sched.start_time)} - ${formatTime(sched.end_time)})`;
    }));
};

module.exports = {
    // POST: createSchedule
        async createSched(req, res) {
        const t = await sequelize.transaction();
        try {
            // 1. Kunin ang user_id mula sa auth middleware
            const userId = req.user.id; 

            // Inalis na natin ang host_name at host_division sa destructuring
            const { 
                event_title, 
                selectedPositions, 
                start_date, 
                end_date, 
                start_time, 
                end_time,
                ...otherData 
            } = req.body;

            // 2. Conflict Detection
            if (selectedPositions) {
                const positions = typeof selectedPositions === 'string' ? JSON.parse(selectedPositions) : selectedPositions;
                const conflicts = await findConflicts(positions, start_date, end_date, start_time, end_time);
                
                if (conflicts.length > 0) {
                    if (req.file) fs.unlinkSync(req.file.path);
                    await t.rollback();
                    const details = await formatConflictMessages(conflicts);
                    return res.status(409).json({ 
                        error: "Schedule Conflict Detected", 
                        conflicts: [...new Set(details)],
                        message: "Please select a time after the conflicting event ends."
                    });
                }
            }

            // 3. File Attachment Handling
            let attachmentFile = null, attachmentPath = null;
            if (req.file) {
                // Dahil wala na tayong host_name sa body, gagamit tayo ng generic prefix o user_id
                const newFileName = `user_${userId}_${Date.now()}${path.extname(req.file.originalname)}`;
                const dir = path.join(__dirname, '..', 'uploads', 'schedules');
                
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                
                const targetPath = path.join(dir, newFileName);
                fs.renameSync(req.file.path, targetPath);
                
                attachmentFile = req.file.originalname;
                attachmentPath = `/uploads/schedules/${newFileName}`;
            }

            // 4. Create Schedule Record
            // Idinagdag ang user_id at status, tinanggal ang reliance sa host_name/office
            const schedule = await Schedule.create({ 
                ...otherData,
                user_id: userId, // Eto ang importante
                event_title,
                start_date,
                end_date,
                start_time,
                end_time,
                status: 'Tentative', 
                attachment_file: attachmentFile, 
                attachment_path: attachmentPath 
            }, { transaction: t });

            // 5. Create Participants
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
            console.error(err);
            return res.status(400).json({ error: err.message });
        }
    },

    // POST: updateSchedule
    async updateSched(req, res) {
        const t = await sequelize.transaction();
        try {
            const { id } = req.params;
            const { selectedPositions, start_date, end_date, start_time, end_time } = req.body;
            let schedule = await Schedule.findByPk(id);
            if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

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
                        conflicts: [...new Set(details)],
                        message: "Please select a time after the conflicting event ends."
                    });
                }
            }

            let attachmentFile = schedule.attachment_file, attachmentPath = schedule.attachment_path;
            if (req.file) {
                const newFileName = `UPDATED_${Date.now()}${path.extname(req.file.originalname)}`;
                const targetPath = path.join(__dirname, '..', 'uploads', 'schedules', newFileName);
                fs.renameSync(req.file.path, targetPath);
                if (schedule.attachment_path) {
                    const oldP = path.join(__dirname, '..', schedule.attachment_path);
                    if (fs.existsSync(oldP)) fs.unlinkSync(oldP);
                }
                attachmentFile = req.file.originalname;
                attachmentPath = `/uploads/schedules/${newFileName}`;
            }

            await schedule.update({ ...req.body, attachment_file: attachmentFile, attachment_path: attachmentPath }, { transaction: t });

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

            await t.commit();
            return res.status(200).json(schedule);
        } catch (err) {
            if (t && !t.finished) await t.rollback();
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

async getAllSched(req, res) {
    try {
        const data = await Schedule.findAll({
            include: [
                {
                    model: User,
                    as: 'user', // Ito ang alias sa model mo
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

        const formattedData = await Promise.all(data.map(async (sched) => {
            const plainSched = sched.get({ plain: true });

            // Automatic host_name assignment gamit ang tamang alias ('user')
            plainSched.host_name = plainSched.user?.name || "Unknown User";

            const sourceParticipants = plainSched.schedule_participants || [];
            plainSched.participantDetails = [];

            if (sourceParticipants.length > 0) {
                plainSched.participantDetails = await Promise.all(sourceParticipants.map(async (p) => {
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

            // Linisin ang lumang association fields
            delete plainSched.schedule_participants; 
            // Iniiwan natin ang plainSched.user para sa frontend backup
            
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
}
};