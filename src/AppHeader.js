import logo from './assets/logo.png';
import HamburgerMenu from './HamburgerMenu';

function AppHeader({
  darkMode,
  setDarkMode,
  user,
  authLoading = false,
  onLogout,
  onSignIn,
  userGroup,
  onOpenFamilyGroup,
  onOpenFamilyDashboard
}) {
  return (
    <div className="header app-header">
      <div className="header-left">
        <img src={logo} alt="Raashi Logo" className="logo-image" />
      </div>

      <div className="header-right">
        <button
          className={`theme-toggle ${darkMode ? 'toggle-active' : ''}`}
          onClick={() => setDarkMode(!darkMode)}
          title="Toggle dark mode"
          aria-label="Toggle dark mode"
        >
          <span className="toggle-switch"></span>
        </button>

        {!authLoading && (
          <HamburgerMenu
            user={user}
            onLogout={onLogout}
            onSignIn={onSignIn}
            userGroup={userGroup}
            darkMode={darkMode}
            onOpenFamilyGroup={onOpenFamilyGroup}
            onOpenFamilyDashboard={onOpenFamilyDashboard}
          />
        )}
      </div>
    </div>
  );
}

export default AppHeader;
