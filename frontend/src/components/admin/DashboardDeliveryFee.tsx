import React, { useState, useEffect, useCallback } from 'react';
import { Truck, Plus, Trash2, Pencil, X, Check, RefreshCw } from 'lucide-react';
import { deliveryFeeApi, DeliveryFeeRecord } from '../../services/api';
import './DashboardDeliveryFee.css';

interface DashboardDeliveryFeeProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DashboardDeliveryFee: React.FC<DashboardDeliveryFeeProps> = ({ onShowToast }) => {
  const [districts, setDistricts] = useState<DeliveryFeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form
  const [addDistrict, setAddDistrict] = useState('');
  const [addFee, setAddFee] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addErrors, setAddErrors] = useState<{ district?: string; fee?: string }>({});

  // Edit inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFee, setEditFee] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDistricts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await deliveryFeeApi.list();
      setDistricts(data.items);
    } catch {
      setError('Failed to load delivery fees.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDistricts();
  }, [loadDistricts]);

  const validateAdd = (): boolean => {
    const errs: { district?: string; fee?: string } = {};
    if (!addDistrict.trim()) errs.district = 'District name is required.';
    const feeNum = parseFloat(addFee);
    if (!addFee.trim()) errs.fee = 'Fee is required.';
    else if (isNaN(feeNum) || feeNum < 0) errs.fee = 'Enter a valid fee (0 or more).';
    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = async () => {
    if (!validateAdd()) return;
    setIsAdding(true);
    try {
      const created = await deliveryFeeApi.create({
        district_name: addDistrict.trim(),
        fee: parseFloat(addFee),
      });
      setDistricts(prev => [...prev, created].sort((a, b) => a.district_name.localeCompare(b.district_name)));
      setAddDistrict('');
      setAddFee('');
      setAddErrors({});
      onShowToast(`District "${created.district_name}" added successfully.`, 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to add district.';
      onShowToast(msg, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const startEdit = (record: DeliveryFeeRecord) => {
    setEditingId(record.id);
    setEditFee(String(record.fee));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFee('');
  };

  const handleSaveEdit = async (id: string) => {
    const feeNum = parseFloat(editFee);
    if (isNaN(feeNum) || feeNum < 0) {
      onShowToast('Enter a valid fee (0 or more).', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const updated = await deliveryFeeApi.update(id, { fee: feeNum });
      setDistricts(prev => prev.map(d => d.id === id ? updated : d));
      setEditingId(null);
      onShowToast('Delivery fee updated.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update fee.';
      onShowToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deliveryFeeApi.delete(id);
      setDistricts(prev => prev.filter(d => d.id !== id));
      setDeletingId(null);
      onShowToast('District removed.', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to delete district.';
      onShowToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="df-container">
      <div className="df-header">
        <div className="df-header-left">
          <Truck size={22} />
          <div>
            <h2>Set Delivery Fees</h2>
            <p>Add districts and set individual delivery fees for customer checkout.</p>
          </div>
        </div>
        <button className="df-refresh-btn" onClick={loadDistricts} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>

      {/* Add District Form */}
      <div className="df-add-card">
        <h3>Add New District</h3>
        <div className="df-add-row">
          <div className="df-field">
            <label>District Name</label>
            <input
              type="text"
              value={addDistrict}
              onChange={e => { setAddDistrict(e.target.value); setAddErrors(prev => ({ ...prev, district: undefined })); }}
              placeholder="e.g. Colombo"
              className={addErrors.district ? 'df-input error' : 'df-input'}
            />
            {addErrors.district && <span className="df-error">{addErrors.district}</span>}
          </div>
          <div className="df-field">
            <label>Delivery Fee (Rs.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={addFee}
              onChange={e => { setAddFee(e.target.value); setAddErrors(prev => ({ ...prev, fee: undefined })); }}
              placeholder="e.g. 600"
              className={addErrors.fee ? 'df-input error' : 'df-input'}
            />
            {addErrors.fee && <span className="df-error">{addErrors.fee}</span>}
          </div>
          <button className="df-add-btn" onClick={handleAdd} disabled={isAdding}>
            {isAdding ? <RefreshCw size={16} className="spinning" /> : <Plus size={16} />}
            {isAdding ? 'Adding...' : 'Add District'}
          </button>
        </div>
      </div>

      {/* Districts Table */}
      <div className="df-table-card">
        <h3>
          Districts &amp; Fees
          <span className="df-count">{districts.length} district{districts.length !== 1 ? 's' : ''}</span>
        </h3>

        {isLoading ? (
          <div className="df-loading">
            <RefreshCw size={24} className="spinning" />
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="df-error-state">
            <p>{error}</p>
            <button onClick={loadDistricts}>Retry</button>
          </div>
        ) : districts.length === 0 ? (
          <div className="df-empty">
            <Truck size={40} />
            <p>No districts added yet.</p>
            <p>Add your first district above to enable delivery checkout.</p>
          </div>
        ) : (
          <table className="df-table">
            <thead>
              <tr>
                <th>#</th>
                <th>District</th>
                <th>Fee (Rs.)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {districts.map((record, idx) => (
                <tr key={record.id}>
                  <td className="df-idx">{idx + 1}</td>
                  <td className="df-district-name">{record.district_name}</td>
                  <td className="df-fee-cell">
                    {editingId === record.id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editFee}
                        onChange={e => setEditFee(e.target.value)}
                        className="df-inline-input"
                        autoFocus
                      />
                    ) : (
                      <span className="df-fee-value">Rs. {Number(record.fee).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="df-actions">
                    {editingId === record.id ? (
                      <>
                        <button
                          className="df-btn df-btn-save"
                          onClick={() => handleSaveEdit(record.id)}
                          disabled={isSaving}
                          title="Save"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          className="df-btn df-btn-cancel"
                          onClick={cancelEdit}
                          disabled={isSaving}
                          title="Cancel"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : deletingId === record.id ? (
                      <div className="df-confirm-delete">
                        <span>Delete?</span>
                        <button
                          className="df-btn df-btn-danger"
                          onClick={() => handleDelete(record.id)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? <RefreshCw size={14} className="spinning" /> : 'Yes'}
                        </button>
                        <button
                          className="df-btn df-btn-cancel"
                          onClick={() => setDeletingId(null)}
                          disabled={isDeleting}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="df-btn df-btn-edit"
                          onClick={() => startEdit(record)}
                          title="Edit fee"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="df-btn df-btn-delete"
                          onClick={() => setDeletingId(record.id)}
                          title="Delete district"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DashboardDeliveryFee;
