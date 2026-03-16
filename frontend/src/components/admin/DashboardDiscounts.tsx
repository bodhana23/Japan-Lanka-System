import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Search, X, RefreshCw, Percent, DollarSign } from 'lucide-react';
import { productsApi, Product } from '../../services/api';
import './DashboardDiscounts.css';

interface DashboardDiscountsProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface DiscountModal {
  product: Product;
  inputMode: 'percentage' | 'flat';
  inputValue: string;
}

const DashboardDiscounts: React.FC<DashboardDiscountsProps> = ({ onShowToast }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<DiscountModal | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productsApi.getProducts({ page_size: 100 });
      setProducts(response.items.filter(p => p.is_active));
    } catch {
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const openModal = (product: Product) => {
    setModal({
      product,
      inputMode: 'percentage',
      inputValue: product.discount_percentage ? String(Number(product.discount_percentage)) : '',
    });
  };

  const closeModal = () => setModal(null);

  const getPreviewPrice = (): number | null => {
    if (!modal) return null;
    const price = Number(modal.product.price);
    const val = parseFloat(modal.inputValue);
    if (isNaN(val) || val <= 0) return price;

    if (modal.inputMode === 'percentage') {
      if (val > 100) return null;
      return price * (1 - val / 100);
    } else {
      if (val >= price) return null;
      return price - val;
    }
  };

  const getPercentageToSave = (): number | null => {
    if (!modal) return null;
    const price = Number(modal.product.price);
    const val = parseFloat(modal.inputValue);
    if (isNaN(val) || val <= 0) return null;

    if (modal.inputMode === 'percentage') {
      if (val > 100) return null;
      return val;
    } else {
      if (val >= price) return null;
      return (val / price) * 100;
    }
  };

  const handleSave = async () => {
    if (!modal) return;
    const pct = getPercentageToSave();
    if (pct === null && modal.inputValue !== '') {
      onShowToast('Invalid discount value', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await productsApi.setDiscount(modal.product.id, pct);
      onShowToast(
        pct
          ? `Discount of ${pct.toFixed(1)}% applied to ${modal.product.name}`
          : `Discount cleared for ${modal.product.name}`,
        'success'
      );
      closeModal();
      fetchProducts();
    } catch {
      onShowToast('Failed to update discount', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearDiscount = async () => {
    if (!modal) return;
    setIsSaving(true);
    try {
      await productsApi.setDiscount(modal.product.id, null);
      onShowToast(`Discount cleared for ${modal.product.name}`, 'success');
      closeModal();
      fetchProducts();
    } catch {
      onShowToast('Failed to clear discount', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const previewPrice = modal ? getPreviewPrice() : null;

  return (
    <div className="admin-discounts-container">
      <div className="admin-discounts-header">
        <div className="admin-discounts-title-section">
          <h2 className="admin-discounts-title">
            <Tag size={24} className="admin-discounts-icon" />
            Product Discounts
          </h2>
          <p className="admin-discounts-subtitle">Apply percentage or flat-amount discounts to products</p>
        </div>
        <button className="admin-discounts-refresh-btn" onClick={fetchProducts} disabled={isLoading}>
          <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      <div className="admin-discounts-search-row">
        <div className="admin-discounts-search-wrapper">
          <Search size={16} className="admin-discounts-search-icon" />
          <input
            type="text"
            className="admin-discounts-search"
            placeholder="Search by product name, brand, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="admin-discounts-clear-search" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="admin-discounts-error">
          {error}
          <button onClick={fetchProducts}>Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="admin-discounts-loading">
          <div className="admin-spinner" />
          <span>Loading products...</span>
        </div>
      ) : (
        <div className="admin-discounts-table-wrapper">
          <table className="admin-discounts-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Original Price</th>
                <th>Discount</th>
                <th>Effective Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-discounts-empty">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const discountPct = product.discount_percentage ? Number(product.discount_percentage) : 0;
                  const originalPrice = Number(product.price);
                  const effectivePrice = product.effective_price ? Number(product.effective_price) : originalPrice;

                  return (
                    <tr key={product.id} className={discountPct > 0 ? 'has-discount' : ''}>
                      <td className="admin-discounts-product-cell">
                        <span className="admin-discounts-product-name">{product.name}</span>
                        <span className="admin-discounts-product-brand">{product.brand}</span>
                      </td>
                      <td>
                        <span className="admin-discounts-category-badge">{product.category}</span>
                      </td>
                      <td className="admin-discounts-price">
                        Rs {originalPrice.toLocaleString()}
                      </td>
                      <td>
                        {discountPct > 0 ? (
                          <span className="admin-discounts-pct-badge">{discountPct.toFixed(1)}%</span>
                        ) : (
                          <span className="admin-discounts-no-discount">—</span>
                        )}
                      </td>
                      <td className="admin-discounts-effective-price">
                        {discountPct > 0 ? (
                          <span className="admin-discounts-effective">Rs {effectivePrice.toLocaleString()}</span>
                        ) : (
                          <span className="admin-discounts-same">Rs {originalPrice.toLocaleString()}</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="admin-discounts-edit-btn"
                          onClick={() => openModal(product)}
                        >
                          <Tag size={14} />
                          {discountPct > 0 ? 'Edit' : 'Set Discount'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Discount Modal */}
      {modal && (
        <div className="admin-discounts-modal-overlay" onClick={closeModal}>
          <div className="admin-discounts-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-discounts-modal-header">
              <h3>
                <Tag size={20} />
                Set Discount
              </h3>
              <button className="admin-discounts-modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="admin-discounts-modal-body">
              <div className="admin-discounts-product-info-card">
                <p className="admin-discounts-modal-product-name">{modal.product.name}</p>
                <p className="admin-discounts-modal-product-brand">{modal.product.brand} · {modal.product.category}</p>
                <p className="admin-discounts-modal-product-price">
                  Original Price: <strong>Rs {Number(modal.product.price).toLocaleString()}</strong>
                </p>
              </div>

              <div className="admin-discounts-mode-toggle">
                <button
                  className={`admin-discounts-mode-btn ${modal.inputMode === 'percentage' ? 'active' : ''}`}
                  onClick={() => setModal({ ...modal, inputMode: 'percentage', inputValue: '' })}
                >
                  <Percent size={16} />
                  Percentage
                </button>
                <button
                  className={`admin-discounts-mode-btn ${modal.inputMode === 'flat' ? 'active' : ''}`}
                  onClick={() => setModal({ ...modal, inputMode: 'flat', inputValue: '' })}
                >
                  <DollarSign size={16} />
                  Flat Amount
                </button>
              </div>

              <div className="admin-discounts-input-group">
                <label>
                  {modal.inputMode === 'percentage' ? 'Discount Percentage (0–100)' : 'Discount Amount (Rs)'}
                </label>
                <div className="admin-discounts-input-wrapper">
                  <span className="admin-discounts-input-prefix">
                    {modal.inputMode === 'percentage' ? '%' : 'Rs'}
                  </span>
                  <input
                    type="number"
                    className="admin-discounts-input"
                    placeholder={modal.inputMode === 'percentage' ? '0–100' : '0'}
                    min="0"
                    max={modal.inputMode === 'percentage' ? '100' : undefined}
                    value={modal.inputValue}
                    onChange={e => setModal({ ...modal, inputValue: e.target.value })}
                  />
                </div>
              </div>

              {modal.inputValue && (
                <div className={`admin-discounts-preview ${previewPrice === null ? 'invalid' : ''}`}>
                  {previewPrice === null ? (
                    <span className="admin-discounts-preview-error">Invalid value</span>
                  ) : (
                    <>
                      <span>Effective price:</span>
                      <strong>Rs {previewPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      {getPercentageToSave() !== null && (
                        <span className="admin-discounts-preview-pct">
                          ({getPercentageToSave()!.toFixed(2)}% off)
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="admin-discounts-modal-footer">
              {Number(modal.product.discount_percentage) > 0 && (
                <button
                  className="admin-discounts-clear-btn"
                  onClick={handleClearDiscount}
                  disabled={isSaving}
                >
                  Clear Discount
                </button>
              )}
              <div className="admin-discounts-modal-footer-right">
                <button className="admin-discounts-cancel-btn" onClick={closeModal} disabled={isSaving}>
                  Cancel
                </button>
                <button
                  className="admin-discounts-save-btn"
                  onClick={handleSave}
                  disabled={isSaving || (modal.inputValue !== '' && previewPrice === null)}
                >
                  {isSaving ? 'Saving...' : 'Save Discount'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDiscounts;
