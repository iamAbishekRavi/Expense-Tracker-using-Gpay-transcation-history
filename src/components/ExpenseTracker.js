import { useState, useRef } from 'react';
import { FileUp, FileText, Settings, X, Clipboard, CheckCircle, AlertCircle } from 'lucide-react';

function ExpenseTracker({ onTransactionsProcessed }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    minAmount: 1000,
    keywords: 'paid,sent',
    includeMetadata: true,
    defaultCategories: 'Shopping,Food,Transportation,Bills,Entertainment,Health,Education,Other'
  });
  const fileInputRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileChange = (file) => {
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      showNotification('Please upload an HTML file (.html or .htm)', 'error');
      return;
    }
    
    setFileName(file.name.replace(/\.(html|htm)$/i, ''));
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setHtmlContent(e.target.result);
      setFile(file);
      showNotification('Google Pay Activity file loaded successfully!', 'success');
    };
    reader.onerror = () => {
      showNotification('Error reading the file', 'error');
    };
    reader.readAsText(file);
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    if (type !== 'loading') {
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Function to automatically categorize transactions based on keywords
  const categorizeTransaction = (description) => {
    const lowerDesc = description.toLowerCase();
    
    if (/shop|mart|store|buy|purchase|amzn|amazon|flipkart|myntra/i.test(lowerDesc)) {
      return "Shopping";
    } else if (/food|eat|restaurant|café|cafe|swiggy|zomato|hotel|dine/i.test(lowerDesc)) {
      return "Food";
    } else if (/uber|ola|cab|auto|bus|train|travel|flight|ticket|metro|petrol|gas|fuel/i.test(lowerDesc)) {
      return "Transportation";
    } else if (/bill|electric|water|rent|broadband|recharge|mobile|wifi|dth|gas/i.test(lowerDesc)) {
      return "Bills";
    } else if (/movie|cinema|theater|game|netflix|prime|hotstar|entertainment/i.test(lowerDesc)) {
      return "Entertainment";
    } else if (/hospital|doctor|medic|pharmacy|health|clinic|medicine|drug/i.test(lowerDesc)) {
      return "Health";
    } else if (/school|college|university|course|class|tuition|education|book|stationery/i.test(lowerDesc)) {
      return "Education";
    } else {
      return "Other";
    }
  };

  const processTransactions = () => {
    if (!htmlContent) {
      showNotification('Please upload a Google Pay Activity HTML file first', 'error');
      return;
    }

    setIsProcessing(true);
    showNotification('Processing Google Pay Activity...', 'loading');

    setTimeout(() => {
      try {
        // Create a DOM parser
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(htmlContent, 'text/html');
        
        // Array to collect valid transactions
        const transactions = [];
        
        // Parse min amount threshold
        const minAmount = parseFloat(settings.minAmount) || 0;
        
        // Convert keywords string to array and create regex pattern
        const keywordsArray = settings.keywords.split(',').map(k => k.trim()).filter(k => k);
        const keywordsPattern = new RegExp(keywordsArray.join('|'), 'i');

        // Get all available categories
        const categoriesArray = settings.defaultCategories.split(',').map(c => c.trim()).filter(c => c);
        
        // Find all transaction elements - using Google Pay's HTML structure
        const transactionElements = htmlDoc.querySelectorAll('div.outer-cell');
        
        transactionElements.forEach((element, index) => {
          const text = element.textContent.trim();
          
          // Only include if it mentions keywords like "paid" or "sent"
          if (!keywordsPattern.test(text)) return;
          
          // Extract amount
          const amountMatch = text.match(/₹[\d,]+/);
          if (!amountMatch) return;
          
          const rawAmount = amountMatch[0].replace(/[₹,]/g, ''); // Remove ₹ and commas
          const amount = parseFloat(rawAmount);
          
          // Skip if below minimum amount threshold
          if (amount < minAmount) return;
          
          // Extract date
          const dateMatch = text.match(/\w+ \d{1,2}, \d{4}/); // e.g., April 22, 2025
          const date = dateMatch ? dateMatch[0] : 'Unknown';
          
          // Try to convert to standard date format
          let standardDate = date;
          try {
            if (date !== 'Unknown') {
              const parsed = new Date(date);
              standardDate = parsed.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
          } catch (e) {
            console.error("Date parsing error:", e);
          }
          
          // Description is typically the first line
          const descriptionLines = text.split('\n').filter(line => line.trim());
          const description = descriptionLines[0] || 'Unknown';
          
          // Auto-categorize based on description
          const category = categorizeTransaction(description);
          
          // Add to array with a unique ID
          transactions.push({
            id: `tx-${index}-${Date.now().toString(36)}`,
            date: standardDate,
            description: description,
            amount: amount.toFixed(2),
            type: 'Debit',
            category: category,
            fullText: settings.includeMetadata ? text.replace(/\n/g, ' | ') : undefined
          });
        });

        if (transactions.length === 0) {
          showNotification('No matching transactions found. Try adjusting your filters.', 'error');
          setIsProcessing(false);
          return;
        }
        
        // Sort transactions by date (newest first)
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Process successful - notify parent component with transactions and categories
        onTransactionsProcessed(transactions, categoriesArray);
        
        showNotification(`Processing successful! Found ${transactions.length} transactions.`, 'success');
      } catch (error) {
        showNotification(`Error during processing: ${error.message}`, 'error');
      } finally {
        setIsProcessing(false);
      }
    }, 800); // Simulate processing time
  };

  const handlePasteHtml = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim().toLowerCase().startsWith('<!doctype html') || 
          text.trim().toLowerCase().startsWith('<html')) {
        setHtmlContent(text);
        setFileName('gpay_activity');
        setFile({ name: 'gpay_activity.html' });
        showNotification('HTML content pasted successfully!', 'success');
      } else {
        showNotification('Clipboard content doesn\'t appear to be HTML', 'error');
      }
    } catch (err) {
      showNotification('Failed to read clipboard content', 'error');
    }
  };

  const openFileSelector = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="expense-tracker">
      <div className="section-header">
        <h2>Upload Google Pay Activity</h2>
        <p>Import your Google Pay transactions to begin tracking expenses</p>
      </div>
      
      {/* Upload area */}
      <div 
        className={`upload-area ${dragActive ? 'active' : ''}`}
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <FileText size={48} className="icon" />
        
        <h3>
          {file ? file.name : 'Drag and drop your Google Pay "My Activity.html" file here'}
        </h3>
        
        {!file && (
          <p className="upload-hint">
            or click to browse for a file
          </p>
        )}
        
        {file && (
          <p className="upload-success">
            File loaded successfully and ready for processing
          </p>
        )}
        
        <div className="button-group">
          <button
            type="button"
            onClick={openFileSelector}
            className="btn btn-secondary"
          >
            <FileUp size={18} />
            {file ? 'Change File' : 'Browse Files'}
          </button>
          
          <button
            type="button"
            onClick={handlePasteHtml}
            className="btn btn-secondary"
          >
            <Clipboard size={18} />
            Paste HTML
          </button>
          
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-secondary"
          >
            <Settings size={18} />
            Settings
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />
        </div>
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Filter & Category Settings</h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="close-btn"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="settings-content">
            <div className="setting-group">
              <label>
                Minimum Amount (₹)
                <input
                  type="number"
                  name="minAmount"
                  value={settings.minAmount}
                  onChange={handleSettingsChange}
                  placeholder="e.g. 100"
                />
              </label>
              <p className="hint">Only include transactions above this amount</p>
            </div>
            
            <div className="setting-group">
              <label>
                Transaction Keywords (comma-separated)
                <input
                  type="text"
                  name="keywords"
                  value={settings.keywords}
                  onChange={handleSettingsChange}
                  placeholder="e.g. paid,sent"
                />
              </label>
              <p className="hint">Only include transactions containing these words</p>
            </div>
            
            <div className="setting-group">
              <label>
                Categories (comma-separated)
                <input
                  type="text"
                  name="defaultCategories"
                  value={settings.defaultCategories}
                  onChange={handleSettingsChange}
                  placeholder="Shopping,Food,Transportation,etc."
                />
              </label>
              <p className="hint">Define custom categories for your expenses</p>
            </div>
            
            <div className="setting-group checkbox">
              <label>
                <input
                  type="checkbox"
                  name="includeMetadata"
                  checked={settings.includeMetadata}
                  onChange={handleSettingsChange}
                />
                Include full transaction text in data
              </label>
            </div>
          </div>
        </div>
      )}
      
      {/* Process button */}
      <div className="action-container">
        <button
          onClick={processTransactions}
          disabled={!file || isProcessing}
          className="btn btn-primary process-btn"
        >
          {isProcessing ? (
            <>
              <div className="spinner"></div>
              Processing...
            </>
          ) : (
            <>
              Process Transactions
            </>
          )}
        </button>
      </div>
      
      {/* Help sections */}
      <div className="info-sections">
        <div className="info-section">
          <h3>How It Works</h3>
          <ol>
            <li>Download your Google Pay activity by going to payments.google.com</li>
            <li>Upload the HTML file (usually called "My Activity.html")</li>
            <li>Adjust the settings to filter transactions (optional)</li>
            <li>Click "Process Transactions" to analyze your spending</li>
            <li>Explore your expenses in the Dashboard view</li>
          </ol>
        </div>
        
        <div className="info-section">
          <h3>Features</h3>
          <ul className="feature-list">
            <li>
              <CheckCircle size={18} className="check-icon" />
              <span>Filter transactions by minimum amount</span>
            </li>
            <li>
              <CheckCircle size={18} className="check-icon" />
              <span>Automatic categorization of expenses</span>
            </li>
            <li>
              <CheckCircle size={18} className="check-icon" />
              <span>Visualize spending patterns in the dashboard</span>
            </li>
            <li>
              <CheckCircle size={18} className="check-icon" />
              <span>Works 100% in your browser - no data is uploaded to servers</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.type === 'success' ? (
            <CheckCircle size={20} className="notification-icon" />
          ) : notification.type === 'error' ? (
            <AlertCircle size={20} className="notification-icon" />
          ) : (
            <div className="spinner notification-icon"></div>
          )}
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="close-notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ExpenseTracker;