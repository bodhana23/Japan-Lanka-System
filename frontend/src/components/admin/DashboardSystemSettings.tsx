import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Truck, Save, RefreshCw, Info } from 'lucide-react';
import { systemSettingsApi, DeliveryFeeTier } from '../../services/api';
import './DashboardSystemSettings.css';

interface DashboardSystemSettingsProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DashboardSystemSettings: React.FC<DashboardSystemSettingsProps> = ({ onShowToast }) => {
  const [tiers, setTiers] = useState<DeliveryFeeTier[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savingTier, setSavingTier] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveryFees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await systemSettingsApi.getDeliveryFees();
      setTiers(response.tiers);
      const vals: Record<string, string> = {};
      response.tiers.forEach(t => { vals[t.tier] = String(t.fee); });
      setEditValues(vals);
    } catch {
      setError('Failed to load delivery fee settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveryFees();
  }, [fetchDeliveryFees]);

  const handleSaveTier = async (tier: string) => {
    const feeStr = editValues[tier] ?? '';
    const fee = parseInt(feeStr, 10);
    if (isNaN(fee) || fee < 0) {
      onShowToast('Please enter a valid fee amount (0 or higher)', 'error');
      return;
    }
    setSavingTier(tier);
    try {
      await systemSettingsApi.updateDeliveryFee(tier, fee);
      onShowToast(`Delivery fee for ${tier.replace('tier', 'Tier ')} updated to Rs ${fee.toLocaleString()}`, 'success');
      fetchDeliveryFees();
    } catch {
      onShowToast('Failed to update delivery fee', 'error');
    } finally {
      setSavingTier(null);
    }
  };

  const tierLabel = (tier: string) => tier.replace('tier', 'Tier ');

  return (
    <div className="admin-sysset-container">
      <div className="admin-sysset-header">
        <div className="admin-sysset-title-section">
          <h2 className="admin-sysset-title">
            <Settings size={24} className="admin-sysset-icon" />
            System Settings
          </h2>
          <p className="admin-sysset-subtitle">Configure system-wide settings for Japan Lanka Enterprises</p>
        </div>
        <button className="admin-sysset-refresh-btn" onClick={fetchDeliveryFees} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Delivery Fees Section */}
      <div className="admin-sysset-section-card">
        <div className="admin-sysset-section-header">
          <Truck size={20} className="admin-sysset-section-icon" />
          <div>
            <h3 className="admin-sysset-section-title">Delivery Fee Configuration</h3>
            <p className="admin-sysset-section-desc">
              Fees are tiered by distance from Matara (origin/dispatch point). Changes take effect immediately for new orders.
            </p>
          </div>
        </div>

        <div className="admin-sysset-info-banner">
          <Info size={16} />
          <span>
            Sri Lanka is divided into 6 delivery zones. Tier 1 (Matara) is the lowest fee; Tier 6 (far north) is the highest.
            All fees are in Sri Lankan Rupees (LKR).
          </span>
        </div>

        {error && (
          <div className="admin-sysset-error">
            {error}
            <button onClick={fetchDeliveryFees}>Retry</button>
          </div>
        )}

        {isLoading ? (
          <div className="admin-sysset-loading">
            <div className="admin-spinner" />
            <span>Loading delivery fee settings...</span>
          </div>
        ) : (
          <div className="admin-sysset-tiers">
            {tiers.map((tier, idx) => (
              <div key={tier.tier} className="admin-sysset-tier-card">
                <div className="admin-sysset-tier-badge">
                  {tierLabel(tier.tier)}
                </div>
                <div className="admin-sysset-tier-info">
                  <p className="admin-sysset-tier-districts">
                    <strong>Districts:</strong> {tier.districts}
                  </p>
                </div>
                <div className="admin-sysset-tier-fee-row">
                  <div className="admin-sysset-fee-input-wrapper">
                    <span className="admin-sysset-fee-prefix">Rs</span>
                    <input
                      type="number"
                      className="admin-sysset-fee-input"
                      min="0"
                      step="100"
                      value={editValues[tier.tier] ?? ''}
                      onChange={e => setEditValues(prev => ({ ...prev, [tier.tier]: e.target.value }))}
                      disabled={savingTier === tier.tier}
                    />
                  </div>
                  <button
                    className="admin-sysset-save-tier-btn"
                    onClick={() => handleSaveTier(tier.tier)}
                    disabled={savingTier === tier.tier || editValues[tier.tier] === String(tier.fee)}
                  >
                    {savingTier === tier.tier ? (
                      <>
                        <div className="admin-sysset-btn-spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSystemSettings;
