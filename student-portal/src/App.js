import React, { useState, useEffect, useRef } from 'react';
import { Bus, User, LogIn, Mail, MessageSquare, Loader, Download } from 'lucide-react'; 

// 🚨 Phase 4 Integration: Define the Base URL for your running backend
// NOTE: MUST be updated to your HTTPS URL when deployed!
const API_BASE_URL = 'https://smartpass-api-318496172391.us-central1.run.app/api'; 

// School Logo URL (Always displayed)
const SCHOOL_LOGO_URL = "https://ssmiet.ac.in/images/logo.png";

// A simple QR code generator API
const generateQrCodeUrl = (data) => {
    // We now pass the studentId (ID) and Bus ID from the live data
    const qrData = JSON.stringify({ studentId: data.id, busId: data.assignedBusId });
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
};

// Tool to render a React component onto a canvas for image sharing
// This function will rely on html2canvas (installed via npm install html2canvas) in a deployed environment.
const renderToCanvas = (ref, studentId) => { 
    // This is the CRITICAL integration function for image capture
    return new Promise((resolve) => {
        if (!ref.current) return resolve(null);

        // 🚨 IMPORTANT: In production, uncomment the html2canvas logic:
        /*
        html2canvas(ref.current, {
            scale: 2, 
            useCORS: true, 
        }).then(canvas => {
            resolve(canvas.toDataURL('image/png'));
        }).catch(error => {
            console.error("HTML2Canvas Capture Error:", error);
            resolve(null);
        });
        */
        
        // --- DEVELOPMENT FALLBACK (Returns blank image data URI) ---
        console.warn("Using blank Base64 placeholder. Install 'html2canvas' and deploy to capture the full visual pass.");
        resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADfwGQJmJ33wAAAABJRU5ErkJggg=="); 
    });
};


// --- UI COMPONENTS --- //

const LoginPage = ({ onLogin, isLoading, loginError }) => {
    const [studentId, setStudentId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        
        // Fetch student details via API call
        if (studentId.trim() !== '' && password.trim() !== '') {
            onLogin(studentId.trim()); 
        } else {
            setError('Please enter your Student ID and password.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-md">
                <div className="text-center">
                    <Bus className="mx-auto h-12 w-auto text-blue-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Student Portal
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sign in to view your bus pass
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="student-id" className="sr-only">Student ID</label>
                        <input
                            id="student-id"
                            name="student-id"
                            type="text"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Student ID (e.g., S001)"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Password (Not validated by API)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {loginError && <p className="text-sm text-red-600">{loginError}</p>} 
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 mr-2" />
                                    Sign in
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const PassView = ({ student, onLogout }) => {
    const passRef = useRef(null);
    const downloadLinkRef = useRef(null); 

    // Generate QR code URL using data fields from Firestore
    const qrCodeUrl = generateQrCodeUrl(student); 

    // Determine color and status based on data
    const isPaid = student.paymentStatus === 'Paid';
    const passColor = isPaid ? student.busColor || '#10b981' : '#dc2626'; 
    const feesStatusText = isPaid ? 'VALID PASS' : 'PAYMENT DUE';
    const feesStatusBg = isPaid ? 'bg-green-600' : 'bg-red-600';


    const handleShare = async (platform) => {
        // Capture the full pass URI 
        const passImageUri = await renderToCanvas(passRef, student.id); 

        if (!passImageUri || passImageUri.startsWith("data:image/png;base64,iVBORw0KGgoAAA")) {
             alert("Cannot share: Image capture requires deployment (html2canvas). Please use the Download button first.");
             return;
        }

        const passInfo = [
            `🚌 SmartBus Pass - ${student.name} (${student.department || 'N/A'})`,
            `Student ID: ${student.id}`,
            `Assigned Bus: ${student.assignedBusId} (${student.stop || 'N/A'})`,
            `Status: ${feesStatusText}`,
            
            // Include a direct link to the QR code image for the recipient to view/scan
            `\n[SCANNING QR CODE IMAGE]`,
            `${qrCodeUrl}`,
        ].join('\n'); 

        if (platform === 'whatsapp') {
            alert("For WhatsApp, please use the Download button first, then share the saved image file manually.");
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(passInfo)}`, '_blank');
        } else if (platform === 'email') {
            const body = `
                <h1>SmartBus Pass for ${student.name}</h1>
                <p>Student ID: ${student.id} (${student.department || ''})</p>
                <p>Bus: ${student.assignedBusId} | Status: ${feesStatusText}</p>
                <img src="${qrCodeUrl}" alt="Bus Pass QR Code">
                <p>Please use this pass for bus verification.</p>
            `;
            window.location.href = `mailto:?subject=My SmartBus Pass (Digital Pass)&body=${encodeURIComponent(body)}&ishtml=1`;
        }
    };
    
    // Function to trigger the image download (Captures the entire card component)
    const handleDownloadPass = async () => {
        // Calls the full pass capture logic, which returns a Base64 URI (the full pass card)
        const passImageUri = await renderToCanvas(passRef, student.id); 
        
        if (downloadLinkRef.current && passImageUri) {
            downloadLinkRef.current.href = passImageUri;
            downloadLinkRef.current.download = `SmartPass_${student.id}_Pass.png`; 
            downloadLinkRef.current.click(); 
            alert("Download initiated. Check your downloads folder.");
        } else {
            alert("Download failed. The pass image could not be generated. See console for error.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            {/* The ref is attached to this main card for image capture */}
            <div ref={passRef} className="w-full max-w-sm rounded-2xl shadow-lg bg-white overflow-hidden transform transition-all duration-300">
                
                {/* Header with Bus Color / Status */}
                <div className={`p-4 text-white text-center ${feesStatusBg}`} style={{ backgroundColor: isPaid ? passColor : feesStatusBg }}>
                    <div className="flex justify-between items-center w-full">
                        <img
                            className="w-8 h-8 p-1 bg-white rounded-full object-contain"
                            src={SCHOOL_LOGO_URL}
                            alt="SSM Logo"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/32x32/000000/FFFFFF?text=L'; }}
                        />
                        <h1 className="text-xl font-bold">SMART BUS PASS</h1>
                        <div className="w-8"></div> {/* Spacer */}
                    </div>
                    <p className="font-medium text-lg mt-2">{feesStatusText}</p>
                </div>

                {/* Main Content */}
                <div className="p-6 flex flex-col items-center">
                    
                    {/* QR Code */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-inner border border-gray-200">
                        <img id="qr-code-img" src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                    </div>
                    <p className="mt-2 text-xs text-gray-400">Scan for verification</p>

                    {/* Student Details */}
                    <h2 className="mt-6 text-2xl font-semibold text-gray-800">{student.name}</h2>
                    <p className="text-gray-500">{student.id}</p>
                    
                    {student.department && <p className="text-sm text-gray-600 font-medium mt-1">Dept: {student.department}</p>} 
                    
                    {/* Bus Details */}
                    <div className="mt-4 w-full text-center p-3 border-t border-gray-200">
                        <p className="text-sm text-gray-700 font-semibold">Bus No: {student.assignedBusId}</p>
                        <p className="text-xs text-gray-500">{student.stop || "Stop data unavailable"}</p>
                    </div>
                </div>
            </div>

            {/* Share and Download Buttons */}
            <div className="mt-6 w-full max-w-sm space-y-3 p-4 bg-white rounded-xl shadow-lg">
                <button 
                    onClick={handleDownloadPass}
                    className="w-full flex items-center justify-center py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600"
                >
                    <Download size={16} className="mr-2"/> Download Full Pass (PNG)
                </button>
                <div className="flex space-x-3">
                    <button onClick={() => handleShare('whatsapp')} className="w-full flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600">
                        <MessageSquare size={16} className="mr-2"/> Share (WhatsApp)
                    </button>
                    <button onClick={() => handleShare('email')} className="w-full flex-1 flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-500 hover:bg-gray-600">
                        <Mail size={16} className="mr-2"/> Share (Email)
                    </button>
                </div>
            </div>
            
            {/* Hidden download anchor tag */}
            <a ref={downloadLinkRef} style={{ display: 'none' }} href="#"/>

            <button
                onClick={onLogout}
                className="mt-4 text-sm text-gray-500 hover:text-blue-600"
            >
                Log out
            </button>
        </div>
    );
};


// --- MAIN APP COMPONENT (Refactored) --- //
const App = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // --- Session Management ---
    useEffect(() => {
        const storedUser = localStorage.getItem('smartbusStudent');
        if (storedUser) {
            try {
                // Instantly load user data and bypass login screen
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse student session:", e);
                localStorage.removeItem('smartbusStudent');
            }
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            // Save session upon successful fetch or restore
            localStorage.setItem('smartbusStudent', JSON.stringify(currentUser));
        } else {
            // Clear session upon logout
            localStorage.removeItem('smartbusStudent');
        }
    }, [currentUser]);


    // 🚨 Function to fetch data from the live backend
    const fetchStudentData = async (studentId) => {
        setIsLoading(true);
        setLoginError('');
        setCurrentUser(null); 

        try {
            const response = await fetch(`${API_BASE_URL}/student/${studentId}`);

            if (response.status === 404) {
                setLoginError('Login failed: Student ID not found in the system.');
                setIsLoading(false);
                return;
            }
            
            if (!response.ok) {
                if (response.status === 0 || response.type === 'error') {
                    setLoginError('Network Error: Cannot connect to server. Ensure your Node.js backend is running on port 5000.');
                    setIsLoading(false);
                    return;
                }
                
                setLoginError(`Server Error (${response.status}): Check backend console for details.`);
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            
            if (!data.name || !data.assignedBusId) {
                 setLoginError('Student record is incomplete. Contact admin.');
                 setIsLoading(false);
                 return;
            }
            setCurrentUser(data); 

        } catch (error) {
            console.error("Connection Error:", error);
            setLoginError('Connection Error: Failed to reach http://localhost:5000. Is the smartpass-backend running?');
        }
        setIsLoading(false);
    };


    if (!currentUser) {
        return (
            <LoginPage 
                onLogin={fetchStudentData} 
                isLoading={isLoading}
                loginError={loginError}
            />
        );
    }

    return <PassView student={currentUser} onLogout={() => setCurrentUser(null)} />;
};

export default App;
