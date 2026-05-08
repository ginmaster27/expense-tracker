import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HamburgerMenu({ user, onLogout, userGroup, darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  return (
    <div className={`hamburger-menu-wrapper ${darkMode ? 'dark-mode' : ''}`}>
      {/* Hamburger Toggle Button */}
      <button
        className={`hamburger-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        title="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Menu Backdrop */}
          <div
            className="hamburger-backdrop"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Content */}
          <div className="hamburger-menu">
            {/* User Section */}
            {user && (
              <div className="menu-user-section">
                <div className="user-info">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="user-avatar" />
                  ) : (
                    <div className="user-avatar-fallback">👤</div>
                  )}
                  <span className="user-name">
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <nav className="menu-items">
              <button
                className="menu-item"
                onClick={() => handleNavigation('/')}
              >
                📊 Dashboard
              </button>
              <button
                className="menu-item"
                onClick={() => handleNavigation('/expenses')}
              >
                💰 Expenses
              </button>
              <button
                className="menu-item"
                onClick={() => handleNavigation('/investments')}
              >
                💼 Investments & Policies
              </button>
              {userGroup && (
                <button
                  className="menu-item"
                  onClick={() => {
                    navigate('/');
                    setIsOpen(false);
                    // The app will handle family dashboard toggle
                  }}
                >
                  👨‍👩‍👧‍👦 Family Group
                </button>
              )}
            </nav>

            {/* Divider */}
            <div className="menu-divider"></div>

            {/* Auth Section */}
            {user ? (
              <button className="menu-item logout-btn" onClick={handleLogout}>
                🚪 Logout
              </button>
            ) : (
              <button className="menu-item login-btn">
                🔐 Sign In
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default HamburgerMenu;
