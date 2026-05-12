import { useState, useEffect } from 'react';
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
import AppHeader from './AppHeader';
import './InvestmentsModule.css';

function InvestmentsModule({
  user,
  darkMode,
  setDarkMode,
  showToast,
  onLogout,
  onSignIn,
  userGroup,
  onOpenFamilyGroup,
  onOpenFamilyDashboard
}) {
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
      const existingSIP = editingSIPId ? sips.find(s => s.id === editingSIPId) : null;
      const existingStatus = existingSIP?.status || 'Active';
      const nextStatus = sipData.status || 'Active';
      const statusChanged = existingStatus !== nextStatus;
      const statusDate =
        nextStatus === 'Paused' || nextStatus === 'Stopped'
          ? (statusChanged ? new Date().toISOString().split('T')[0] : existingSIP?.statusDate || new Date().toISOString().split('T')[0])
          : null;
      const dataToSave = {
        ...sipData,
        statusDate
      };

      if (editingSIPId) {
        await sipsAPI.updateSIP(user.uid, editingSIPId, dataToSave);
        showToast('SIP updated successfully', 'success');
        setEditingSIPId(null);
      } else {
        await sipsAPI.addSIP(user.uid, dataToSave);
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

  const parseISODate = (dateValue, endOfDay = false) => {
    if (!dateValue) return null;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      const date = dateValue.toDate();
      date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
      return date;
    }
    if (dateValue instanceof Date) {
      const date = new Date(dateValue);
      date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
      return date;
    }
    if (typeof dateValue !== 'string') return null;
    const [year, month, day] = dateValue.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  };

  const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getSIPStopDate = (sip) => {
    const status = (sip.status || 'Active').trim().toLowerCase();
    if (status !== 'paused' && status !== 'stopped') return null;
    return parseISODate(sip.statusDate, true) || parseISODate(formatDateToISO(new Date()), true);
  };

  const getSIPInvestmentInstancesForDateRange = (startDate, endDate) => {
    const instances = [];

    sips.forEach((sip) => {
      const frequency = (sip.frequency || 'Monthly').trim().toLowerCase();
      const isMonthly = frequency.includes('month') || frequency === 'monthy';
      const isYearly = frequency.includes('year');
      const isOneTime = frequency === 'one-time' || frequency === 'one time' || frequency === 'onetime';
      if (!isMonthly && !isYearly && !isOneTime) return;

      const sipStartDate = parseISODate(sip.startDate);
      const renewalDate = parseISODate(sip.renewalDate);
      const firstKnownDate = sipStartDate || renewalDate;
      if (!firstKnownDate) return;

      const explicitEndDate = sip.endDate ? parseISODate(sip.endDate, true) : null;
      const stopDate = getSIPStopDate(sip);
      const effectiveEndDate = [explicitEndDate, stopDate].filter(Boolean).sort((a, b) => a - b)[0] || null;
      if (firstKnownDate > endDate || (effectiveEndDate && effectiveEndDate < startDate)) return;

      const addInstance = (date) => {
        if (!date || date < startDate || date > endDate || (effectiveEndDate && date > effectiveEndDate)) return;
        instances.push({
          id: `${sip.id}-${formatDateToISO(date)}`,
          date: formatDateToISO(date),
          amount: parseFloat(sip.amount) || 0
        });
      };

      if (isOneTime) {
        addInstance(firstKnownDate);
        return;
      }

      if (sipStartDate) {
        addInstance(sipStartDate);
      }

      if (isMonthly) {
        const anchorDate = renewalDate || sipStartDate;
        const recurrenceDay = anchorDate.getDate();
        const firstMonth = new Date(firstKnownDate.getFullYear(), firstKnownDate.getMonth(), 1);
        const rangeStartMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        let currentMonth = firstMonth > rangeStartMonth ? firstMonth : rangeStartMonth;

        while (currentMonth <= endDate) {
          const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
          const occurrenceDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), Math.min(recurrenceDay, lastDayOfMonth));
          const isAfterInitialPayment = sipStartDate ? occurrenceDate > sipStartDate : occurrenceDate >= firstKnownDate;
          if (isAfterInitialPayment) addInstance(occurrenceDate);
          currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        }
        return;
      }

      if (isYearly) {
        const anchorDate = renewalDate || sipStartDate;
        const recurrenceMonth = anchorDate.getMonth();
        const recurrenceDay = anchorDate.getDate();
        const firstYear = Math.max(firstKnownDate.getFullYear(), startDate.getFullYear());

        for (let year = firstYear; year <= endDate.getFullYear(); year += 1) {
          const lastDayOfMonth = new Date(year, recurrenceMonth + 1, 0).getDate();
          const occurrenceDate = new Date(year, recurrenceMonth, Math.min(recurrenceDay, lastDayOfMonth));
          const isAfterInitialPayment = sipStartDate ? occurrenceDate > sipStartDate : occurrenceDate >= firstKnownDate;
          if (isAfterInitialPayment) addInstance(occurrenceDate);
        }
      }
    });

    return instances;
  };

  const getTopUpTotalForDateRange = (startDate, endDate) => (
    sipTopUps.reduce((sum, topUp) => {
      const topUpDate = parseISODate(topUp.date);
      if (!topUpDate || topUpDate < startDate || topUpDate > endDate) return sum;
      return sum + (parseFloat(topUp.topUpAmount) || 0);
    }, 0)
  );

  const getSIPSummary = () => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    const allTimeStart = new Date(0);
    const allTimeEnd = currentMonthEnd;

    const monthlySIPTotal = getSIPInvestmentInstancesForDateRange(currentMonthStart, currentMonthEnd)
      .reduce((sum, instance) => sum + instance.amount, 0);
    const allTimeSIPTotal = getSIPInvestmentInstancesForDateRange(allTimeStart, allTimeEnd)
      .reduce((sum, instance) => sum + instance.amount, 0);

    return {
      monthly: monthlySIPTotal + getTopUpTotalForDateRange(currentMonthStart, currentMonthEnd),
      allTime: allTimeSIPTotal + getTopUpTotalForDateRange(allTimeStart, allTimeEnd)
    };
  };

  const sipSummary = getSIPSummary();

  if (!user) {
    return (
      <div className={`investments-module ${darkMode ? 'dark-mode' : ''}`}>
        <AppHeader
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={user}
          onLogout={onLogout}
          onSignIn={onSignIn}
          userGroup={userGroup}
          onOpenFamilyGroup={onOpenFamilyGroup}
          onOpenFamilyDashboard={onOpenFamilyDashboard}
        />
        <div className="investments-container">
          <p className="login-message">Please log in to access investments and policies.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`investments-module ${darkMode ? 'dark-mode' : ''}`}>
      <AppHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        onLogout={onLogout}
        onSignIn={onSignIn}
        userGroup={userGroup}
        onOpenFamilyGroup={onOpenFamilyGroup}
        onOpenFamilyDashboard={onOpenFamilyDashboard}
      />

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

              {!showSIPForm && !showTopUpForm && (
                <div className="sip-summary-grid">
                  <div className="sip-summary-card">
                    <span className="sip-summary-label">Current Month Investment</span>
                    <strong className="sip-summary-value">₹{sipSummary.monthly.toFixed(2)}</strong>
                  </div>
                  <div className="sip-summary-card">
                    <span className="sip-summary-label">All Time Investment</span>
                    <strong className="sip-summary-value">₹{sipSummary.allTime.toFixed(2)}</strong>
                  </div>
                </div>
              )}

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
