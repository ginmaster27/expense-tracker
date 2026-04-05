import { useState, useEffect } from 'react';

function FamilyGroupManager({
  user,
  userGroup,
  userRole,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  onGenerateCode,
  groupLoading,
  showManager,
  setShowManager,
  darkMode
}) {
  const [tab, setTab] = useState(userGroup ? 'group' : 'create');
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Switch to group tab when user joins/creates a group
  useEffect(() => {
    if (userGroup) {
      setTab('group');
    }
  }, [userGroup]);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }

    onCreateGroup(groupName);
    setGroupName('');
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    onJoinGroup(inviteCode);
    setInviteCode('');
  };

  if (!showManager) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="group-manager-backdrop"
        onClick={() => setShowManager(false)}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div className={`group-manager-modal ${darkMode ? 'dark-mode' : ''}`}>
        <div className="group-manager-header">
          <h2 className="group-manager-title">👨‍👩‍👧‍👦 Family Group</h2>
          <button
            type="button"
            className="group-manager-close"
            onClick={() => setShowManager(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="group-manager-content">
          {userGroup ? (
            // Group Details View
            <>
              {/* Group Tabs */}
              <div className="group-tabs">
                <button
                  className={`group-tab ${tab === 'group' ? 'active' : ''}`}
                  onClick={() => setTab('group')}
                >
                  👥 Group Info
                </button>
                <button
                  className={`group-tab ${tab === 'members' ? 'active' : ''}`}
                  onClick={() => setTab('members')}
                >
                  👤 Members ({userGroup.members?.length || 0})
                </button>
                {userRole === 'admin' && (
                  <button
                    className={`group-tab ${tab === 'codes' ? 'active' : ''}`}
                    onClick={() => setTab('codes')}
                  >
                    🔐 Invite Codes
                  </button>
                )}
              </div>

              {/* Group Info Tab */}
              {tab === 'group' && (
                <div className="group-info-section">
                  <div className="group-detail">
                    <label className="group-label">Group Name</label>
                    <p className="group-value">{userGroup.name}</p>
                  </div>

                  <div className="group-detail">
                    <label className="group-label">Your Role</label>
                    <p className="group-value">
                      <span className={`role-badge ${userRole}`}>{userRole}</span>
                    </p>
                  </div>

                  <div className="group-detail">
                    <label className="group-label">Admin</label>
                    <p className="group-value">{userGroup.adminName || 'Unknown'}</p>
                  </div>

                  <div className="group-actions">
                    <button
                      className="leave-btn"
                      onClick={onLeaveGroup}
                      disabled={groupLoading}
                    >
                      Leave Group
                    </button>
                  </div>
                </div>
              )}

              {/* Members Tab */}
              {tab === 'members' && (
                <div className="group-members-section">
                  <div className="members-list">
                    {userGroup.members && userGroup.members.length > 0 ? (
                      userGroup.members.map((member) => (
                        <div key={member.userId} className="member-item">
                          <div className="member-info">
                            <div className="member-name">{member.name}</div>
                            <div className="member-role">{member.role}</div>
                          </div>
                          {member.role === 'admin' && (
                            <span className="admin-badge">👑</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="no-members">No members found</p>
                    )}
                  </div>
                </div>
              )}

              {/* Invite Codes Tab (Admin Only) */}
              {tab === 'codes' && userRole === 'admin' && (
                <div className="group-codes-section">
                  <div className="codes-intro">
                    <p>📋 Share an invite code with your family members so they can join the group.</p>
                  </div>

                  <div className="codes-list">
                    {userGroup.inviteCodes && userGroup.inviteCodes.length > 0 ? (
                      userGroup.inviteCodes.map((codeObj, idx) => (
                        <div key={idx} className="code-item">
                          <div className="code-details">
                            <div className="code-value">{codeObj.code}</div>
                            <div className="code-info">
                              {codeObj.usedCount || 0} member{codeObj.usedCount !== 1 ? 's' : ''} joined
                            </div>
                          </div>
                          <button
                            type="button"
                            className="copy-code-btn"
                            onClick={() => copyToClipboard(codeObj.code)}
                            title="Copy to clipboard"
                          >
                            {copiedCode === codeObj.code ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="no-codes">No invite codes available</p>
                    )}
                  </div>

                  <button
                    className="generate-code-btn"
                    onClick={onGenerateCode}
                    disabled={groupLoading}
                  >
                    + Generate New Code
                  </button>

                  <div className="share-instructions">
                    <h3 className="instructions-title">How to invite members:</h3>
                    <ol className="instructions-list">
                      <li>Copy an invite code using the button above</li>
                      <li>Share the code with your family members (via message, email, etc.)</li>
                      <li>They open the app, go to "Family Group" → "Join Group"</li>
                      <li>They paste the code and join your group</li>
                    </ol>
                  </div>
                </div>
              )}
            </>
          ) : (
            // No Group View
            <>
              {/* Tabs for Create/Join */}
              <div className="group-tabs">
                <button
                  className={`group-tab ${tab === 'create' ? 'active' : ''}`}
                  onClick={() => {
                    setTab('create');
                    setError('');
                  }}
                >
                  ➕ Create Group
                </button>
                <button
                  className={`group-tab ${tab === 'join' ? 'active' : ''}`}
                  onClick={() => {
                    setTab('join');
                    setError('');
                  }}
                >
                  ✓ Join Group
                </button>
              </div>

              {/* Create Group Form */}
              {tab === 'create' && (
                <form onSubmit={handleCreateSubmit} className="group-form">
                  <div className="form-group">
                    <label htmlFor="groupName" className="form-label">
                      Group Name
                    </label>
                    <input
                      id="groupName"
                      type="text"
                      className="form-input"
                      placeholder="e.g., Smith Family"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      disabled={groupLoading}
                    />
                  </div>

                  {error && <div className="form-error">{error}</div>}

                  <button
                    type="submit"
                    className="submit-btn create-btn"
                    disabled={groupLoading}
                  >
                    {groupLoading ? 'Creating...' : 'Create Family Group'}
                  </button>
                </form>
              )}

              {/* Join Group Form */}
              {tab === 'join' && (
                <form onSubmit={handleJoinSubmit} className="group-form">
                  <div className="form-group">
                    <label htmlFor="inviteCode" className="form-label">
                      Invite Code
                    </label>
                    <input
                      id="inviteCode"
                      type="text"
                      className="form-input"
                      placeholder="Enter 6-character code"
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
                      maxLength="6"
                      disabled={groupLoading}
                    />
                  </div>

                  {error && <div className="form-error">{error}</div>}

                  <button
                    type="submit"
                    className="submit-btn join-btn"
                    disabled={groupLoading}
                  >
                    {groupLoading ? 'Joining...' : 'Join Family Group'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default FamilyGroupManager;
