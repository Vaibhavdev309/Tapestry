import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Inventory = () => {
  const [inventory, setInventory] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stockUpdate, setStockUpdate] = useState({
    size: "",
    quantity: 0,
    type: "adjustment",
    reason: ""
  });
  const [bulkUpdates, setBulkUpdates] = useState([]);

  const backendUrl = "http://localhost:4000";
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [overviewRes, productsRes] = await Promise.all([
        axios.get(`${backendUrl}/api/inventory/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${backendUrl}/api/product/list`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (overviewRes.data.success) {
        setInventory(overviewRes.data.overview);
      }

      if (productsRes.data.success) {
        setProducts(productsRes.data.products);
      }
    } catch (error) {
      console.error("Error fetching inventory data:", error);
      toast.error("Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async () => {
    try {
      if (!selectedProduct || !stockUpdate.size || stockUpdate.quantity < 0) {
        toast.error("Please fill all required fields");
        return;
      }

      const response = await axios.put(
        `${backendUrl}/api/inventory/product/${selectedProduct._id}/stock`,
        stockUpdate,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Stock updated successfully");
        setShowStockModal(false);
        setStockUpdate({ size: "", quantity: 0, type: "adjustment", reason: "" });
        fetchInventoryData();
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error(error.response?.data?.message || "Failed to update stock");
    }
  };

  const handleBulkUpdate = async () => {
    try {
      if (bulkUpdates.length === 0) {
        toast.error("Please add at least one update");
        return;
      }

      const response = await axios.put(
        `${backendUrl}/api/inventory/bulk-update`,
        { updates: bulkUpdates },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Bulk update completed: ${response.data.results.length} successful`);
        setShowBulkModal(false);
        setBulkUpdates([]);
        fetchInventoryData();
      }
    } catch (error) {
      console.error("Error bulk updating stock:", error);
      toast.error("Failed to perform bulk update");
    }
  };

  const addBulkUpdate = () => {
    setBulkUpdates([...bulkUpdates, {
      productId: "",
      size: "",
      quantity: 0,
      type: "adjustment",
      reason: ""
    }]);
  };

  const removeBulkUpdate = (index) => {
    setBulkUpdates(bulkUpdates.filter((_, i) => i !== index));
  };

  const updateBulkUpdate = (index, field, value) => {
    const updated = [...bulkUpdates];
    updated[index][field] = value;
    setBulkUpdates(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading inventory data...</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Bulk Update
          </button>
          <button
            onClick={fetchInventoryData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Inventory Overview */}
      {inventory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Products</h3>
            <p className="text-2xl font-bold text-blue-600">{inventory.summary.totalProducts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Stock</h3>
            <p className="text-2xl font-bold text-green-600">{inventory.summary.totalStock}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Low Stock</h3>
            <p className="text-2xl font-bold text-yellow-600">{inventory.summary.lowStockCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Out of Stock</h3>
            <p className="text-2xl font-bold text-red-600">{inventory.summary.outOfStockCount}</p>
          </div>
        </div>
      )}

      {/* Low Stock Alerts */}
      {inventory && inventory.lowStockDetails.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Low Stock Alerts</h3>
          <div className="space-y-2">
            {inventory.lowStockDetails.map((product, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-yellow-700">
                  {product.name} ({product.sku})
                </span>
                <span className="text-yellow-600">
                  {product.lowStockSizes.map(size => `${size.size}: ${size.quantity}`).join(", ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-lg object-cover"
                        src={product.image[0]}
                        alt={product.name}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">₹{product.price}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.inventory?.totalStock || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.inventory?.availableStock || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.inventory?.reservedStock || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.inventory?.outOfStock 
                        ? 'bg-red-100 text-red-800'
                        : product.inventory?.lowStockAlert
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {product.inventory?.outOfStock 
                        ? 'Out of Stock'
                        : product.inventory?.lowStockAlert
                        ? 'Low Stock'
                        : 'In Stock'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowStockModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Update Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Update Stock - {selectedProduct.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Size</label>
                <select
                  value={stockUpdate.size}
                  onChange={(e) => setStockUpdate({...stockUpdate, size: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select Size</option>
                  {selectedProduct.sizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Update Type</label>
                <select
                  value={stockUpdate.type}
                  onChange={(e) => setStockUpdate({...stockUpdate, type: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="adjustment">Set Quantity</option>
                  <option value="in">Add Stock</option>
                  <option value="out">Remove Stock</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  value={stockUpdate.quantity}
                  onChange={(e) => setStockUpdate({...stockUpdate, quantity: parseInt(e.target.value) || 0})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  value={stockUpdate.reason}
                  onChange={(e) => setStockUpdate({...stockUpdate, reason: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Reason for stock update"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowStockModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStockUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Bulk Stock Update</h3>
            
            <div className="space-y-4">
              {bulkUpdates.map((update, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Update {index + 1}</h4>
                    <button
                      onClick={() => removeBulkUpdate(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product</label>
                      <select
                        value={update.productId}
                        onChange={(e) => updateBulkUpdate(index, 'productId', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select Product</option>
                        {products.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Size</label>
                      <input
                        type="text"
                        value={update.size}
                        onChange={(e) => updateBulkUpdate(index, 'size', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Size"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        value={update.type}
                        onChange={(e) => updateBulkUpdate(index, 'type', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="adjustment">Set Quantity</option>
                        <option value="in">Add Stock</option>
                        <option value="out">Remove Stock</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity</label>
                      <input
                        type="number"
                        value={update.quantity}
                        onChange={(e) => updateBulkUpdate(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <input
                        type="text"
                        value={update.reason}
                        onChange={(e) => updateBulkUpdate(index, 'reason', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Reason"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={addBulkUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Update
              </button>
              
              <div className="space-x-2">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply Updates
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;