import { useState } from 'react';
import ExpenseTracker from './components/ExpenseTracker';
import Dashboard from './components/Dashboard';
import { Moon, Sun } from 'lucide-react';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'dashboard', 'transactions'

  const handleTransactionsProcessed = (processedTransactions, expenseCategories) => {
    setTransactions(processedTransactions);
    setCategories(expenseCategories);
    setActiveTab('dashboard');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <header>
        <div className="container header-content">
          <h1>ExpenseInsight</h1>
          <div className="nav-controls">
            <nav>
              <button
                className={activeTab === 'upload' ? 'active' : ''}
                onClick={() => setActiveTab('upload')}
              >
                Upload
              </button>
              <button
                className={activeTab === 'dashboard' ? 'active' : ''}
                onClick={() => setActiveTab('dashboard')}
                disabled={transactions.length === 0}
              >
                Dashboard
              </button>
              <button
                className={activeTab === 'transactions' ? 'active' : ''}
                onClick={() => setActiveTab('transactions')}
                disabled={transactions.length === 0}
              >
                Transactions
              </button>
            </nav>
            <button className="theme-toggle" onClick={toggleDarkMode}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {activeTab === 'upload' && (
          <ExpenseTracker onTransactionsProcessed={handleTransactionsProcessed} />
        )}
        
        {(activeTab === 'dashboard' || activeTab === 'transactions') && transactions.length > 0 && (
          <Dashboard 
            transactions={transactions}
            categories={categories}
            activeView={activeTab}
          />
        )}
        
        {(activeTab === 'dashboard' || activeTab === 'transactions') && transactions.length === 0 && (
          <div className="empty-state">
            <h2>No Data Available</h2>
            <p>Please upload and process your Google Pay activity file first.</p>
            <button onClick={() => setActiveTab('upload')}>Go to Upload</button>
          </div>
        )}
      </main>

      <footer>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} ExpenseInsight - Track your spending habits efficiently</p>
        </div>
      </footer>
    </div>
  );
}

export default App;