const supabase = require('../config/supabase');

const logAction = async (actorUserId, action, entityType, entityId, oldValue = null, newValue = null, ipAddress = null) => {
  try {
    await supabase.from('audit_logs').insert({
      actor_user_id: actorUserId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldValue,
      new_value: newValue,
      ip_address: ipAddress
    });
  } catch (err) {
    console.error('Audit log xatosi:', err.message);
  }
};

module.exports = { logAction };
