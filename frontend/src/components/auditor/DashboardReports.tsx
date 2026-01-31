import React from 'react';
import {
  Download, FileSpreadsheet, BarChart2, Calendar,
  Package, DollarSign, TrendingUp
} from 'lucide-react';
import './DashboardReports.css';

const DashboardReports: React.FC = () => {
  const handleDownloadMonthlyReport = () => {
    alert('Monthly transaction report download will be implemented with backend integration');
    console.log('Download monthly transaction report as Excel - Backend integration pending');
  };

  const handleDownloadInventoryReport = () => {
    alert('Inventory report download will be implemented with backend integration');
    console.log('Download inventory report as Excel - Backend integration pending');
  };

  const handleDownloadFinancialReport = () => {
    alert('Financial report download will be implemented with backend integration');
    console.log('Download financial report as Excel - Backend integration pending');
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
          <button className="download-btn" onClick={handleDownloadMonthlyReport}>
            <Download size={18} />
            <span>Download Excel</span>
          </button>
        </div>

        {/* Inventory Report */}
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
              <li><DollarSign size={14} /> Inventory valuation</li>
            </ul>
          </div>
          <button className="download-btn" onClick={handleDownloadInventoryReport}>
            <Download size={18} />
            <span>Download Excel</span>
          </button>
        </div>

        {/* Financial Report */}
        <div className="report-card">
          <div className="report-icon financial">
            <DollarSign size={32} />
          </div>
          <div className="report-content">
            <h3>Financial Statistics Report</h3>
            <p>
              Comprehensive financial report with sales data, revenue analytics,
              order statistics, and profitability metrics.
            </p>
            <ul className="report-includes">
              <li><DollarSign size={14} /> Revenue breakdown</li>
              <li><BarChart2 size={14} /> Sales analytics</li>
              <li><TrendingUp size={14} /> Growth metrics</li>
            </ul>
          </div>
          <button className="download-btn" onClick={handleDownloadFinancialReport}>
            <Download size={18} />
            <span>Download Excel</span>
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
