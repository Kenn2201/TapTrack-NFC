import pool from './db.js';

const mapSettings = (row) => row && ({
  maintenanceEnabled: row.maintenance_enabled,
  maintenanceMessage: row.maintenance_message,
  estimatedReturn: row.estimated_return,
  releaseLabel: row.release_label,
  updatedBy: row.updated_by,
  updatedAt: row.updated_at,
});

export const settingsRepository = {
  async get() {
    const result = await pool.query(`
      SELECT maintenance_enabled, maintenance_message, estimated_return, release_label, updated_by, updated_at
      FROM platform_settings WHERE id = 1 LIMIT 1;
    `);
    return mapSettings(result.rows[0]) || { maintenanceEnabled: false };
  },

  async update({ enabled, message, estimatedReturn, releaseLabel, updatedBy }) {
    const result = await pool.query(`
      UPDATE platform_settings
      SET maintenance_enabled = $1,
          maintenance_message = COALESCE($2, maintenance_message),
          estimated_return = COALESCE($3, estimated_return),
          release_label = COALESCE($4, release_label),
          updated_by = $5,
          updated_at = NOW()
      WHERE id = 1
      RETURNING maintenance_enabled, maintenance_message, estimated_return, release_label, updated_by, updated_at;
    `, [enabled, message ?? null, estimatedReturn ?? null, releaseLabel ?? null, updatedBy]);
    return mapSettings(result.rows[0]);
  },
};

export default settingsRepository;