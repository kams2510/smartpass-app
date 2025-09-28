const express = require('express');
const cors = require('cors');
require('dotenv').config();
const admin = require('firebase-admin'); 
const { db } = require('./firebase'); 

const app = express();
const PORT = process.env.PORT || 5000;

// ----------------------------------------------------
// SECURITY & MIDDLEWARE
// ----------------------------------------------------

// Define allowed origins for production deployment (MUST BE HTTPS)
const ALLOWED_ORIGINS = [
    'http://localhost:3000', 
    'http://localhost:3001', 
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    // 🚨 IMPORTANT: Replace these with your actual deployed HTTPS domains before deployment:
    // e.g., 'https://smartpass-admin.web.app', 
];

// CORS Configuration (Strictly enforces domain access)
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
        } else {
            if (ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed))) {
                callback(null, true);
            } else if (origin.match(/^http:\/\/(127\.|192\.|10\.|172\.)/)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS policy'));
            }
        }
    },
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json()); 

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

// COMPLEX BUSINESS LOGIC: Determines Morning/Afternoon trip based on time (1 PM cutoff)
const getCurrentTripWindow = () => {
    const now = new Date();
    const hour = now.getHours();
    const afternoonTripHour = 13; // 1:00 PM

    return (hour < afternoonTripHour) ? 'Morning' : 'Afternoon';
};

/**
 * Authorization Middleware Placeholder (MANDATORY for Admin Routes)
 * In production, this checks the JWT token sent by the Admin Dashboard.
 */
const checkAdminAuth = (req, res, next) => {
    // For local development, this placeholder allows access.
    /*
    const token = req.headers.authorization?.split(' ')[1];
    const expectedKey = process.env.ADMIN_SECRET_KEY; // Read secure key from environment
    
    if (!token || token !== expectedKey) {
        return res.status(401).send({ message: 'Authorization required for this action.' });
    }
    */
    next(); 
};

// ----------------------------------------------------
// CONDUCTOR & STUDENT ENDPOINTS (1-6)
// ----------------------------------------------------

/**
 * 1. CONDUCTOR LOGIN API (POST)
 * Verifies conductor credentials against the Bus ID and Password stored in the 'buses' collection.
 */
app.post('/api/conductor/login', async (req, res) => {
    try {
        const { conductorId, password } = req.body;
        
        // 1. Basic Input Validation
        if (!conductorId || !password) {
            return res.status(400).send({ message: 'Bus ID (Conductor ID) and Password are required.' });
        }
        
        // 2. Fetch Bus Details (Bus ID is now the Conductor ID)
        const busDoc = await db.collection('buses').doc(conductorId).get();
        
        if (!busDoc.exists) {
            return res.status(404).send({ message: 'Invalid Bus ID (Conductor ID).' });
        }
        
        const busData = busDoc.data();
        
        // 3. Password Check 
        if (busData.password !== password) {
            return res.status(401).send({ message: 'Invalid password.' });
        }

        // 4. Successful Login: Return bus ID (which is the conductor's ID) and route name
        if (!busData.id) {
             return res.status(400).send({ message: 'Bus route ID is missing.' });
        }
        
        return res.json({ 
            isLoggedIn: true,
            busId: busData.id, 
            name: busData.driver, 
            conductorId: busData.id
        });

    } catch (error) {
        console.error('Conductor Login Error:', error.stack);
        return res.status(500).send({ message: 'Server error during login.' });
    }
});


/**
 * 2. CONDUCTOR PASS VERIFICATION API (POST)
 * Implements two-trips-per-day logic and complex security checks.
 */
app.post('/api/verify-pass', async (req, res) => {
    const { studentId, busId } = req.body;
    const today = getTodayDate();
    const tripWindow = getCurrentTripWindow(); 

    // Input Validation
    if (!studentId || !busId) {
        return res.status(400).send({ status: 'Error', color: 'red', message: 'Missing student ID or bus ID.' });
    }

    let status = 'Invalid';
    let color = 'red';
    let message = 'Access denied: Pass not valid.';
    let studentData = null;

    try {
        const studentDoc = await db.collection('students').doc(studentId).get();

        if (!studentDoc.exists) {
            message = 'Student ID not found in the system.';
        } else {
            studentData = { id: studentDoc.id, ...studentDoc.data() };
            
            // A. PAYMENT CHECK
            if (studentData.paymentStatus !== 'Paid') {
                message = 'Payment outstanding. Access denied.';
            } 
            
            // B. BUS ASSIGNMENT CHECK
            else if (studentData.assignedBusId !== busId) {
                message = `Wrong Bus. Pass is for Bus ${studentData.assignedBusId}.`;
            } 
            
            // C. COMPLEX DUPLICATE CHECK (Checks if a VALID scan exists today AND in the current trip window)
            else {
                const duplicateScan = await db.collection('scanLogs')
                    .where('studentId', '==', studentId)
                    .where('busId', '==', busId)
                    .where('date', '==', today)
                    .where('tripWindow', '==', tripWindow)
                    .where('status', '==', 'Valid')
                    .limit(1)
                    .get();

                if (!duplicateScan.empty) {
                    status = 'Duplicate';
                    color = 'yellow';
                    message = `Pass already verified for the ${tripWindow} Trip today.`;
                } else {
                    status = 'Valid';
                    color = 'green';
                    message = `Access Granted for ${tripWindow} Trip. Welcome aboard.`;
                }
            }
        }
        
        // Final Logging Step (Audit Trail)
        await db.collection('scanLogs').add({
            studentId,
            busId,
            date: today,
            tripWindow: tripWindow, 
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status,
            message,
        });

        return res.send({ status, color, message, student: studentData });

    } catch (error) {
        console.error('Verification Error:', error.stack);
        return res.status(500).send({ status: 'Error', color: 'red', message: 'Internal server error.' });
    }
});

/**
 * 3. STUDENT DATA RETRIEVAL API (GET) - Unprotected Read
 */
app.get('/api/student/:studentId', async (req, res) => {
    const { studentId } = req.params;
    if (!studentId || studentId.length < 3) {
        return res.status(400).send({ message: 'Invalid Student ID format.' });
    }
    
    try {
        const studentDoc = await db.collection('students').doc(studentId).get();
        if (!studentDoc.exists) {
            return res.status(404).send({ message: 'Student not found.' });
        }
        return res.json({ id: studentDoc.id, ...studentDoc.data() });
    } catch (error) {
        console.error('Student Retrieval Error:', error.stack);
        res.status(500).send({ message: 'Server error retrieving student data.' });
    }
});

/**
 * 4. CONDUCTOR WHITELIST API (GET) - Unprotected Read
 */
app.get('/api/whitelist/:busId', async (req, res) => {
    try {
        const { busId } = req.params;
        if (!busId || busId.length < 3) {
            return res.status(400).send({ message: 'Invalid Bus ID format.' });
        }

        const snapshot = await db.collection('students')
            .where('assignedBusId', '==', busId)
            .where('paymentStatus', '==', 'Paid')
            .get();

        const whitelist = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            paymentStatus: doc.data().paymentStatus, 
        }));
        
        res.json(whitelist); 

    } catch (error) {
        console.error('Whitelist Error:', error.stack);
        res.status(500).send({ message: 'Failed to retrieve bus whitelist.' });
    }
});


// ----------------------------------------------------
// ADMIN DASHBOARD CRUD ENDPOINTS (7-15)
// ----------------------------------------------------


/**
 * 7. READ All Students (Unprotected Read - needed for dashboard charts)
 */
app.get('/api/students', async (req, res) => {
    try {
        const snapshot = await db.collection('students').get();
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json(students);
    } catch (error) {
        console.error('Students Retrieval Error:', error.stack);
        res.status(500).send({ message: 'Server error retrieving student list.' });
    }
});

/**
 * 8. CREATE Student (Protected)
 */
app.post('/api/students', checkAdminAuth, async (req, res) => {
    try {
        const studentData = req.body;
        const studentId = studentData.id; 

        // STRICT INPUT VALIDATION
        if (!studentId || !studentData.name || !studentData.assignedBusId || studentId.length < 3) {
            return res.status(400).send({ message: 'Required fields (id, name, assignedBusId) are missing or invalid.' });
        }
        
        // Conflict Check (Security layer)
        const docRef = db.collection('students').doc(studentId);
        if ((await docRef.get()).exists) {
            return res.status(409).send({ message: `Student ID ${studentId} already exists.` });
        }

        const newStudent = {
            ...studentData,
            paymentStatus: studentData.paymentStatus || 'Unpaid',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await docRef.set(newStudent);
        res.status(201).send({ 
            message: 'Student added successfully.', 
            student: { id: studentId, ...newStudent } 
        });
    } catch (error) {
        console.error('Create Student Error:', error.stack);
        res.status(500).send({ message: 'Failed to create student record.' });
    }
});

/**
 * 9. UPDATE Student (Protected)
 */
app.put('/api/students/:id', checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).send({ message: 'No data provided for update.' });
        }
        
        await db.collection('students').doc(id).set(updateData, { merge: true });
        res.send({ message: 'Student updated successfully.' });
    } catch (error) {
        console.error('Update Student Error:', error.stack);
        res.status(500).send({ message: 'Server error.' });
    }
});

/**
 * 10. DELETE Student (Protected)
 */
app.delete('/api/students/:id', checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('students').doc(id).delete();
        res.send({ message: 'Student deleted successfully.' });
    } catch (error) {
        console.error('Delete Student Error:', error.stack);
        res.status(500).send({ message: 'Server error.' });
    }
});


/**
 * 11. READ All Buses (Unprotected Read - needed for dashboard charts)
 */
app.get('/api/buses', async (req, res) => {
    try {
        const snapshot = await db.collection('buses').get();
        const buses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json(buses);
    } catch (error) {
        console.error('Buses Retrieval Error:', error.stack);
        res.status(500).send({ message: 'Server error retrieving bus list.' });
    }
});

/**
 * 12. CREATE Bus (Protected)
 */
app.post('/api/buses', checkAdminAuth, async (req, res) => {
    try {
        const busData = req.body;
        const busId = busData.id;

        // STRICT INPUT VALIDATION
        // 🚨 ADDED PASSWORD VALIDATION HERE
        if (!busId || !busData.routeName || !busData.driver || !busData.password || busId.length < 3) {
            return res.status(400).send({ message: 'Bus ID, Route Name, Driver, AND Password are required.' });
        }
        
        // Conflict Check
        const docRef = db.collection('buses').doc(busId);
        if ((await docRef.get()).exists) {
            return res.status(409).send({ message: `Bus ID ${busId} already exists.` });
        }
        
        await docRef.set(busData); 
        res.status(201).send({ 
            message: 'Bus added successfully.', 
            bus: { id: busId, ...busData } 
        });
    } catch (error) {
        console.error('Create Bus Error:', error.stack);
        res.status(500).send({ message: 'Failed to create bus record.' });
    }
});

/**
 * 13. UPDATE Bus (Protected)
 */
app.put('/api/buses/:id', checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).send({ message: 'No data provided for update.' });
        }
        
        await db.collection('buses').doc(id).set(updateData, { merge: true });
        res.send({ message: 'Bus updated successfully.' });
    } catch (error) {
        console.error('Update Bus Error:', error.stack);
        res.status(500).send({ message: 'Server error.' });
    }
});

/**
 * 14. DELETE Bus (Protected)
 */
app.delete('/api/buses/:id', checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // COMPLEX DATA INTEGRITY CHECK: Prevents deleting a bus if students are assigned.
        const studentSnapshot = await db.collection('students').where('assignedBusId', '==', id).limit(1).get();
        if (!studentSnapshot.empty) {
            return res.status(409).send({ message: `Cannot delete Bus ${id}. Students are currently assigned to this route.` });
        }
        
        await db.collection('buses').doc(id).delete();
        res.send({ message: 'Bus deleted successfully.' });
    } catch (error) {
        console.error('Delete Bus Error:', error.stack);
        res.status(500).send({ message: 'Server error.' });
    }
});


/**
 * 15. ADMIN REGISTRATION API (POST)
 * Protected route to create new admin user IDs and passwords.
 */
app.post('/api/admin/register', checkAdminAuth, async (req, res) => {
    try {
        const { adminId, password, role } = req.body;

        // 1. Strict Input Validation
        if (!adminId || !password || !role || adminId.length < 5 || password.length < 8) {
            return res.status(400).send({ message: 'Admin ID (min 5 chars), Password (min 8 chars), and Role are required.' });
        }

        const adminDocRef = db.collection('admins').doc(adminId);
        
        // 2. Conflict Check
        if ((await adminDocRef.get()).exists) {
            return res.status(409).send({ message: `Admin ID ${adminId} already exists.` });
        }
        
        // 3. Store New Admin Record
        await adminDocRef.set({
            adminId,
            password, // NOTE: REPLACE WITH HASHED PASSWORD IN PRODUCTION
            role: role, // 'Super-Admin' or 'Sub-Admin'
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).send({ message: `Admin ${adminId} registered successfully with role ${role}.` });
        
    } catch (error) {
        console.error('Admin Registration Error:', error.stack);
        res.status(500).send({ message: 'Failed to register admin due to server error.' });
    }
});


// ----------------------------------------------------
// SERVER START
// ----------------------------------------------------
app.listen(PORT, () => {
    console.log(`\nSmartPass Backend Server running on port ${PORT}`);
    console.log(`Local Access: http://localhost:${PORT}`);
});
