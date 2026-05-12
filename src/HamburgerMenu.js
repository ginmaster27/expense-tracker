import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HamburgerMenu({
  user,
  onLogout,
  onSignIn,
  userGroup,
  darkMode,
  onOpenFamilyGroup,
  onOpenFamilyDashboard,
  onSwitchToPersonal
}) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    setIsOpen(false);
  };

  const handleAction = (action, path) => {
    if (path) {
      navigate(path);
    }
    if (action) {
      action();
    }
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
                onClick={() => handleAction(onSwitchToPersonal, '/')}
              >
                📊 Personal Mode
              </button>
              <button
                className="menu-item"
                onClick={() => handleAction(null, '/expenses')}
              >
                💰 All Expenses
              </button>
              <button
                className="menu-item"
                onClick={() => handleAction(null, '/investments')}
              >
                💼 Investments & Policies
              </button>
              {userGroup && onOpenFamilyDashboard && (
                <button
                  className="menu-item"
                  onClick={() => handleAction(onOpenFamilyDashboard, '/')}
                >
                  👨‍👩‍👧‍👦 Family Dashboard
                </button>
              )}
              {onOpenFamilyGroup && (
                <button
                  className="menu-item"
                  onClick={() => handleAction(onOpenFamilyGroup)}
                >
                  👥 Family Group
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
              <button className="menu-item login-btn" onClick={() => handleAction(onSignIn)}>
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
