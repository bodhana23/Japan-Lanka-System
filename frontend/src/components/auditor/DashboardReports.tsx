import React, { useState } from 'react';
import {
  Download, FileSpreadsheet, BarChart2, Calendar,
  Package, TrendingUp
} from 'lucide-react';
import { auditorApi } from '../../services/api';
import './DashboardReports.css';

const DashboardReports: React.FC = () => {
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  const handleDownloadMonthlyReport = async () => {
    if (monthlyLoading) return;
    setMonthlyLoading(true);
    try {
      await auditorApi.downloadMonthlyTransactions();
    } catch (error) {
      console.error('Failed to download monthly transaction report:', error);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const handleDownloadInventoryReport = async () => {
    if (inventoryLoading) return;
    setInventoryLoading(true);
    try {
      await auditorApi.downloadInventoryAudit();
    } catch (error) {
      console.error('Failed to download inventory audit report:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  return (
    <div className="reports-section">
      <div className="section-header">
        <h2>Download Reports</h2>
        <p className="section-description">
          Export comprehensive reports for auditing and analysis purposes
        </p>
      </div>

      <div className="reports-grid">
        {/* Monthly Transaction Report */}
        <div className="report-card">
          <div className="report-icon monthly">
            <Calendar size={32} />
          </div>
          <div className="report-content">
            <h3>Monthly Transaction Report</h3>
            <p>
              Complete monthly summary of all transactions including orders, returns,
              and inventory movements. Ideal for monthly auditing.
            </p>
            <ul className="report-includes">
              <li><Package size={14} /> Order summaries</li>
              <li><TrendingUp size={14} /> Revenue analytics</li>
              <li><BarChart2 size={14} /> Transaction trends</li>
            </ul>
          </div>
          <button
            className="download-btn"
            onClick={handleDownloadMonthlyReport}
            disabled={monthlyLoading}
          >
            <Download size={18} />
            <span>{monthlyLoading ? 'Downloading...' : 'Download Excel'}</span>
          </button>
        </div>

        {/* Inventory Audit Report */}
        <div className="report-card">
          <div className="report-icon inventory">
            <Package size={32} />
          </div>
          <div className="report-content">
            <h3>Inventory Audit Report</h3>
            <p>
              Detailed inventory report showing stock levels, movements, adjustments,
              and valuation data for all products.
            </p>
            <ul className="report-includes">
              <li><Package size={14} /> Current stock levels</li>
              <li><TrendingUp size={14} /> Stock movements</li>
              <li><BarChart2 size={14} /> Inventory valuation</li>
            </ul>
          </div>
          <button
            className="download-btn"
            onClick={handleDownloadInventoryReport}
            disabled={inventoryLoading}
          >
            <Download size={18} />
            <span>{inventoryLoading ? 'Downloading...' : 'Download Excel'}</span>
          </button>
        </div>
      </div>

      <div className="reports-note">
        <FileSpreadsheet size={20} />
        <p>
          All reports are exported in Excel (.xlsx) format for easy analysis.
          Reports include data based on your current filter selections and permissions.
        </p>
      </div>
    </div>
  );
};

export default DashboardReports;
