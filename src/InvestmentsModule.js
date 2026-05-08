import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sipsAPI, sipTopUpsAPI, insurancePoliciesAPI, vehicleInsurancePoliciesAPI, vehiclePollutionRecordsAPI } from './firebase';
import SIPList from './InvestmentComponents/SIPList';
import SIPForm from './InvestmentComponents/SIPForm';
import SIPTopUpForm from './InvestmentComponents/SIPTopUpForm';
import InsuranceList from './InvestmentComponents/InsuranceList';
import InsuranceForm from './InvestmentComponents/InsuranceForm';
import VehicleInsuranceList from './InvestmentComponents/VehicleInsuranceList';
import VehicleInsuranceForm from './InvestmentComponents/VehicleInsuranceForm';
import PollutionList from './InvestmentComponents/PollutionList';
import PollutionForm from './InvestmentComponents/PollutionForm';
import HamburgerMenu from './HamburgerMenu';
import './InvestmentsModule.css';

function InvestmentsModule({ user, darkMode, showToast, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sips');
  
  // SIPs state
  const [sips, setSips] = useState([]);
  const [sipTopUps, setSipTopUps] = useState([]);
  const [showSIPForm, setShowSIPForm] = useState(false);
  const [editingSIPId, setEditingSIPId] = useState(null);
  const [showTopUpForm, setShowTopUpForm] = useState(false);
  const [topUpSIPId, setTopUpSIPId] = useState(null);
  const [isSubmittingSIP, setIsSubmittingSIP] = useState(false);
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState(false);

  // Insurance state
  const [insurancePolicies, setInsurancePolicies] = useState([]);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [isSubmittingPolicy, setIsSubmittingPolicy] = useState(false);

  // Vehicle Insurance state
  const [vehicleInsurances, setVehicleInsurances] = useState([]);
  const [showVehicleInsuranceForm, setShowVehicleInsuranceForm] = useState(false);
  const [editingVehicleInsuranceId, setEditingVehicleInsuranceId] = useState(null);
  const [isSubmittingVehicleInsurance, setIsSubmittingVehicleInsurance] = useState(false);

  // Pollution Records state
  const [pollutionRecords, setPollutionRecords] = useState([]);
  const [showPollutionForm, setShowPollutionForm] = useState(false);
  const [editingPollutionId, setEditingPollutionId] = useState(null);
  const [isSubmittingPollution, setIsSubmittingPollution] = useState(false);

  // Loading states
  const [loadingSIPs, setLoadingSIPs] = useState(false);
  const [loadingInsurance, setLoadingInsurance] = useState(false);
  const [loadingVehicleInsurance, setLoadingVehicleInsurance] = useState(false);
  const [loadingPollution, setLoadingPollution] = useState(false);

  // Set up real-time listeners
  useEffect(() => {
    if (!user) return;

    setLoadingSIPs(true);
    const unsubscribeSIPs = sipsAPI.listenToSIPs(user.uid, (data) => {
      setSips(data);
      setLoadingSIPs(false);
    });

    return () => unsubscribeSIPs();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribeTopUps = sipTopUpsAPI.listenToTopUps(user.uid, (data) => {
      setSipTopUps(data);
    });

    return () => unsubscribeTopUps();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setLoadingInsurance(true);
    const unsubscribePolicies = insurancePoliciesAPI.listenToPolicies(user.uid, (data) => {
      setInsurancePolicies(data);
      setLoadingInsurance(false);
    });

    return () => unsubscribePolicies();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setLoadingVehicleInsurance(true);
    const unsubscribeVehiclePolicies = vehicleInsurancePoliciesAPI.listenToVehiclePolicies(user.uid, (data) => {
      setVehicleInsurances(data);
      setLoadingVehicleInsurance(false);
    });

    return () => unsubscribeVehiclePolicies();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setLoadingPollution(true);
    const unsubscribeRecords = vehiclePollutionRecordsAPI.listenToRecords(user.uid, (data) => {
      setPollutionRecords(data);
      setLoadingPollution(false);
    });

    return () => unsubscribeRecords();
  }, [user]);

  // SIP handlers
  const handleAddSIP = async (sipData) => {
    if (!user) return;
    setIsSubmittingSIP(true);
    try {
      if (editingSIPId) {
        await sipsAPI.updateSIP(user.uid, editingSIPId, sipData);
        showToast('SIP updated successfully', 'success');
        setEditingSIPId(null);
      } else {
        await sipsAPI.addSIP(user.uid, sipData);
        showToast('SIP added successfully', 'success');
      }
      setShowSIPForm(false);
    } catch (error) {
      console.error('Error adding/updating SIP:', error);
      showToast('Error saving SIP', 'error');
    } finally {
      setIsSubmittingSIP(false);
    }
  };

  const handleDeleteSIP = async (sipId) => {
    if (!user || !window.confirm('Are you sure you want to delete this SIP?')) return;
    try {
      await sipsAPI.deleteSIP(user.uid, sipId);
      showToast('SIP deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting SIP:', error);
      showToast('Error deleting SIP', 'error');
    }
  };

  const handleEditSIP = (sip) => {
    setEditingSIPId(sip.id);
    setShowSIPForm(true);
  };

  // Top-up handlers
  const handleAddTopUp = async (topUpData) => {
    if (!user) return;
    setIsSubmittingTopUp(true);
    try {
      await sipTopUpsAPI.addTopUp(user.uid, topUpData);
      showToast('Top-up added successfully', 'success');
      setShowTopUpForm(false);
      setTopUpSIPId(null);
    } catch (error) {
      console.error('Error adding top-up:', error);
      showToast('Error adding top-up', 'error');
    } finally {
      setIsSubmittingTopUp(false);
    }
  };

  const handleDeleteTopUp = async (topUpId) => {
    if (!user || !window.confirm('Are you sure you want to delete this top-up?')) return;
    try {
      await sipTopUpsAPI.deleteTopUp(user.uid, topUpId);
      showToast('Top-up deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting top-up:', error);
      showToast('Error deleting top-up', 'error');
    }
  };

  // Insurance handlers
  const handleAddInsurancePolicy = async (policyData) => {
    if (!user) return;
    setIsSubmittingPolicy(true);
    try {
      if (editingPolicyId) {
        await insurancePoliciesAPI.updatePolicy(user.uid, editingPolicyId, policyData);
        showToast('Insurance policy updated successfully', 'success');
        setEditingPolicyId(null);
      } else {
        await insurancePoliciesAPI.addPolicy(user.uid, policyData);
        showToast('Insurance policy added successfully', 'success');
      }
      setShowInsuranceForm(false);
    } catch (error) {
      console.error('Error adding/updating insurance policy:', error);
      showToast('Error saving insurance policy', 'error');
    } finally {
      setIsSubmittingPolicy(false);
    }
  };

  const handleDeleteInsurancePolicy = async (policyId) => {
    if (!user || !window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await insurancePoliciesAPI.deletePolicy(user.uid, policyId);
      showToast('Insurance policy deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting insurance policy:', error);
      showToast('Error deleting insurance policy', 'error');
    }
  };

  const handleEditInsurancePolicy = (policy) => {
    setEditingPolicyId(policy.id);
    setShowInsuranceForm(true);
  };

  // Vehicle Insurance handlers
  const handleAddVehicleInsurance = async (vehicleData) => {
    if (!user) return;
    setIsSubmittingVehicleInsurance(true);
    try {
      if (editingVehicleInsuranceId) {
        await vehicleInsurancePoliciesAPI.updateVehiclePolicy(user.uid, editingVehicleInsuranceId, vehicleData);
        showToast('Vehicle insurance updated successfully', 'success');
        setEditingVehicleInsuranceId(null);
      } else {
        await vehicleInsurancePoliciesAPI.addVehiclePolicy(user.uid, vehicleData);
        showToast('Vehicle insurance added successfully', 'success');
      }
      setShowVehicleInsuranceForm(false);
    } catch (error) {
      console.error('Error adding/updating vehicle insurance:', error);
      showToast('Error saving vehicle insurance', 'error');
    } finally {
      setIsSubmittingVehicleInsurance(false);
    }
  };

  const handleDeleteVehicleInsurance = async (vehicleId) => {
    if (!user || !window.confirm('Are you sure you want to delete this vehicle insurance?')) return;
    try {
      await vehicleInsurancePoliciesAPI.deleteVehiclePolicy(user.uid, vehicleId);
      showToast('Vehicle insurance deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting vehicle insurance:', error);
      showToast('Error deleting vehicle insurance', 'error');
    }
  };

  const handleEditVehicleInsurance = (vehicle) => {
    setEditingVehicleInsuranceId(vehicle.id);
    setShowVehicleInsuranceForm(true);
  };

  // Pollution handlers
  const handleAddPollutionRecord = async (recordData) => {
    if (!user) return;
    setIsSubmittingPollution(true);
    try {
      if (editingPollutionId) {
        await vehiclePollutionRecordsAPI.updateRecord(user.uid, editingPollutionId, recordData);
        showToast('Pollution record updated successfully', 'success');
        setEditingPollutionId(null);
      } else {
        await vehiclePollutionRecordsAPI.addRecord(user.uid, recordData);
        showToast('Pollution record added successfully', 'success');
      }
      setShowPollutionForm(false);
    } catch (error) {
      console.error('Error adding/updating pollution record:', error);
      showToast('Error saving pollution record', 'error');
    } finally {
      setIsSubmittingPollution(false);
    }
  };

  const handleDeletePollutionRecord = async (recordId) => {
    if (!user || !window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await vehiclePollutionRecordsAPI.deleteRecord(user.uid, recordId);
      showToast('Pollution record deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting pollution record:', error);
      showToast('Error deleting pollution record', 'error');
    }
  };

  const handleEditPollutionRecord = (record) => {
    setEditingPollutionId(record.id);
    setShowPollutionForm(true);
  };

  if (!user) {
    return (
      <div className={`investments-module ${darkMode ? 'dark-mode' : ''}`}>
        <div className="investments-container">
          <p className="login-message">Please log in to access investments and policies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`investments-module ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header with Navigation */}
      <div className="investments-header">
        <div className="investments-header-left">
          <button
            className="back-button"
            onClick={() => navigate(-1)}
            title="Go back"
          >
            ← Back
          </button>
          <h1 className="investments-header-title">📊 Investments & Policies</h1>
        </div>
        <div className="investments-header-right">
          <HamburgerMenu
            user={user}
            onLogout={onLogout}
            userGroup={null}
            darkMode={darkMode}
          />
        </div>
      </div>

      <div className="investments-container">
        {/* Tabs Navigation */}
        <div className="investments-tabs">
          <button
            className={`tab-button ${activeTab === 'sips' ? 'active' : ''}`}
            onClick={() => setActiveTab('sips')}
          >
            💰 SIPs
          </button>
          <button
            className={`tab-button ${activeTab === 'insurance' ? 'active' : ''}`}
            onClick={() => setActiveTab('insurance')}
          >
            🛡️ Insurance
          </button>
          <button
            className={`tab-button ${activeTab === 'vehicle' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicle')}
          >
            🚗 Vehicle
          </button>
          <button
            className={`tab-button ${activeTab === 'pollution' ? 'active' : ''}`}
            onClick={() => setActiveTab('pollution')}
          >
            🌱 Pollution
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* SIPs Tab */}
          {activeTab === 'sips' && (
            <>
              <div className="tab-header">
                <h3>SIPs & Investments</h3>
                <div className="tab-buttons">
                  {!showTopUpForm && !showSIPForm && (
                    <>
                      <button
                        className="action-btn primary-btn"
                        onClick={() => {
                          setEditingSIPId(null);
                          setShowSIPForm(true);
                        }}
                      >
                        + Add SIP
                      </button>
                    </>
                  )}
                </div>
              </div>

              {showSIPForm && (
                <SIPForm
                  userId={user.uid}
                  editingId={editingSIPId}
                  existingSIP={editingSIPId ? sips.find(s => s.id === editingSIPId) : null}
                  onSubmit={handleAddSIP}
                  onCancel={() => {
                    setShowSIPForm(false);
                    setEditingSIPId(null);
                  }}
                  isSubmitting={isSubmittingSIP}
                  darkMode={darkMode}
                />
              )}

              {showTopUpForm && topUpSIPId && (
                <SIPTopUpForm
                  userId={user.uid}
                  sipId={topUpSIPId}
                  sip={sips.find(s => s.id === topUpSIPId)}
                  onSubmit={handleAddTopUp}
                  onCancel={() => {
                    setShowTopUpForm(false);
                    setTopUpSIPId(null);
                  }}
                  isSubmitting={isSubmittingTopUp}
                  darkMode={darkMode}
                />
              )}

              {!showSIPForm && !showTopUpForm && (
                <SIPList
                  sips={sips}
                  topUps={sipTopUps}
                  onEdit={handleEditSIP}
                  onDelete={handleDeleteSIP}
                  onAddTopUp={(sipId) => {
                    setTopUpSIPId(sipId);
                    setShowTopUpForm(true);
                  }}
                  onDeleteTopUp={handleDeleteTopUp}
                  loading={loadingSIPs}
                  darkMode={darkMode}
                />
              )}
            </>
          )}

          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <>
              <div className="tab-header">
                <h3>Life & Medical Insurance</h3>
                {!showInsuranceForm && (
                  <button
                    className="action-btn primary-btn"
                    onClick={() => {
                      setEditingPolicyId(null);
                      setShowInsuranceForm(true);
                    }}
                  >
                    + Add Policy
                  </button>
                )}
              </div>

              {showInsuranceForm && (
                <InsuranceForm
                  userId={user.uid}
                  editingId={editingPolicyId}
                  existingPolicy={editingPolicyId ? insurancePolicies.find(p => p.id === editingPolicyId) : null}
                  onSubmit={handleAddInsurancePolicy}
                  onCancel={() => {
                    setShowInsuranceForm(false);
                    setEditingPolicyId(null);
                  }}
                  isSubmitting={isSubmittingPolicy}
                  darkMode={darkMode}
                />
              )}

              {!showInsuranceForm && (
                <InsuranceList
                  policies={insurancePolicies}
                  onEdit={handleEditInsurancePolicy}
                  onDelete={handleDeleteInsurancePolicy}
                  loading={loadingInsurance}
                  darkMode={darkMode}
                />
              )}
            </>
          )}

          {/* Vehicle Insurance Tab */}
          {activeTab === 'vehicle' && (
            <>
              <div className="tab-header">
                <h3>Vehicle Insurance & Pollution</h3>
                {!showVehicleInsuranceForm && !showPollutionForm && (
                  <button
                    className="action-btn primary-btn"
                    onClick={() => {
                      setEditingVehicleInsuranceId(null);
                      setShowVehicleInsuranceForm(true);
                    }}
                  >
                    + Add Vehicle Insurance
                  </button>
                )}
              </div>

              {showVehicleInsuranceForm && (
                <VehicleInsuranceForm
                  userId={user.uid}
                  editingId={editingVehicleInsuranceId}
                  existingVehicleInsurance={editingVehicleInsuranceId ? vehicleInsurances.find(v => v.id === editingVehicleInsuranceId) : null}
                  onSubmit={handleAddVehicleInsurance}
                  onCancel={() => {
                    setShowVehicleInsuranceForm(false);
                    setEditingVehicleInsuranceId(null);
                  }}
                  isSubmitting={isSubmittingVehicleInsurance}
                  darkMode={darkMode}
                />
              )}

              {!showVehicleInsuranceForm && (
                <VehicleInsuranceList
                  vehicleInsurances={vehicleInsurances}
                  onEdit={handleEditVehicleInsurance}
                  onDelete={handleDeleteVehicleInsurance}
                  loading={loadingVehicleInsurance}
                  darkMode={darkMode}
                />
              )}
            </>
          )}

          {/* Pollution Tab */}
          {activeTab === 'pollution' && (
            <>
              <div className="tab-header">
                <h3>Pollution Certificates</h3>
                {!showPollutionForm && (
                  <button
                    className="action-btn primary-btn"
                    onClick={() => {
                      setEditingPollutionId(null);
                      setShowPollutionForm(true);
                    }}
                  >
                    + Add Certificate
                  </button>
                )}
              </div>

              {showPollutionForm && (
                <PollutionForm
                  userId={user.uid}
                  editingId={editingPollutionId}
                  existingRecord={editingPollutionId ? pollutionRecords.find(r => r.id === editingPollutionId) : null}
                  onSubmit={handleAddPollutionRecord}
                  onCancel={() => {
                    setShowPollutionForm(false);
                    setEditingPollutionId(null);
                  }}
                  isSubmitting={isSubmittingPollution}
                  darkMode={darkMode}
                />
              )}

              {!showPollutionForm && (
                <PollutionList
                  records={pollutionRecords}
                  onEdit={handleEditPollutionRecord}
                  onDelete={handleDeletePollutionRecord}
                  loading={loadingPollution}
                  darkMode={darkMode}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvestmentsModule;
