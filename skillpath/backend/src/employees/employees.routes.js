const express = require('express');
const bcrypt = require('bcryptjs');
const { body, query, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');
const { logAction } = require('../middleware/audit');

const router = express.Router();

// GET /api/employees - barcha xodimlar (HR), yoki o'z jamoasi (Manager)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, branch_id, department_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let queryBuilder = supabase
      .from('employees')
      .select(`
        id, employee_code, full_name, employee_role, employment_status, hire_date, created_at,
        branch:branches(id, branch_name, city),
        department:departments(id, department_name),
        career_track:career_tracks(id, track_name),
        current_level:career_levels(id, level_name, level_order),
        manager:employees!manager_id(id, full_name)
      `, { count: 'exact' });

    // Role-based filtering
    if (req.user.role === 'BRANCH_MANAGER') {
      // Manager faqat o'z xodimlarini ko'radi
      const { data: managerEmployee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', req.user.id)
        .single();
      
      if (!managerEmployee) return res.status(403).json({ error: 'Manager profili topilmadi' });
      queryBuilder = queryBuilder.eq('manager_id', managerEmployee.id);
    } else if (req.user.role === 'EMPLOYEE') {
      // Employee faqat o'zini ko'radi
      queryBuilder = queryBuilder.eq('user_id', req.user.id);
    }

    if (search) {
      queryBuilder = queryBuilder.or(`full_name.ilike.%${search}%,employee_code.ilike.%${search}%`);
    }
    if (branch_id) queryBuilder = queryBuilder.eq('branch_id', branch_id);
    if (department_id) queryBuilder = queryBuilder.eq('department_id', department_id);
    if (status) queryBuilder = queryBuilder.eq('employment_status', status);

    queryBuilder = queryBuilder
      .range(offset, offset + parseInt(limit) - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await queryBuilder;
    if (error) throw error;

    res.json({
      employees: data,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employees/:id - bitta xodim profili
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Permission check
    if (req.user.role === 'EMPLOYEE') {
      const { data: self } = await supabase
        .from('employees').select('id').eq('user_id', req.user.id).single();
      if (!self || self.id !== req.params.id) {
        return res.status(403).json({ error: 'Ruxsat yo\'q' });
      }
    }

    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        *,
        branch:branches(id, branch_name, city, address),
        department:departments(id, department_name),
        career_track:career_tracks(id, track_name, description),
        current_level:career_levels(id, level_name, level_order, description),
        manager:employees!manager_id(id, full_name, employee_role),
        user:users(id, email, last_login_at)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !employee) {
      return res.status(404).json({ error: 'Xodim topilmadi' });
    }

    // Training progress
    const { data: trainings } = await supabase
      .from('employee_trainings')
      .select('status, progress')
      .eq('employee_id', req.params.id);

    const trainingStats = {
      total: trainings?.length || 0,
      completed: trainings?.filter(t => t.status === 'COMPLETED').length || 0,
      inProgress: trainings?.filter(t => t.status === 'IN_PROGRESS').length || 0,
      overdue: trainings?.filter(t => t.status === 'OVERDUE').length || 0
    };

    // Skill gaps (if career level set)
    let skillGaps = [];
    if (employee.current_level_id) {
      const nextLevel = await getNextLevel(employee.career_track_id, employee.current_level?.level_order);
      if (nextLevel) {
        skillGaps = await calculateSkillGap(req.params.id, nextLevel.id);
      }
    }

    // Promotion readiness
    let promotionReadiness = null;
    if (employee.career_track_id) {
      const nextLevel = await getNextLevel(employee.career_track_id, employee.current_level?.level_order);
      if (nextLevel) {
        promotionReadiness = await calculateReadiness(req.params.id, nextLevel.id);
      }
    }

    res.json({
      employee,
      trainingStats,
      skillGaps,
      promotionReadiness
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/employees - yangi xodim yaratish (HR only)
router.post('/', authenticate, authorize('HR_MANAGER', 'ADMIN'), [
  body('fullName').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('employeeCode').notEmpty().trim(),
  body('branchId').isUUID().optional({ nullable: true }),
  body('departmentId').isUUID().optional({ nullable: true })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { fullName, email, employeeCode, branchId, departmentId, employeeRole, managerId, hireDate } = req.body;

    // Create user account
    const defaultPassword = 'SkillPath@' + Math.random().toString(36).slice(-6);
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ full_name: fullName, email, password_hash: passwordHash, role: 'EMPLOYEE' })
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') return res.status(400).json({ error: 'Bu email allaqachon mavjud' });
      throw userError;
    }

    const { data: employee, error: empError } = await supabase
      .from('employees')
      .insert({
        user_id: user.id,
        employee_code: employeeCode,
        full_name: fullName,
        branch_id: branchId || null,
        department_id: departmentId || null,
        employee_role: employeeRole || null,
        manager_id: managerId || null,
        hire_date: hireDate || null
      })
      .select()
      .single();

    if (empError) {
      await supabase.from('users').delete().eq('id', user.id);
      if (empError.code === '23505') return res.status(400).json({ error: 'Employee code allaqachon mavjud' });
      throw empError;
    }

    await logAction(req.user.id, 'EMPLOYEE_CREATED', 'employees', employee.id, null, employee);

    res.status(201).json({
      employee,
      temporaryPassword: defaultPassword,
      message: 'Xodim muvaffaqiyatli yaratildi'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/employees/:id - xodimni yangilash (HR)
router.put('/:id', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { data: oldEmployee } = await supabase
      .from('employees').select('*').eq('id', req.params.id).single();

    if (!oldEmployee) return res.status(404).json({ error: 'Xodim topilmadi' });

    const updates = {};
    const allowedFields = ['full_name', 'branch_id', 'department_id', 'employee_role', 'manager_id', 'hire_date'];
    allowedFields.forEach(field => {
      const camelField = field.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      if (req.body[camelField] !== undefined) updates[field] = req.body[camelField];
    });

    const { data: employee, error } = await supabase
      .from('employees').update(updates).eq('id', req.params.id).select().single();

    if (error) throw error;

    await logAction(req.user.id, 'EMPLOYEE_UPDATED', 'employees', req.params.id, oldEmployee, employee);
    res.json({ employee, message: 'Xodim muvaffaqiyatli yangilandi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employees/:id/assign-career-track
router.patch('/:id/assign-career-track', authenticate, authorize('HR_MANAGER', 'ADMIN'), [
  body('careerTrackId').isUUID(),
  body('levelId').isUUID()
], async (req, res) => {
  try {
    const { data: oldEmp } = await supabase.from('employees').select('*').eq('id', req.params.id).single();
    
    const { data: employee, error } = await supabase
      .from('employees')
      .update({ career_track_id: req.body.careerTrackId, current_level_id: req.body.levelId })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Auto-assign required trainings for this level
    await assignLevelTrainings(req.params.id, req.body.levelId, req.user.id);

    await logAction(req.user.id, 'CAREER_TRACK_ASSIGNED', 'employees', req.params.id, 
      { careerTrackId: oldEmp.career_track_id }, { careerTrackId: req.body.careerTrackId });

    res.json({ employee, message: 'Career track muvaffaqiyatli tayinlandi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/employees/:id/deactivate
router.patch('/:id/deactivate', authenticate, authorize('HR_MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .update({ employment_status: 'INACTIVE' })
      .eq('id', req.params.id)
      .select()
      .single();

    await supabase.from('users').update({ status: 'INACTIVE' }).eq('id', employee.user_id);
    await logAction(req.user.id, 'EMPLOYEE_DEACTIVATED', 'employees', req.params.id);

    res.json({ message: 'Xodim deaktivlashtirildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/employees/:id/learning-path
router.get('/:id/learning-path', authenticate, async (req, res) => {
  try {
    const { data: employee } = await supabase
      .from('employees')
      .select('*, current_level:career_levels(*, career_track_id)')
      .eq('id', req.params.id)
      .single();

    if (!employee || !employee.career_track_id) {
      return res.json({ message: 'Career track tayinlanmagan', learningPath: null });
    }

    const nextLevel = await getNextLevel(employee.career_track_id, employee.current_level?.level_order);

    if (!nextLevel) {
      return res.json({ message: 'Eng yuqori darajaga yetildi', learningPath: null, isTopLevel: true });
    }

    // Required trainings for next level
    const { data: requiredTrainings } = await supabase
      .from('career_level_trainings')
      .select('*, training:trainings(*)')
      .eq('career_level_id', nextLevel.id);

    // Employee's current training status
    const { data: employeeTrainings } = await supabase
      .from('employee_trainings')
      .select('*, training:trainings(id, training_name)')
      .eq('employee_id', req.params.id);

    const completedTrainingIds = new Set(
      employeeTrainings?.filter(t => t.status === 'COMPLETED').map(t => t.training_id) || []
    );

    const trainingPath = requiredTrainings?.map(rt => ({
      ...rt,
      isCompleted: completedTrainingIds.has(rt.training_id),
      employeeTraining: employeeTrainings?.find(et => et.training_id === rt.training_id) || null
    }));

    const completedCount = trainingPath?.filter(t => t.isCompleted).length || 0;
    const totalRequired = trainingPath?.length || 0;
    const progress = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;

    // Skill gaps
    const skillGaps = await calculateSkillGap(req.params.id, nextLevel.id);

    res.json({
      currentLevel: employee.current_level,
      targetLevel: nextLevel,
      trainingPath,
      skillGaps,
      progress,
      completedCount,
      totalRequired
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Get next career level
async function getNextLevel(careerTrackId, currentOrder) {
  if (!careerTrackId) return null;
  const nextOrder = (currentOrder || 0) + 1;
  const { data } = await supabase
    .from('career_levels')
    .select('*')
    .eq('career_track_id', careerTrackId)
    .eq('level_order', nextOrder)
    .single();
  return data;
}

// Helper: Calculate skill gap
async function calculateSkillGap(employeeId, targetLevelId) {
  const { data: required } = await supabase
    .from('career_level_skills')
    .select('*, skill:skills(*)')
    .eq('career_level_id', targetLevelId);

  const { data: empSkills } = await supabase
    .from('employee_skills')
    .select('*')
    .eq('employee_id', employeeId);

  const skillMap = new Map(empSkills?.map(s => [s.skill_id, s]) || []);

  return (required || []).map(req => {
    const empSkill = skillMap.get(req.skill_id);
    const currentScore = empSkill?.current_score || 0;
    const gap = Math.max(0, req.required_score - currentScore);
    return {
      skill: req.skill,
      requiredScore: req.required_score,
      currentScore,
      gap,
      passed: currentScore >= req.required_score,
      weight: req.weight,
      isMandatory: req.is_mandatory
    };
  });
}

// Helper: Calculate promotion readiness
async function calculateReadiness(employeeId, targetLevelId) {
  // Training completion (30%)
  const { data: reqTrainings } = await supabase
    .from('career_level_trainings')
    .select('training_id, is_required')
    .eq('career_level_id', targetLevelId);

  const { data: empTrainings } = await supabase
    .from('employee_trainings')
    .select('training_id, status')
    .eq('employee_id', employeeId);

  const completedIds = new Set(empTrainings?.filter(t => t.status === 'COMPLETED').map(t => t.training_id) || []);
  const requiredIds = reqTrainings?.filter(t => t.is_required) || [];
  const trainingScore = requiredIds.length > 0 
    ? (requiredIds.filter(t => completedIds.has(t.training_id)).length / requiredIds.length) * 30 : 30;

  // Skill gap (35%)
  const skillGaps = await calculateSkillGap(employeeId, targetLevelId);
  const passedSkills = skillGaps.filter(s => s.passed).length;
  const skillScore = skillGaps.length > 0 ? (passedSkills / skillGaps.length) * 35 : 35;

  // Compliance (15%) - compliance trainings completed
  const { data: complianceTrainings } = await supabase
    .from('career_level_trainings')
    .select('training_id, training:trainings(is_compliance_required)')
    .eq('career_level_id', targetLevelId);
  const complianceRequired = complianceTrainings?.filter(t => t.training?.is_compliance_required) || [];
  const complianceCompleted = complianceRequired.filter(t => completedIds.has(t.training_id));
  const complianceScore = complianceRequired.length > 0
    ? (complianceCompleted.length / complianceRequired.length) * 15 : 15;

  // Manager feedback (10%)
  const { data: feedbacks } = await supabase
    .from('feedback')
    .select('recommendation')
    .eq('employee_id', employeeId);
  const positiveFeedbacks = feedbacks?.filter(f => 
    f.recommendation === 'READY_FOR_DISCUSSION' || f.recommendation === 'CONTINUE_DEVELOPMENT'
  ).length || 0;
  const feedbackScore = feedbacks?.length > 0 ? Math.min((positiveFeedbacks / feedbacks.length) * 10, 10) : 0;

  // Evidence (10%)
  const evidenceFeedbacks = feedbacks?.filter(f => f.recommendation === 'READY_FOR_DISCUSSION').length || 0;
  const evidenceScore = evidenceFeedbacks > 0 ? 10 : 0;

  const totalScore = Math.round(trainingScore + skillScore + complianceScore + feedbackScore + evidenceScore);

  let status;
  if (totalScore >= 90) status = 'READY_FOR_DISCUSSION';
  else if (totalScore >= 75) status = 'ALMOST_READY';
  else if (totalScore >= 50) status = 'IN_PROGRESS';
  else status = 'NOT_READY';

  return {
    totalScore,
    status,
    breakdown: {
      trainingScore: Math.round(trainingScore),
      skillScore: Math.round(skillScore),
      complianceScore: Math.round(complianceScore),
      feedbackScore: Math.round(feedbackScore),
      evidenceScore: Math.round(evidenceScore)
    }
  };
}

// Helper: Auto-assign level trainings
async function assignLevelTrainings(employeeId, levelId, assignedBy) {
  const { data: levelTrainings } = await supabase
    .from('career_level_trainings')
    .select('*')
    .eq('career_level_id', levelId);

  if (!levelTrainings?.length) return;

  const assignments = levelTrainings.map(lt => ({
    employee_id: employeeId,
    training_id: lt.training_id,
    assigned_by: assignedBy,
    is_required: lt.is_required,
    due_date: lt.due_days_after_assignment 
      ? new Date(Date.now() + lt.due_days_after_assignment * 86400000).toISOString().split('T')[0] 
      : null
  }));

  // Only insert if not already assigned
  for (const assignment of assignments) {
    const { data: existing } = await supabase
      .from('employee_trainings')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('training_id', assignment.training_id)
      .in('status', ['NOT_STARTED', 'IN_PROGRESS'])
      .single();

    if (!existing) {
      await supabase.from('employee_trainings').insert(assignment);
    }
  }
}

module.exports = router;
