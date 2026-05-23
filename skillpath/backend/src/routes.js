const express = require('express');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

const router = express.Router();

// ============================================
// CAREER TRACKS
// ============================================

// GET /api/career-tracks
router.get('/career-tracks', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('career_tracks')
      .select(`
        *, 
        department:departments(id, department_name),
        career_levels(id, level_name, level_order)
      `)
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ careerTracks: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/career-tracks/:id
router.get('/career-tracks/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('career_tracks')
      .select(`
        *,
        department:departments(id, department_name),
        career_levels(
          id, level_name, level_order, description, promotion_criteria,
          career_level_skills(*, skill:skills(*)),
          career_level_trainings(*, training:trainings(*))
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Career track topilmadi' });
    res.json({ careerTrack: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/career-tracks
router.post('/career-tracks', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { trackName, departmentId, description } = req.body;
    if (!trackName) return res.status(400).json({ error: 'Track nomi kiritilishi shart' });

    const { data, error } = await supabase
      .from('career_tracks')
      .insert({ track_name: trackName, department_id: departmentId, description, created_by: req.user.id })
      .select()
      .single();

    if (error) throw error;
    await logAction(req.user.id, 'CAREER_TRACK_CREATED', 'career_tracks', data.id, null, data);
    res.status(201).json({ careerTrack: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/career-tracks/:id/levels
router.post('/career-tracks/:id/levels', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { levelName, levelOrder, description, promotionCriteria } = req.body;
    const { data, error } = await supabase
      .from('career_levels')
      .insert({
        career_track_id: req.params.id,
        level_name: levelName,
        level_order: levelOrder,
        description,
        promotion_criteria: promotionCriteria
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ careerLevel: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/career-levels/:id/skills
router.post('/career-levels/:id/skills', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { skillId, requiredScore, weight, isMandatory } = req.body;
    const { data, error } = await supabase
      .from('career_level_skills')
      .insert({ career_level_id: req.params.id, skill_id: skillId, required_score: requiredScore, weight: weight || 1.0, is_mandatory: isMandatory !== false })
      .select('*, skill:skills(*)')
      .single();

    if (error) throw error;
    res.status(201).json({ levelSkill: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/career-levels/:id/trainings
router.post('/career-levels/:id/trainings', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { trainingId, isRequired, dueDaysAfterAssignment } = req.body;
    const { data, error } = await supabase
      .from('career_level_trainings')
      .insert({ career_level_id: req.params.id, training_id: trainingId, is_required: isRequired !== false, due_days_after_assignment: dueDaysAfterAssignment || 30 })
      .select('*, training:trainings(*)')
      .single();

    if (error) throw error;
    res.status(201).json({ levelTraining: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SKILLS
// ============================================

// GET /api/skills
router.get('/skills', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('skills').select('*').eq('status', 'ACTIVE').order('skill_name');
    if (error) throw error;
    res.json({ skills: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/skills
router.post('/skills', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { skillName, category, description } = req.body;
    const { data, error } = await supabase
      .from('skills').insert({ skill_name: skillName, category, description }).select().single();
    if (error) throw error;
    res.status(201).json({ skill: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee-skills/:employeeId
router.patch('/employee-skills/:employeeId', authenticate, async (req, res) => {
  try {
    // Permission: HR or employee's manager
    const { skillId, score, source } = req.body;

    const { data, error } = await supabase
      .from('employee_skills')
      .upsert({
        employee_id: req.params.employeeId,
        skill_id: skillId,
        current_score: score,
        source: source || 'MANAGER_REVIEW',
        updated_by: req.user.id
      }, { onConflict: 'employee_id,skill_id' })
      .select()
      .single();

    if (error) throw error;
    await logAction(req.user.id, 'SKILL_SCORE_UPDATED', 'employee_skills', data.id, null, data);
    res.json({ employeeSkill: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// TRAININGS
// ============================================

// GET /api/trainings
router.get('/trainings', authenticate, async (req, res) => {
  try {
    const { search, category, status = 'ACTIVE' } = req.query;
    let query = supabase.from('trainings').select('*').eq('status', status);
    if (search) query = query.ilike('training_name', `%${search}%`);
    if (category) query = query.eq('category', category);
    const { data, error } = await query.order('training_name');
    if (error) throw error;
    res.json({ trainings: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trainings
router.post('/trainings', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { trainingName, category, description, contentType, durationMinutes, isComplianceRequired } = req.body;
    const { data, error } = await supabase
      .from('trainings')
      .insert({ training_name: trainingName, category, description, content_type: contentType || 'COURSE', duration_minutes: durationMinutes, is_compliance_required: isComplianceRequired || false, created_by: req.user.id })
      .select().single();
    if (error) throw error;
    res.status(201).json({ training: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trainings/assign
router.post('/trainings/assign', authenticate, authorize('HR_MANAGER', 'BRANCH_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { employeeId, trainingId, dueDate, isRequired } = req.body;

    // Check duplicate
    const { data: existing } = await supabase
      .from('employee_trainings').select('id').eq('employee_id', employeeId).eq('training_id', trainingId).in('status', ['NOT_STARTED', 'IN_PROGRESS']).single();
    if (existing) return res.status(400).json({ error: 'Bu training allaqachon tayinlangan' });

    const { data, error } = await supabase
      .from('employee_trainings')
      .insert({ employee_id: employeeId, training_id: trainingId, assigned_by: req.user.id, due_date: dueDate, is_required: isRequired || false })
      .select('*, training:trainings(*)')
      .single();

    if (error) throw error;
    await logAction(req.user.id, 'TRAINING_ASSIGNED', 'employee_trainings', data.id, null, data);
    res.status(201).json({ assignment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee-trainings/:id/start
router.patch('/employee-trainings/:id/start', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employee_trainings')
      .update({ status: 'IN_PROGRESS', progress: 10 })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ assignment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employee-trainings/:id/complete
router.patch('/employee-trainings/:id/complete', authenticate, async (req, res) => {
  try {
    const { data: et } = await supabase.from('employee_trainings').select('*').eq('id', req.params.id).single();
    const { data, error } = await supabase
      .from('employee_trainings')
      .update({ status: 'COMPLETED', progress: 100, completed_at: new Date() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    await logAction(req.user.id, 'TRAINING_COMPLETED', 'employee_trainings', req.params.id);
    res.json({ assignment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employees/:id/trainings
router.get('/employees/:id/trainings', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employee_trainings')
      .select('*, training:trainings(*)')
      .eq('employee_id', req.params.id)
      .order('assigned_at', { ascending: false });
    if (error) throw error;
    res.json({ trainings: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// FEEDBACK
// ============================================

// GET /api/employees/:id/feedback
router.get('/employees/:id/feedback', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*, skill:skills(skill_name), manager:employees!manager_id(full_name)')
      .eq('employee_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ feedback: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees/:id/feedback
router.post('/employees/:id/feedback', authenticate, authorize('BRANCH_MANAGER', 'HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { skillId, feedbackText, evidenceText, rating, recommendation } = req.body;
    if (!feedbackText) return res.status(400).json({ error: 'Feedback matni kiritilishi shart' });
    if (recommendation === 'READY_FOR_DISCUSSION' && !evidenceText) {
      return res.status(400).json({ error: 'Promotion discussion uchun evidence kiritilishi shart' });
    }

    const { data: managerEmp } = await supabase
      .from('employees').select('id').eq('user_id', req.user.id).single();

    const { data, error } = await supabase
      .from('feedback')
      .insert({
        employee_id: req.params.id,
        manager_id: managerEmp?.id || req.user.id,
        skill_id: skillId || null,
        feedback_text: feedbackText,
        evidence_text: evidenceText || null,
        rating: rating || null,
        recommendation: recommendation || null
      })
      .select('*, skill:skills(skill_name)')
      .single();

    if (error) throw error;
    await logAction(req.user.id, 'FEEDBACK_ADDED', 'feedback', data.id, null, data);
    res.status(201).json({ feedback: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// PROMOTION PACKETS
// ============================================

// POST /api/promotion-packets/generate
router.post('/promotion-packets/generate', authenticate, authorize('HR_MANAGER', 'BRANCH_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { employeeId, targetLevelId } = req.body;

    const { data: employee } = await supabase
      .from('employees')
      .select('*, current_level:career_levels(*)')
      .eq('id', employeeId).single();

    if (!employee) return res.status(404).json({ error: 'Xodim topilmadi' });

    // Calculate readiness
    const readiness = await generateReadinessPacket(employeeId, employee.current_level_id, targetLevelId);

    const { data: packet, error } = await supabase
      .from('promotion_packets')
      .insert({
        employee_id: employeeId,
        current_level_id: employee.current_level_id,
        target_level_id: targetLevelId,
        created_by: req.user.id,
        readiness_score: readiness.totalScore,
        summary: `Promotion readiness: ${readiness.totalScore}% - ${readiness.status}`
      })
      .select()
      .single();

    if (error) throw error;

    // Insert packet items
    const items = readiness.items.map(item => ({
      promotion_packet_id: packet.id,
      item_type: item.type,
      item_title: item.title,
      item_status: item.status,
      evidence: item.evidence || null
    }));

    await supabase.from('promotion_packet_items').insert(items);

    await logAction(req.user.id, 'PROMOTION_PACKET_GENERATED', 'promotion_packets', packet.id, null, packet);
    res.status(201).json({ packet, readiness });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/promotion-packets
router.get('/promotion-packets', authenticate, async (req, res) => {
  try {
    let query = supabase
      .from('promotion_packets')
      .select(`
        *,
        employee:employees(id, full_name, employee_code, branch:branches(branch_name)),
        current_level:career_levels!current_level_id(level_name),
        target_level:career_levels!target_level_id(level_name)
      `)
      .order('created_at', { ascending: false });

    if (req.user.role === 'BRANCH_MANAGER') {
      const { data: managerEmp } = await supabase.from('employees').select('id').eq('user_id', req.user.id).single();
      const { data: teamEmps } = await supabase.from('employees').select('id').eq('manager_id', managerEmp?.id);
      const empIds = teamEmps?.map(e => e.id) || [];
      query = query.in('employee_id', empIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ packets: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/promotion-packets/:id
router.get('/promotion-packets/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('promotion_packets')
      .select(`
        *,
        employee:employees(*, branch:branches(*), department:departments(*)),
        current_level:career_levels!current_level_id(*),
        target_level:career_levels!target_level_id(*),
        promotion_packet_items(*)
      `)
      .eq('id', req.params.id).single();

    if (error || !data) return res.status(404).json({ error: 'Packet topilmadi' });
    res.json({ packet: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/promotion-packets/:id/status
router.patch('/promotion-packets/:id/status', authenticate, authorize('HR_MANAGER', 'BRANCH_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { status, hrDecision, managerRecommendation } = req.body;
    const updates = { status };
    if (hrDecision) updates.hr_decision = hrDecision;
    if (managerRecommendation) updates.manager_recommendation = managerRecommendation;

    const { data, error } = await supabase
      .from('promotion_packets').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;

    await logAction(req.user.id, 'PROMOTION_DECISION_UPDATED', 'promotion_packets', req.params.id, null, { status });
    res.json({ packet: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// BRANCHES & DEPARTMENTS
// ============================================

router.get('/branches', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('branches').select('*, manager:employees!manager_id(id, full_name)').eq('status', 'ACTIVE').order('branch_name');
    if (error) throw error;
    res.json({ branches: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/branches', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { branchName, branchCode, city, address, managerId } = req.body;
    const { data, error } = await supabase
      .from('branches').insert({ branch_name: branchName, branch_code: branchCode, city, address, manager_id: managerId || null }).select().single();
    if (error) throw error;
    res.status(201).json({ branch: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/departments', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('departments').select('*').eq('status', 'ACTIVE').order('department_name');
    if (error) throw error;
    res.json({ departments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// REPORTS
// ============================================

router.get('/reports/training-completion', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employee_trainings')
      .select('status, employee:employees(branch:branches(branch_name), department:departments(department_name))');
    if (error) throw error;

    const summary = { total: data.length, completed: 0, inProgress: 0, overdue: 0, notStarted: 0 };
    data.forEach(t => {
      if (t.status === 'COMPLETED') summary.completed++;
      else if (t.status === 'IN_PROGRESS') summary.inProgress++;
      else if (t.status === 'OVERDUE') summary.overdue++;
      else summary.notStarted++;
    });

    res.json({ summary, completionRate: data.length > 0 ? Math.round((summary.completed / data.length) * 100) : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/promotion-pipeline', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('promotion_packets')
      .select('status, readiness_score, employee:employees(full_name, branch:branches(branch_name))')
      .order('readiness_score', { ascending: false });
    if (error) throw error;
    res.json({ pipeline: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// NOTIFICATIONS
// ============================================

router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications').select('*').eq('user_id', req.user.id)
      .order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    const unreadCount = data?.filter(n => !n.is_read).length || 0;
    res.json({ notifications: data, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'O\'qildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// AUDIT LOGS
// ============================================

router.get('/audit-logs', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { entity_type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let query = supabase
      .from('audit_logs')
      .select('*, actor:users!actor_user_id(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);
    if (entity_type) query = query.eq('entity_type', entity_type);
    const { data, count, error } = await query;
    if (error) throw error;
    res.json({ logs: data, total: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function generateReadinessPacket(employeeId, currentLevelId, targetLevelId) {
  const items = [];

  // Trainings check
  const { data: reqTrainings } = await supabase
    .from('career_level_trainings').select('*, training:trainings(*)').eq('career_level_id', targetLevelId);
  const { data: empTrainings } = await supabase
    .from('employee_trainings').select('*').eq('employee_id', employeeId);

  const completedIds = new Set(empTrainings?.filter(t => t.status === 'COMPLETED').map(t => t.training_id) || []);
  reqTrainings?.forEach(rt => {
    items.push({
      type: rt.training.is_compliance_required ? 'COMPLIANCE' : 'TRAINING',
      title: rt.training.training_name,
      status: completedIds.has(rt.training_id) ? 'COMPLETED' : 'MISSING'
    });
  });

  // Skills check
  const { data: reqSkills } = await supabase
    .from('career_level_skills').select('*, skill:skills(*)').eq('career_level_id', targetLevelId);
  const { data: empSkills } = await supabase
    .from('employee_skills').select('*').eq('employee_id', employeeId);
  const skillMap = new Map(empSkills?.map(s => [s.skill_id, s.current_score]) || []);
  reqSkills?.forEach(rs => {
    const current = skillMap.get(rs.skill_id) || 0;
    items.push({
      type: 'SKILL',
      title: `${rs.skill.skill_name} (${current}/${rs.required_score})`,
      status: current >= rs.required_score ? 'COMPLETED' : 'PENDING',
      evidence: `Joriy ball: ${current}, Kerakli: ${rs.required_score}`
    });
  });

  // Feedback check
  const { data: feedbacks } = await supabase
    .from('feedback').select('*').eq('employee_id', employeeId);
  items.push({
    type: 'FEEDBACK',
    title: `Manager feedbacklari (${feedbacks?.length || 0} ta)`,
    status: feedbacks?.length > 0 ? 'COMPLETED' : 'MISSING'
  });

  const completed = items.filter(i => i.status === 'COMPLETED').length;
  const totalScore = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  let status;
  if (totalScore >= 90) status = 'READY_FOR_DISCUSSION';
  else if (totalScore >= 75) status = 'ALMOST_READY';
  else if (totalScore >= 50) status = 'IN_PROGRESS';
  else status = 'NOT_READY';

  return { totalScore, status, items };
}

module.exports = router;
