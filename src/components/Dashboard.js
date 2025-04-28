    import React, { useState, useEffect, useMemo } from 'react';
    import { 
      PieChart, LineChart, Pie, Line, XAxis, YAxis, CartesianGrid, 
      Tooltip, Legend, ResponsiveContainer, Cell 
    } from 'recharts';
    import { Search, Filter, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

    function Dashboard({ transactions, categories, activeView }) {
      const [filter, setFilter] = useState({
        category: 'All',
        searchTerm: '',
        dateRange: 'all',
        startDate: '',
        endDate: '',
        sort: { field: 'date', direction: 'desc' }
      });
      
      const [expandedTransaction, setExpandedTransaction] = useState(null);
      const [showFilters, setShowFilters] = useState(false);
      
      // Dashboard metrics
      const [metrics, setMetrics] = useState({
        totalSpent: 0,
        avgTransaction: 0,
        categoryBreakdown: [],
        monthlyTrend: []
      });
      
      // Colors for charts
      const CHART_COLORS = [
        '#2563EB', '#7C3AED', '#DB2777', '#F59E0B', '#10B981', 
        '#6366F1', '#14B8A6', '#F97316', '#8B5CF6', '#EC4899'
      ];
      
      // Calculate all metrics when transactions change
      useEffect(() => {
        if (!transactions || transactions.length === 0) return;
        
        // Calculate total spent
        const totalAmount = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        
        // Calculate average transaction
        const avgAmount = totalAmount / transactions.length;
        
        // Category breakdown
        const catBreakdown = categories.map(category => {
          const catTransactions = transactions.filter(tx => tx.category === category);
          const catAmount = catTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
          const percentage = catTransactions.length > 0 
            ? (catAmount / totalAmount * 100).toFixed(1) 
            : 0;
          
          return {
            name: category,
            value: catAmount,
            count: catTransactions.length,
            percentage: parseFloat(percentage)
          };
        });
        
        // Filter out categories with no transactions
        const filteredCatBreakdown = catBreakdown.filter(cat => cat.count > 0);
        
        // Monthly trends calculation
        const monthlyData = new Map();
        
        transactions.forEach(tx => {
          if (tx.date === 'Unknown') return;
          
          const txDate = new Date(tx.date);
          const yearMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData.has(yearMonth)) {
            monthlyData.set(yearMonth, { name: yearMonth, amount: 0, count: 0 });
          }
          
          const monthData = monthlyData.get(yearMonth);
          monthData.amount += parseFloat(tx.amount);
          monthData.count += 1;
        });
        
        // Convert to array and sort chronologically
        const monthlyTrend = Array.from(monthlyData.values())
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setMetrics({
          totalSpent: totalAmount,
          avgTransaction: avgAmount,
          categoryBreakdown: filteredCatBreakdown,
          monthlyTrend
        });
      }, [transactions, categories]);
      
      // Filter transactions based on current filter settings
      const filteredTransactions = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        
        return transactions.filter(tx => {
          // Category filter
          if (filter.category !== 'All' && tx.category !== filter.category) {
            return false;
          }
          
          // Search term filter
          if (filter.searchTerm && !tx.description.toLowerCase().includes(filter.searchTerm.toLowerCase())) {
            return false;
          }
          
          // Date range filter
          if (filter.dateRange !== 'all') {
            const txDate = tx.date === 'Unknown' ? null : new Date(tx.date);
            
            if (filter.dateRange === 'custom') {
              const startDate = filter.startDate ? new Date(filter.startDate) : null;
              const endDate = filter.endDate ? new Date(filter.endDate) : null;
              
              if (startDate && (!txDate || txDate < startDate)) return false;
              if (endDate) {
                // Add one day to end date to include transactions on that day
                const endDatePlusOne = new Date(endDate);
                endDatePlusOne.setDate(endDatePlusOne.getDate() + 1);
                if (!txDate || txDate > endDatePlusOne) return false;
              }
            } else if (filter.dateRange === 'month') {
              const now = new Date();
              const monthAgo = new Date();
              monthAgo.setMonth(now.getMonth() - 1);
              
              if (!txDate || txDate < monthAgo) return false;
            } else if (filter.dateRange === '3months') {
              const now = new Date();
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(now.getMonth() - 3);
              
              if (!txDate || txDate < threeMonthsAgo) return false;
            } else if (filter.dateRange === 'year') {
              const now = new Date();
              const yearAgo = new Date();
              yearAgo.setFullYear(now.getFullYear() - 1);
              
              if (!txDate || txDate < yearAgo) return false;
            }
          }
          
          return true;
        }).sort((a, b) => {
          const field = filter.sort.field;
          const direction = filter.sort.direction === 'asc' ? 1 : -1;
          
          if (field === 'date') {
            if (a.date === 'Unknown' && b.date === 'Unknown') return 0;
            if (a.date === 'Unknown') return 1;
            if (b.date === 'Unknown') return -1;
            return direction * (new Date(a.date) - new Date(b.date));
          }
          
          if (field === 'amount') {
            return direction * (parseFloat(a.amount) - parseFloat(b.amount));
          }
          
          // For any text field
          if (a[field] < b[field]) return -direction;
          if (a[field] > b[field]) return direction;
          return 0;
        });
      }, [transactions, filter]);
      
      // Handle filter changes
      const handleFilterChange = (field, value) => {
        setFilter(prev => ({ ...prev, [field]: value }));
      };
      
      // Sort handler
      const handleSort = (field) => {
        setFilter(prev => ({
          ...prev,
          sort: {
            field,
            direction: prev.sort.field === field && prev.sort.direction === 'desc' ? 'asc' : 'desc'
          }
        }));
      };
      
      // Handle transaction edit
      const handleEditTransaction = (transaction) => {
        // This will be implemented when the edit functionality is added
        console.log("Edit transaction:", transaction);
      };
      
      // Toggle transaction details
      const toggleTransactionDetails = (id) => {
        setExpandedTransaction(expandedTransaction === id ? null : id);
      };
      
      // Render sort indicator
      const renderSortIndicator = (field) => {
        if (filter.sort.field !== field) return null;
        
        return filter.sort.direction === 'asc' 
          ? <ChevronUp className="inline-block w-4 h-4" /> 
          : <ChevronDown className="inline-block w-4 h-4" />;
      };
      
      // Format currency
      // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    };
      
      // Format date
      const formatDate = (dateString) => {
        if (dateString === 'Unknown') return 'Unknown';
        
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      };
      
      if (!transactions || transactions.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 text-lg">No transaction data available.</p>
          </div>
        );
      }
      
      return (
        <div className="dashboard p-4">
          {/* Filters section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Transaction Dashboard</h2>
              <button 
                className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
            
            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filter.category}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Search filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2"
                        placeholder="Search transactions..."
                        value={filter.searchTerm}
                        onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                      />
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Date range filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <select 
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={filter.dateRange}
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    >
                      <option value="all">All Time</option>
                      <option value="month">Last Month</option>
                      <option value="3months">Last 3 Months</option>
                      <option value="year">Last Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  
                  {/* Custom date range inputs */}
                  {filter.dateRange === 'custom' && (
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={filter.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={filter.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Spent Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium">Total Spent</h3>
                <p className="text-3xl font-bold">{formatCurrency(metrics.totalSpent)}</p>
              </div>
              
              {/* Average Transaction Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium">Average Transaction</h3>
                <p className="text-3xl font-bold">{formatCurrency(metrics.avgTransaction)}</p>
              </div>
              
              {/* Transaction Count Card */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-gray-500 text-sm font-medium">Transaction Count</h3>
                <p className="text-3xl font-bold">{filteredTransactions.length}</p>
              </div>
              
              {/* Category Breakdown Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 col-span-1 md:col-span-2">
                <h3 className="text-lg font-medium mb-4">Spending by Category</h3>
                {metrics.categoryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {metrics.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">No category data available</p>
                )}
              </div>
              
              {/* Monthly Trend Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 col-span-1 md:col-span-full">
                <h3 className="text-lg font-medium mb-4">Monthly Spending Trend</h3>
                {metrics.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tickFormatter={(tick) => {
                          const [year, month] = tick.split('-');
                          return `${month}/${year.slice(2)}`;
                        }}
                      />
                      <YAxis tickFormatter={(tick) => formatCurrency(tick).replace('.00', '')} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#2563EB" 
                        strokeWidth={2} 
                        dot={{ r: 4 }} 
                        activeDot={{ r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-8">No trend data available</p>
                )}
              </div>
            </div>
          )}
          
          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date {renderSortIndicator('date')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center">
                      Description {renderSortIndicator('description')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Category {renderSortIndicator('category')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center">
                      Amount {renderSortIndicator('amount')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <React.Fragment key={transaction.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <button 
                            onClick={() => toggleTransactionDetails(transaction.id)}
                            className="mr-2 text-gray-400 hover:text-gray-600"
                          >
                            {expandedTransaction === transaction.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <span className="truncate max-w-xs">{transaction.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {transaction.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {expandedTransaction === transaction.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-3">
                          <div className="text-sm text-gray-600">
                            <p className="font-medium mb-1">Transaction Details</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p><span className="font-medium">Transaction ID:</span> {transaction.id}</p>
                                <p><span className="font-medium">Date:</span> {formatDate(transaction.date)}</p>
                                <p><span className="font-medium">Category:</span> {transaction.category}</p>
                              </div>
                              <div>
                                <p><span className="font-medium">Amount:</span> {formatCurrency(transaction.amount)}</p>
                                <p><span className="font-medium">Method:</span> {transaction.method || 'N/A'}</p>
                                <p><span className="font-medium">Status:</span> {transaction.status || 'Completed'}</p>
                              </div>
                              <div className="col-span-2">
                                <p><span className="font-medium">Description:</span> {transaction.description}</p>
                                {transaction.notes && (
                                  <p><span className="font-medium">Notes:</span> {transaction.notes}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No transactions found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    export default Dashboard;