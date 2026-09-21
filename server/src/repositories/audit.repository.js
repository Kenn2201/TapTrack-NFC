import pool from './db.js';
export const auditRepository = {
  async create({ actorId, action, entityType, entityId, metadata }) {
    const result = await pool.query(`INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *;`, [actorId || null, action, entityType, entityId || null, JSON.stringify(metadata || {})]);
    return result.rows[0];
  },
  async list({ limit = 200 } = {}) {
    const result = await pool.query(`SELECT a.id, a.actor_id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at, u.email AS actor_email FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_id ORDER BY a.created_at DESC LIMIT $1;`, [limit]);
    return result.rows.map((r) => ({ id: r.id, actorId: r.actor_id, actorEmail: r.actor_email, action: r.action, targetType: r.entity_type, targetId: r.entity_id, metadata: r.metadata, createdAt: r.created_at }));
  },
};
