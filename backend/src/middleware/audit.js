const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/connection');

const logAudit = async (userId, action, entityType, entityId, oldValue, newValue, req) => {
  try {
    const id = uuidv4();
    const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    await query(`
      INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      userId,
      action,
      entityType,
      entityId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      ipAddress,
      userAgent
    ]);
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw - audit logging should not break the main operation
  }
};

module.exports = { logAudit };
