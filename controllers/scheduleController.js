'use strict';
const { Schedule, ScheduleParticipant, Position, Region, Province, Cluster, Office, sequelize } = require('../models');
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
                    id: excludeScheduleId ? { [Op.ne]: excludeScheduleId } : { [Op.not]: null },
                    [Op.and]: [
                        { start_date: { [Op.lte]: end_date } },
                        { end_date: { [Op.gte]: start_date } }
                    ],
                    [Op.and]: [
                        { start_time: { [Op.lt]: end_time } },
                        { end_time: { [Op.gt]: start_time } }
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

        if (posName.toLowerCase().includes("regional director") && c.target_type === 'province') {
            posName = "Provincial Director";
        }

        if (c.is_all) {
            locationName = "(All)";
        } else {
            const type = c.target_type ? c.target_type.toLowerCase() : "";
            switch (type) {
                case 'region':
                    const reg = await Region.findByPk(c.target_id);
                    locationName = reg ? `(${reg.region})` : `(Region ID: ${c.target_id})`;
                    break;
                case 'province':
                    const prov = await Province.findByPk(c.target_id);
                    locationName = prov ? `(${prov.province_name || prov.name})` : `(Province ID: ${c.target_id})`;
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
                    locationName = c.target_id ? `(ID: ${c.target_id})` : "";
            }
        }

        const sched = c.schedule;
        const formatTime = (timeStr) => {
            const [h, m] = timeStr.split(':');
            const hour = parseInt(h);
            return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
        };

        return `${locationName} ${posName} is already a participant in "${sched.event_title}" on ${sched.start_date} (${formatTime(sched.start_time)} - ${formatTime(sched.end_time)})`;
    }));
};

module.exports = {
    // POST: createSchedule
    async createSched(req, res) {
        const t = await sequelize.transaction();
        try {
            const { host_name, event_title, selectedPositions, start_date, end_date, start_time, end_time } = req.body;

            if (selectedPositions) {
                const conflicts = await findConflicts(selectedPositions, start_date, end_date, start_time, end_time);
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

            let attachmentFile = null, attachmentPath = null;
            if (req.file) {
                const newFileName = `${host_name.replace(/\s+/g, '_')}_${Date.now()}${path.extname(req.file.originalname)}`;
                const dir = path.join(__dirname, '..', 'uploads', 'schedules');
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                const targetPath = path.join(dir, newFileName);
                fs.renameSync(req.file.path, targetPath);
                attachmentFile = req.file.originalname;
                attachmentPath = `/uploads/schedules/${newFileName}`;
            }

            const schedule = await Schedule.create({ ...req.body, attachment_file: attachmentFile, attachment_path: attachmentPath }, { transaction: t });

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
            if (req.file) fs.unlinkSync(req.file.path);
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
                include: [{ model: ScheduleParticipant, as: 'participants', include: [{ model: Position, as: 'designation' }] }],
                order: [['start_date', 'DESC'], ['start_time', 'DESC']]
            });
            return res.status(200).json(data);
        } catch (err) { return res.status(500).json({ error: err.message }); }
    },

    async getSchedById(req, res) {
        try {
            const data = await Schedule.findByPk(req.params.id, {
                include: [{ model: ScheduleParticipant, as: 'participants', include: [{ model: Position, as: 'designation' }] }]
            });
            return data ? res.status(200).json(data) : res.status(404).json({ error: 'Not found' });
        } catch (err) { return res.status(500).json({ error: err.message }); }
    }
};