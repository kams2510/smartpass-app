import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, List, RefreshCw, Bus, XCircle, CheckCircle, AlertTriangle, CloudOff, Loader, Keyboard, ClipboardList, LogIn, User, LogOut } from 'lucide-react';

// 🚨 Phase 4 Integration: Define the Base URL
const API_BASE_URL = 'https://smartpass-api-318496172391.us-central1.run.app/api'; 
const CONDUCTOR_APP_KEY = 'YOUR_CONDUCTOR_API_KEY'; // Placeholder for security

// --- CONDUCTOR MOCK DATABASE (Simulates Firestore Conductors Collection) ---
// Note: This list is only for simulating the login process when the API is down.
const MOCK_CONDUCTOR_DATABASE = [
    { id: 'CON_001', password: 'buspass', assignedBusId: 'B101', name: 'Ramesh' },
    { id: 'CON_002', password: 'buspass', assignedBusId: 'B102', name: 'Suresh' },
];


// ------------------------------------------------------------------------
// UTILITY COMPONENTS
// ------------------------------------------------------------------------

const ScanResult = ({ result, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000); 
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const displayColor = result.color === 'green' ? 'bg-green-600' : result.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-600';

    return (
        <div 
            className={`fixed inset-0 flex flex-col items-center justify-center text-white p-8 z-50 ${displayColor}`}
            onClick={onDismiss}
        >
            {result.status === 'Valid' && <CheckCircle size={128} />}
            {result.status === 'Duplicate' && <AlertTriangle size={128} />}
            {(result.status === 'Invalid' || result.status === 'Error') && <XCircle size={128} />}
            <h1 className="text-6xl font-extrabold mt-8">{result.status.toUpperCase()}</h1>
            <p className="text-xl mt-2 text-center">{result.message}</p>
            {result.student && (
                <div className="mt-8 bg-black bg-opacity-20 p-4 rounded-lg text-center">
                    <p className="font-bold text-lg">{result.student.name || 'Student'}</p>
                    <p>{result.student.id}</p>
                </div>
            )}
            <p className="text-sm mt-12 opacity-80">Tap anywhere to close</p>
        </div>
    );
};

// ------------------------------------------------------------------------
// CONDUCTOR LOGIN PAGE
// ------------------------------------------------------------------------

const ConductorLoginPage = ({ onLogin }) => {
    const [conductorId, setConductorId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const credentials = { conductorId, password };
        let conductorInfo = null;

        try {
            // MOCK AUTHENTICATION: Check against local list
            conductorInfo = MOCK_CONDUCTOR_DATABASE.find(c => c.id === conductorId && c.password === password);
            
            if (conductorInfo) {
                // If login succeeds, pass the assigned busId and conductor info to the main app
                onLogin({ 
                    isLoggedIn: true,
                    busId: conductorInfo.assignedBusId, // Use assignedBusId from mock data
                    name: conductorInfo.name,
                    id: conductorInfo.id,
                }); 
            } else {
                setError('Invalid credentials or Bus ID not assigned.');
            }

        } catch (err) {
            setError('Connection failed. Is the backend server running?');
            console.error("Login Error:", err);
        }

        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                <div className="text-center">
                    <User className="mx-auto h-12 w-auto text-blue-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Conductor Login
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to access your assigned bus route
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500"
                            placeholder="Conductor ID"
                            value={conductorId}
                            onChange={(e) => setConductorId(e.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-2 px-4 rounded-xl shadow-lg text-sm font-medium text-white transition ${
                                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {isLoading ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <LogIn className="w-5 h-5 mr-2" />}
                            Sign In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const QrScanner = ({ onScan, onCameraError, onManualEntry, currentBusId }) => {
    const qrCodeId = "qr-code-reader";
    const [scannerInitialized, setScannerInitialized] = useState(false);

    useEffect(() => {
        if (!window.Html5QrcodeScanner) {
            onCameraError("Scanner library not found. Please ensure the <script> tag is added to index.html.");
            return;
        }
        
        let html5QrCodeScanner = null;

        try {
            html5QrCodeScanner = new window.Html5QrcodeScanner(
                qrCodeId,
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                html5QrCodeScanner.pause(); 
                onScan(decodedText);
                setTimeout(() => html5QrCodeScanner.resume().catch(console.warn), 3000); 
            };

            html5QrCodeScanner.render(qrCodeSuccessCallback, (errorMessage) => {
                 // Initial render message suppression
            });
            setScannerInitialized(true);

        } catch (err) {
            console.error("QR Code Scanner Setup Error:", err);
            onCameraError("Camera access failed. Ensure permission is granted.");
        }

        return () => {
            if (html5QrCodeScanner) {
                html5QrCodeScanner.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner", error);
                });
            }
        };
    }, [onScan, onCameraError]);


    return (
        <div className="w-full bg-gray-900 aspect-square rounded-xl flex flex-col items-center justify-center p-4 shadow-inner">
            {scannerInitialized ? (
                 <div id={qrCodeId} className="w-full h-full p-2 bg-black rounded-lg"></div>
            ) : (
                <div className="w-full h-full border-4 border-dashed border-gray-500 rounded-lg flex flex-col items-center justify-center text-white text-center">
                    <Loader size={48} className="animate-spin mb-4 text-gray-400" />
                    <p>Initializing camera...</p>
                </div>
            )}
            <button onClick={onManualEntry} className="w-full mt-3 flex items-center justify-center text-white bg-gray-700 py-2 rounded-lg hover:bg-gray-600 transition">
                <Keyboard size={18} className='mr-2' /> Manual ID Entry / Bus Check
            </button>
        </div>
    );
};

const LogsView = ({ logs, localWhitelist, currentBusId }) => (
    <div className="p-4 flex-grow">
        <h1 className="text-2xl font-bold mb-4">Today's Scan Logs</h1>
        {logs.length === 0 ? (
            <p className="text-gray-500">No scans recorded yet for Bus {currentBusId}.</p>
        ) : (
            <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                {logs.map((log, index) => {
                    const student = localWhitelist.find(s => s.id === log.studentId);
                    
                    const statusConfig = {
                        Valid: { color: 'border-green-500', icon: <CheckCircle className="text-green-500"/>, text: 'PASS VALID' },
                        Duplicate: { color: 'border-yellow-500', icon: <AlertTriangle className="text-yellow-500"/>, text: 'DUPLICATE' },
                        Invalid: { color: 'border-red-500', icon: <XCircle className="text-red-500"/>, text: 'INVALID PASS' },
                        Error: { color: 'border-red-700', icon: <XCircle className="text-red-700"/>, text: 'API FAILURE' },
                        BusCheck: { color: 'border-blue-500', icon: <ClipboardList className="text-blue-500"/>, text: 'BUS LOG' }, 
                    };
                    const config = statusConfig[log.status] || { color: 'border-gray-500', icon: <XCircle className="text-gray-500"/>, text: 'UNKNOWN' };
                    
                    const primaryText = log.status === 'BusCheck' 
                        ? `Bus Permit: ${log.busStatus}` 
                        : student?.name || 'Student Pass';
                    const secondaryText = log.status === 'BusCheck' 
                        ? currentBusId 
                        : log.studentId || 'N/A';

                    return (
                        <div key={`${log.studentId || log.busStatus}-${log.timestamp}-${index}`} className={`bg-white p-3 rounded-lg shadow-sm border-l-4 ${config.color} flex items-center justify-between`}>
                           <div className="flex items-center">
                                <span className="mr-3">{config.icon}</span>
                                <div>
                                    <p className="font-semibold">{primaryText}</p>
                                    <p className="text-sm text-gray-600">{secondaryText}</p>
                                </div>
                           </div>
                           <div className='text-right'>
                               <p className='text-xs font-bold text-gray-700'>{config.text}</p>
                               <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                           </div>
                        </div>
                    );
                }).reverse()}
            </div>
        )}
    </div>
);


const ManualScanView = ({ onManualScan, onBack, onBusCheckLog, currentBusId }) => {
    const [studentId, setStudentId] = useState('');
    const [busStatus, setBusStatus] = useState('Valid'); 
    const [error, setError] = useState('');

    const handlePassVerification = (e) => {
        e.preventDefault();
        setError('');
        if (studentId.trim().length < 3) {
            setError("Please enter a valid Student ID.");
            return;
        }
        // Create a mock QR payload structure and pass it to the main handler
        const mockQrPayload = JSON.stringify({ 
            studentId: studentId.trim(), 
            busId: currentBusId
        });
        onManualScan(mockQrPayload);
        setStudentId(''); // Clear field after scan attempt
    };

    const handleBusStatusLog = () => {
        if (window.confirm(`Log status for Bus ${currentBusId} as '${busStatus}'?`)) {
            onBusCheckLog(busStatus);
        }
    };

    return (
        <div className="p-4">
            <button onClick={onBack} className="flex items-center text-blue-600 mb-4">
                <XCircle size={18} className='mr-1' /> Back to Scanner
            </button>
            <h1 className="text-2xl font-bold mb-6">Manual Verification</h1>
            
            <div className='bg-white p-6 rounded-xl shadow-lg mb-6'>
                <h2 className='text-xl font-semibold mb-4 text-blue-600'>Student Pass Entry</h2>
                <form onSubmit={handlePassVerification} className='space-y-4'>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                            placeholder="e.g., S001 (Requires Server Connection)"
                            className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500"
                            required
                        />
                    </div>
                    {error && <p className='text-red-500 text-sm'>{error}</p>}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
                        <input
                            type="text"
                            value={currentBusId}
                            disabled
                            className="w-full px-4 py-3 border rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
                        />
                    </div>

                    <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition shadow-md">
                        Verify Pass Manually
                    </button>
                </form>
            </div>

            <div className='bg-white p-6 rounded-xl shadow-lg'>
                <h2 className='text-xl font-semibold mb-4 text-green-600'>Bus Status Check (Visa/Permit)</h2>
                <div className='space-y-4'>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bus Permit Status</label>
                        <select
                            value={busStatus}
                            onChange={(e) => setBusStatus(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-blue-500"
                        >
                            <option value="Valid">Valid (Permits OK)</option>
                            <option value="Warning">Warning (Permit expiring soon)</option>
                            <option value="Expired">Expired (Invalid Permit)</option>
                        </select>
                    </div>
                    <button 
                        onClick={handleBusStatusLog} 
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition shadow-md flex items-center justify-center"
                    >
                        <ClipboardList size={18} className='mr-2' /> Log Bus Status
                    </button>
                </div>
            </div>
        </div>
    );
};

const SyncView = ({ localWhitelist, onSync, lastSyncTime, isSyncing, currentBusId }) => (
    <div className="p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Offline Data Sync</h1>
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
            {isSyncing ? (
                <Loader size={48} className="mx-auto text-blue-500 mb-4 animate-spin" />
            ) : (
                <RefreshCw size={48} className="mx-auto text-blue-500 mb-4" />
            )}
            
            {localWhitelist.length > 0 ? (
                <>
                    <h2 className="text-lg font-semibold text-green-600">Sync Complete!</h2>
                    <p className="text-gray-600 mt-2">Data for Bus **{currentBusId}** is loaded.</p>
                    <p className="text-gray-600">Total Paid Students: <span className="font-bold">{localWhitelist.length}</span></p>
                    <p className="text-xs text-gray-400 mt-4">Last sync: {new Date(lastSyncTime).toLocaleString()}</p>
                </>
            ) : (
                <>
                    <h2 className="text-lg font-semibold text-red-600">No Data Loaded</h2>
                    <p className="text-gray-600 mt-2">Please sync to download today's student whitelist for **offline verification**.</p>
                </>
            )}
        </div>
        <button 
            onClick={onSync} 
            disabled={isSyncing}
            className={`w-full max-w-xs text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-transform transform ${isSyncing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'}`}
        >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
        <p className="text-xs text-gray-500 mt-4">Sync is mandatory before starting any offline route.</p>
    </div>
);

const BottomNav = ({ activeView, setActiveView }) => {
    const navItems = [
        { id: 'scanner', icon: <QrCode size={28} />, label: 'Scanner' },
        { id: 'logs', icon: <List size={28} />, label: 'Logs' },
        { id: 'sync', icon: <RefreshCw size={28} />, label: 'Sync' },
    ];
    return (
        <nav className="w-full bg-white shadow-t border-t">
            <div className="flex justify-around">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`flex flex-col items-center justify-center w-full pt-3 pb-2 transition-colors duration-200 ${
                            activeView === item.id ? 'text-blue-500' : 'text-gray-500'
                        }`}
                    >
                        {item.icon}
                        <span className="text-xs mt-1">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};


// --- Main App Component --- //

export default function App() {
    const [currentConductor, setCurrentConductor] = useState(null); // Holds { busId, name, id } if logged in
    const [activeView, setActiveView] = useState('login'); // Start at login
    const [localWhitelist, setLocalWhitelist] = useState([]);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [scanLogs, setScanLogs] = useState([]);
    const [scanResult, setScanResult] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [cameraError, setCameraError] = useState(null); 
    
    // Key dynamic property: The bus ID is determined by the login state
    const currentBusId = currentConductor ? currentConductor.busId : null;
    const offlineMode = localWhitelist.length > 0;
    
    // --- Session Management ---
    useEffect(() => {
        const storedConductor = localStorage.getItem('smartbusConductor');
        if (storedConductor) {
            try {
                setCurrentConductor(JSON.parse(storedConductor));
            } catch (e) {
                console.error("Failed to parse conductor session:", e);
                localStorage.removeItem('smartbusConductor');
            }
        }
    }, []);

    useEffect(() => {
        if (currentConductor) {
            // Save session upon successful login (New or Restore)
            localStorage.setItem('smartbusConductor', JSON.stringify(currentConductor));
            
            // 🚨 FIX: Ensure activeView is set to 'scanner' after any successful login
            setActiveView('scanner'); 
        } else {
            // Clear session upon logout
            localStorage.removeItem('smartbusConductor');
            // Reset app state
            setLocalWhitelist([]);
            setScanLogs([]);
            setActiveView('login');
        }
    }, [currentConductor]);


    
    // 🚨 INTEGRATED: Sync Function (fetches whitelist from server)
    const handleSync = async () => {
        if (!currentBusId) return alert("Please log in first.");

        setIsSyncing(true);
        setCameraError(null); // Clear any previous camera errors
        setLocalWhitelist([]); 
        
        try {
            const response = await fetch(`${API_BASE_URL}/whitelist/${currentBusId}`);
            if (!response.ok) throw new Error('Failed to download whitelist');
            
            const data = await response.json();
            
            setLocalWhitelist(data);
            setLastSyncTime(Date.now());
            // 🚨 UX Improvement: Encouraging message after sync
            alert(`✅ Great job, ${currentConductor.name}! ${data.length} paid students loaded. You are ready to scan!`);

        } catch (error) {
            console.error("Sync Error:", error);
            alert("❌ Sync Failed. Check your network and backend server status.");
        } finally {
            setIsSyncing(false);
            setActiveView('scanner');
        }
    };
    
    // 🚨 INTEGRATED: Scan Function (sends data to server for verification/logging)
    const handleScan = async (qrData) => {
        if (scanResult) return; 

        let scannedStudentId, scannedBusId;
        try {
            const data = JSON.parse(qrData);
            scannedStudentId = data.studentId;
            scannedBusId = data.busId;
            
            // 1. Initial Local Check (Wrong Bus ID check)
            if (scannedBusId !== currentBusId) {
                 return triggerFeedback('Invalid', `Wrong Bus: Pass is for Bus ${scannedBusId}`, 'red', { id: scannedStudentId });
            }

        } catch (error) {
            return triggerFeedback('Invalid', 'QR Code Not Recognizable/Malformed', 'red');
        }

        let finalResult = null;
        let finalStatus = 'Error';
        let finalColor = 'red';
        let isOnline = true; // Assume online first

        // --- 2. Perform Real-Time Server Validation (for logging and primary check) ---
        try {
            const response = await fetch(`${API_BASE_URL}/verify-pass`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: scannedStudentId, busId: currentBusId }),
            });

            finalResult = await response.json();
            finalStatus = finalResult.status;
            finalColor = finalResult.color;

        } catch (error) {
            console.error('API Verification Failed (Likely Offline):', error);
            isOnline = false;
        }
        
        // --- 3. Fallback to Local/Offline Validation ---
        if (!isOnline || offlineMode) {
            if (!offlineMode) {
                 // Trigger connection error feedback if not synced
                 return triggerFeedback('Error', 'Server Offline. Please SYNC first.', 'red');
            }

            // Perform full replication of server logic using local list
            const student = localWhitelist.find(s => s.id === scannedStudentId);
            
            if (!student) {
                finalStatus = 'Invalid';
                finalColor = 'red';
                finalResult = { status: 'Invalid', message: 'Not on paid/assigned list (Offline check).' };
            } else {
                 // Check for duplicate locally based on last 5 mins (simple time check)
                const lastScan = scanLogs.find(log => log.studentId === scannedStudentId && (Date.now() - log.timestamp < 300000) && log.status === 'Valid');
                if (lastScan) {
                    finalStatus = 'Duplicate';
                    finalColor = 'yellow';
                    finalResult = { status: 'Duplicate', message: 'Scanned recently (Offline check).' };
                } else {
                    finalStatus = 'Valid';
                    finalColor = 'green';
                    finalResult = { status: 'Valid', message: `Welcome aboard, ${student.name.split(' ')[0]}! (OFFLINE)` };
                }
            }
        }
        
        // 4. Log the scan result
        setScanLogs(prev => [{ 
            studentId: scannedStudentId, 
            busId: currentBusId,
            status: finalStatus, 
            message: finalResult.message, 
            timestamp: Date.now() 
        }, ...prev]);

        // 5. Show visual feedback (Use server data if available, otherwise local data)
        triggerFeedback(finalStatus, finalResult.message, finalColor, finalResult.student);
    };

    // 🚨 NEW: Function to log the manual bus permit check
    const handleBusCheckLog = (status) => {
        setScanLogs(prev => [{
            status: 'BusCheck',
            busStatus: status, // Store the permit status
            busId: currentBusId,
            message: `Permit Status Logged: ${status}`,
            timestamp: Date.now()
        }, ...prev]);
        // 🚨 UX Improvement: Positive reinforcement for manual tasks
        alert(`✅ Logged Bus Status for ${currentBusId}. Keep up the great work!`);
    };

    // Helper function to show feedback screen
    const triggerFeedback = (status, message, color, studentInfo) => {
        setScanResult({ 
            status: status, 
            message: message, 
            color: color,
            student: studentInfo
        });
    };

    // Render logic for the Scanner View
    const renderScannerContent = () => {
        if (cameraError) {
             return (
                <div className="p-4 text-center">
                    <XCircle size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-bold text-red-600">Camera Error</h2>
                    <p className="text-gray-600">{cameraError}</p>
                    <p className="text-sm mt-2">Check browser permissions or ensure you are running on **HTTPS** (required for mobile camera).</p>
                </div>
            );
        }
        // Passes the function to switch to Manual View
        return <QrScanner onScan={handleScan} onCameraError={setCameraError} onManualEntry={() => setActiveView('manual')} currentBusId={currentBusId} />;
    }

    // --- RENDER LOGIC ---

    if (!currentConductor) {
        return <ConductorLoginPage onLogin={setCurrentConductor} />;
    }

    const renderView = () => {
        switch (activeView) {
            case 'scanner':
                return (
                    <div className="p-4">
                        <h1 className="text-2xl font-bold text-center mb-2">Scan Bus Pass</h1>
                        <p className="text-gray-600 text-center mb-4">Position the student's QR code in the frame.</p>
                        {renderScannerContent()}
                        {/* Status message for offline mode */}
                        {offlineMode && (
                            <div className='mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center font-medium'>
                                Running in Offline Mode ({localWhitelist.length} students loaded).
                            </div>
                        )}
                        {!offlineMode && (
                            <div className='mt-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg text-center font-medium'>
                                Offline Mode Disabled. Please Sync before routing.
                            </div>
                        )}
                    </div>
                );
            case 'manual':
                // Pass handleScan as onManualScan AND the new handleBusCheckLog function
                return <ManualScanView onManualScan={handleScan} onBack={() => setActiveView('scanner')} onBusCheckLog={handleBusCheckLog} currentBusId={currentBusId} />;
            case 'logs':
                return <LogsView logs={scanLogs} localWhitelist={localWhitelist} currentBusId={currentBusId} />;
            case 'sync':
                return <SyncView localWhitelist={localWhitelist} onSync={handleSync} lastSyncTime={lastSyncTime} isSyncing={isSyncing} currentBusId={currentBusId} />;
            default:
                // Default is always 'scanner' after successful login/session restore
                return <div className="p-4">Loading...</div>;
        }
    };

    return (
        <main className="w-full max-w-sm mx-auto min-h-screen bg-gray-100 flex flex-col font-sans shadow-2xl">
            <header className="bg-gray-800 text-white p-4 flex items-center justify-between">
                 <div className="flex items-center">
                    <Bus size={24} className="mr-3"/>
                    <h1 className="text-xl font-bold">SmartBus Conductor</h1>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-semibold ${offlineMode ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {currentBusId ? `Bus ${currentBusId} ${offlineMode ? '(Synced)' : '(Online)'}` : 'Logging In...'}
                </div>
                <button 
                    onClick={() => setCurrentConductor(null)} 
                    className="p-1 rounded-full text-white hover:bg-gray-700"
                    title='Log Out'
                >
                    <LogOut size={20} />
                </button>
            </header>
            <div className="flex-grow overflow-y-auto">
                {renderView()}
            </div>
            <BottomNav activeView={activeView} setActiveView={setActiveView} />
            {scanResult && <ScanResult result={scanResult} onDismiss={() => setScanResult(null)} />}
        </main>
    );
}
