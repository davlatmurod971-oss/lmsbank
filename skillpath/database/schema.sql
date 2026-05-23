-- ============================================
-- SKILLPATH BANK LMS - SUPABASE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('HR_MANAGER', 'BRANCH_MANAGER', 'EMPLOYEE', 'ADMIN');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE');
CREATE TYPE employment_status AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');
CREATE TYPE training_content_type AS ENUM ('VIDEO', 'DOCUMENT', 'QUIZ', 'TASK', 'COURSE', 'SIMULATION', 'MANAGER_REVIEW');
CREATE TYPE training_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED');
CREATE TYPE skill_source AS ENUM ('SELF_ASSESSMENT', 'MANAGER_REVIEW', 'ASSESSMENT', 'SYSTEM_CALCULATED');
CREATE TYPE feedback_recommendation AS ENUM ('CONTINUE_DEVELOPMENT', 'READY_FOR_DISCUSSION', 'NEEDS_MORE_EVIDENCE', 'NOT_READY');
CREATE TYPE promotion_status AS ENUM ('DRAFT', 'READY_FOR_DISCUSSION', 'APPROVED', 'NOT_READY', 'REVIEW_LATER');
CREATE TYPE promotion_item_type AS ENUM ('TRAINING', 'SKILL', 'FEEDBACK', 'ASSESSMENT', 'COMPLIANCE', 'PROJECT_EVIDENCE');
CREATE TYPE promotion_item_status AS ENUM ('PENDING', 'COMPLETED', 'MISSING');
CREATE TYPE general_status AS ENUM ('ACTIVE', 'ARCHIVED', 'INACTIVE');
CREATE TYPE notification_type AS ENUM ('TRAINING_ASSIGNED', 'TRAINING_DEADLINE', 'TRAINING_OVERDUE', 'FEEDBACK_REQUESTED', 'PROMOTION_PACKET_READY', 'HR_DECISION_UPDATED', 'SYSTEM');

-- ============================================
-- CORE TABLES
-- ============================================

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'EMPLOYEE',
  status user_status NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BRANCHES
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  branch_name VARCHAR(200) NOT NULL,
  branch_code VARCHAR(50) UNIQUE NOT NULL,
  city VARCHAR(100),
  address TEXT,
  manager_id UUID,
  status general_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DEPARTMENTS
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_name VARCHAR(200) NOT NULL,
  description TEXT,
  status general_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CAREER TRACKS
CREATE TABLE career_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_name VARCHAR(200) NOT NULL,
  department_id UUID REFERENCES departments(id),
  description TEXT,
  status general_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CAREER LEVELS
CREATE TABLE career_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_track_id UUID NOT NULL REFERENCES career_tracks(id),
  level_name VARCHAR(200) NOT NULL,
  level_order INT NOT NULL,
  description TEXT,
  promotion_criteria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(career_track_id, level_order)
);

-- EMPLOYEES
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id),
  employee_code VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  branch_id UUID REFERENCES branches(id),
  department_id UUID REFERENCES departments(id),
  employee_role VARCHAR(200),
  current_level_id UUID REFERENCES career_levels(id),
  career_track_id UUID REFERENCES career_tracks(id),
  manager_id UUID REFERENCES employees(id),
  hire_date DATE,
  employment_status employment_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK for branch manager after employees table
ALTER TABLE branches ADD CONSTRAINT branches_manager_fk FOREIGN KEY (manager_id) REFERENCES employees(id);

-- SKILLS
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  status general_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CAREER LEVEL SKILLS (required skills per level)
CREATE TABLE career_level_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_level_id UUID NOT NULL REFERENCES career_levels(id),
  skill_id UUID NOT NULL REFERENCES skills(id),
  required_score INT NOT NULL CHECK (required_score BETWEEN 0 AND 100),
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(career_level_id, skill_id)
);

-- TRAININGS
CREATE TABLE trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_name VARCHAR(300) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  content_type training_content_type NOT NULL DEFAULT 'COURSE',
  duration_minutes INT,
  is_compliance_required BOOLEAN NOT NULL DEFAULT FALSE,
  status general_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CAREER LEVEL TRAININGS (required trainings per level)
CREATE TABLE career_level_trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_level_id UUID NOT NULL REFERENCES career_levels(id),
  training_id UUID NOT NULL REFERENCES trainings(id),
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  due_days_after_assignment INT DEFAULT 30,
  UNIQUE(career_level_id, training_id)
);

-- EMPLOYEE TRAININGS
CREATE TABLE employee_trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  training_id UUID NOT NULL REFERENCES trainings(id),
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date DATE,
  status training_status NOT NULL DEFAULT 'NOT_STARTED',
  progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EMPLOYEE SKILLS
CREATE TABLE employee_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  skill_id UUID NOT NULL REFERENCES skills(id),
  current_score INT NOT NULL DEFAULT 0 CHECK (current_score BETWEEN 0 AND 100),
  source skill_source NOT NULL DEFAULT 'SELF_ASSESSMENT',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, skill_id)
);

-- ASSESSMENTS
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  description TEXT,
  training_id UUID REFERENCES trainings(id),
  career_level_id UUID REFERENCES career_levels(id),
  passing_score INT NOT NULL DEFAULT 70,
  status general_status NOT NULL DEFAULT 'ACTIVE',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ASSESSMENT RESULTS
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FEEDBACK
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  manager_id UUID NOT NULL REFERENCES employees(id),
  skill_id UUID REFERENCES skills(id),
  feedback_text TEXT NOT NULL,
  evidence_text TEXT,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  recommendation feedback_recommendation,
  visibility VARCHAR(50) DEFAULT 'MANAGER_HR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROMOTION PACKETS
CREATE TABLE promotion_packets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  current_level_id UUID NOT NULL REFERENCES career_levels(id),
  target_level_id UUID NOT NULL REFERENCES career_levels(id),
  created_by UUID REFERENCES users(id),
  status promotion_status NOT NULL DEFAULT 'DRAFT',
  readiness_score DECIMAL(5,2),
  manager_recommendation TEXT,
  hr_decision TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PROMOTION PACKET ITEMS
CREATE TABLE promotion_packet_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_packet_id UUID NOT NULL REFERENCES promotion_packets(id),
  item_type promotion_item_type NOT NULL,
  item_title VARCHAR(300) NOT NULL,
  item_status promotion_item_status NOT NULL DEFAULT 'PENDING',
  evidence TEXT,
  source_reference UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(300) NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'SYSTEM',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_employees_branch ON employees(branch_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_employees_career_track ON employees(career_track_id);
CREATE INDEX idx_employee_trainings_employee ON employee_trainings(employee_id);
CREATE INDEX idx_employee_trainings_status ON employee_trainings(status);
CREATE INDEX idx_employee_skills_employee ON employee_skills(employee_id);
CREATE INDEX idx_feedback_employee ON feedback(employee_id);
CREATE INDEX idx_feedback_manager ON feedback(manager_id);
CREATE INDEX idx_promotion_packets_employee ON promotion_packets(employee_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_career_tracks_updated_at BEFORE UPDATE ON career_tracks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_career_levels_updated_at BEFORE UPDATE ON career_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trainings_updated_at BEFORE UPDATE ON trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_trainings_updated_at BEFORE UPDATE ON employee_trainings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotion_packets_updated_at BEFORE UPDATE ON promotion_packets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Default HR admin user (password: Admin@12345)
INSERT INTO users (full_name, email, password_hash, role) VALUES
('HR Administrator', 'hr@skillpathbank.uz', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TipxB.7980fBD07F0M3B.mXG0KuS', 'HR_MANAGER');

-- Departments
INSERT INTO departments (department_name, description) VALUES
('Retail Banking', 'Chakana bank xizmatlari'),
('Credit Department', 'Kredit bo''limi'),
('Customer Service', 'Mijozlarga xizmat ko''rsatish'),
('Risk Department', 'Risklar bo''limi'),
('Operations', 'Operatsiyalar bo''limi'),
('HR', 'Kadrlar bo''limi');

-- Skills
INSERT INTO skills (skill_name, category, description) VALUES
('KYC Procedures', 'Compliance', 'Mijozni aniqlash tartib-qoidalari'),
('AML Awareness', 'Compliance', 'Pul yuvishga qarshi choralar'),
('Cash Handling', 'Operations', 'Naqd pullar bilan ishlash'),
('Customer Service', 'Soft Skills', 'Mijozlarga xizmat ko''rsatish'),
('Fraud Awareness', 'Security', 'Firibgarlikni aniqlash'),
('Data Protection', 'Compliance', 'Ma''lumotlarni himoya qilish'),
('Credit Risk', 'Finance', 'Kredit risklarini baholash'),
('Branch Operations', 'Operations', 'Filial operatsiyalari');
