import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesAPI, branchesAPI, departmentsAPI, careerTracksAPI } from '../../utils/api';
import { Search, Plus, Filter, ChevronRight, UserCheck, UserX } from 'lucide-react';
import AddEmployeeModal from '../../components/modals/AddEmployeeModal';

export default function HREmployees() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({});
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filters, setFilters] = useState({ search: '', branch_id: '', department_id: '', status: '' });
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await employeesAPI.getAll(params);
      setEmployees(res.data.employees);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    Promise.all([branchesAPI.getAll(), departmentsAPI.getAll()]).then(([b, d]) => {
      setBranches(b.data.branches);
      setDepartments(d.data.departments);
    }).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    setFilters(p => ({ ...p, search: e.target.value }));
    setPage(1);
  };

  const handleFilter = (key, val) => {
    setFilters(p => ({ ...p, [key]: val }));
    setPage(1);
  };

  const statusBadge = (status) => {
    const map = {
      ACTIVE: { label: 'Faol', cls: 'badge-green' },
      INACTIVE: { label: 'Nofaol', cls: 'badge-gray' },
      ON_LEAVE: { label: 'Ta\'tilda', cls: 'badge-yellow' },
      TERMINATED: { label: 'Ishdan bo\'shagan', cls: 'badge-red' }
    };
    const s = map[status] || { label: status, cls: 'badge-gray' };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontSize: 20, fontWeight: 700 }}>Xodimlar</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>
            Jami {pagination.total || 0} ta xodim
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Yangi xodim
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              placeholder="Ism yoki kod bo'yicha qidirish..."
              value={filters.search}
              onChange={handleSearch}
            />
          </div>
          <select className="form-input" style={{ width: 160 }} value={filters.branch_id} onChange={e => handleFilter('branch_id', e.target.value)}>
            <option value="">Barcha filiallar</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
          </select>
          <select className="form-input" style={{ width: 160 }} value={filters.department_id} onChange={e => handleFilter('department_id', e.target.value)}>
            <option value="">Barcha bo'limlar</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
          </select>
          <select className="form-input" style={{ width: 140 }} value={filters.status} onChange={e => handleFilter('status', e.target.value)}>
            <option value="">Barcha holat</option>
            <option value="ACTIVE">Faol</option>
            <option value="INACTIVE">Nofaol</option>
            <option value="ON_LEAVE">Ta'tilda</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Xodim</th>
                <th>Kod</th>
                <th>Filial</th>
                <th>Bo'lim</th>
                <th>Career Track</th>
                <th>Daraja</th>
                <th>Holati</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div className="empty-state-title">Xodimlar topilmadi</div>
                    <div className="empty-state-desc">Filtrlni o'zgartiring yoki yangi xodim qo'shing</div>
                  </div>
                </td></tr>
              ) : employees.map(emp => (
                <tr key={emp.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/hr/employees/${emp.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{emp.full_name?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.full_name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          {emp.employee_role || 'Lavozim belgilanmagan'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12.5, background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4 }}>{emp.employee_code}</span></td>
                  <td style={{ fontSize: 13 }}>{emp.branch?.branch_name || '—'}</td>
                  <td style={{ fontSize: 13 }}>{emp.department?.department_name || '—'}</td>
                  <td style={{ fontSize: 13 }}>{emp.career_track?.track_name || <span style={{ color: 'var(--text-tertiary)' }}>Belgilanmagan</span>}</td>
                  <td style={{ fontSize: 13 }}>{emp.current_level?.level_name || '—'}</td>
                  <td>{statusBadge(emp.employment_status)}</td>
                  <td><ChevronRight size={16} color="var(--text-tertiary)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {pagination.total} ta ichidan {(page - 1) * 15 + 1}–{Math.min(page * 15, pagination.total)} ko'rsatilmoqda
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Oldingi</button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button className="btn btn-secondary btn-sm" disabled={page === pagination.pages} onClick={() => setPage(p => p + 1)}>Keyingi</button>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onSuccess={() => { setShowAdd(false); loadData(); }} branches={branches} departments={departments} />}
    </div>
  );
}
