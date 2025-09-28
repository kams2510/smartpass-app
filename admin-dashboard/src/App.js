import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Home, Users, Bus, BarChart2, Settings, Plus, Edit, Trash2, X, Search, ChevronLeft, ChevronRight, Menu, Loader, Cloud, Check, Clock, XCircle, QrCode, Lock, UserPlus, LogIn, LogOut, Eye, EyeOff } from 'lucide-react';

// 🚨 Phase 4 Integration: Define the Base URL for your running backend
const API_BASE_URL = 'https://smartpass-api-318496172391.us-central1.run.app/api'; 
const ADMIN_API_KEY = 'YOUR_SECURE_ADMIN_API_KEY'; // Placeholder for future token/key security

// --- ADMIN MOCK DATABASE (Simulates Firestore Admins Collection) ---
// This list is needed on the client side for the mock login logic.
const MOCK_ADMIN_DATABASE = [
    // NOTE: Initial Super Admin credentials for testing
    { id: 'SUPER_ADMIN_001', password: 'password123', role: 'Super-Admin' },
    { id: 'SUB_ADM_001', password: 'subpassword', role: 'Sub-Admin' },
];


// --- UTILITY COMPONENTS --- //

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex items-center border-b-4" style={{ borderColor: color.replace('bg-', '') }}>
        <div className={`p-3 rounded-full mr-4 ${color} bg-opacity-20`}>
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

// Helper function to extract API Authorization headers
const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_API_KEY}`, // Placeholder for JWT/API Key
});

// ------------------------------------------------------------------------
// ADMIN LOGIN PAGE
// ------------------------------------------------------------------------

const LoginPage = ({ onLogin }) => {
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // MOCK AUTHENTICATION against local list
        const admin = MOCK_ADMIN_DATABASE.find(a => a.id === adminId && a.password === password);

        if (admin) {
            onLogin(admin);
        } else {
            setError('Invalid Admin ID or Password.');
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
                <div className="text-center">
                    <Lock className="mx-auto h-12 w-auto text-blue-600" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                        Admin Login
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Sign in to manage SmartBus system
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 border dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500"
                            placeholder="Admin ID (e.g., SUPER_ADMIN_001)"
                            value={adminId}
                            onChange={(e) => setAdminId(e.target.value)}
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

// ------------------------------------------------------------------------
// DASHBOARD & MANAGEMENT VIEWS
// ------------------------------------------------------------------------

const DashboardView = ({ students, buses }) => {
    const safeStudents = students || []; 
    const safeBuses = buses || [];
    
    // Data Analysis
    const studentsPaid = safeStudents.filter(s => s.paymentStatus === 'Paid').length;
    const studentsUnpaid = safeStudents.length - studentsPaid;
    
    const busOccupancy = safeBuses.map(bus => ({
        name: bus.id,
        students: safeStudents.filter(s => s.assignedBusId === bus.id).length, 
        capacity: bus.capacity,
    }));

    const feeData = [
        { name: 'Paid', value: studentsPaid },
        { name: 'Unpaid', value: studentsUnpaid },
    ];
    const COLORS = ['#10b981', '#ef4444']; // Green/Red

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">System Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Students" value={safeStudents.length} icon={<Users className="text-blue-500" />} color="bg-blue-500" />
                <StatCard title="Total Buses" value={safeBuses.length} icon={<Bus className="text-orange-500" />} color="bg-orange-500" />
                <StatCard title="Fees Paid" value={studentsPaid} icon={<Check className="text-green-500" />} color="bg-green-500" />
                <StatCard title="Fees Unpaid" value={studentsUnpaid} icon={<XCircle className="text-red-500" />} color="bg-red-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Bus Occupancy Levels</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={busOccupancy}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.5)" />
                            <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                            <YAxis tick={{ fill: '#6b7280' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} cursor={{ fill: 'rgba(75, 85, 99, 0.3)' }} />
                            <Legend />
                            <Bar dataKey="students" fill="#3b82f6" name="Current Students" />
                            <Bar dataKey="capacity" fill="#e5e7eb" name="Total Capacity" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Fee Payment Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={feeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {feeData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const StudentManagementView = ({ students, buses, refreshStudents, addStudent, editStudent, deleteStudent, isLoading }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const safeStudents = students || [];

    const handleEdit = (student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    };
    
    // 🚨 FIX: Used correct parameter student.id instead of undefined studentId
    const handleDelete = (studentId) => {
        if (window.confirm(`Are you sure you want to delete student ${studentId}? This action cannot be undone.`)) {
            deleteStudent(studentId);
        }
    };
    
    const handleSaveStudent = async (studentData) => {
        if (editingStudent) {
            await editStudent(studentData);
        } else {
            await addStudent(studentData);
        }
        setEditingStudent(null);
        setIsModalOpen(false);
        refreshStudents(); 
    };

    const filteredStudents = safeStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              student.id.toLowerCase().includes(searchTerm.toLowerCase()); 
        const matchesStatus = filterStatus === 'all' || 
                              (filterStatus === 'paid' && student.paymentStatus === 'Paid') || 
                              (filterStatus === 'unpaid' && student.paymentStatus !== 'Paid');
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Student Management</h2>
                <button 
                    onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 flex items-center transition shadow-md"
                >
                    <Plus size={18} className="mr-2" /> Add New Student
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <select 
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="paid">Fees Paid</option>
                        <option value="unpaid">Fees Unpaid</option>
                    </select>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center p-10 bg-white rounded-xl shadow-lg">
                    <Loader size={40} className="animate-spin mx-auto text-blue-500 mb-4" />
                    <p className="text-lg text-gray-600">Loading student data from Firestore...</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Name / Dept</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Student ID</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Bus</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Payment Status</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedStudents.map(student => (
                                <tr key={student.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <td className="p-4 text-gray-800 dark:text-white">
                                        <div className="font-semibold">{student.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{student.department || 'N/A'}</div>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-300">{student.id}</td> 
                                    <td className="p-4 text-gray-600 dark:text-gray-300">{student.assignedBusId}</td> 
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${student.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                            {student.paymentStatus || 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-2">
                                        <button onClick={() => handleEdit(student)} className="p-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700 rounded-full transition"><Edit size={18} /></button>
                                        <button onClick={() => handleDelete(student.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-gray-700 rounded-full transition"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex justify-between items-center mt-4">
                <span className="text-gray-600 dark:text-gray-400">
                    Showing {paginatedStudents.length} of {filteredStudents.length} students
                </span>
                <div className="flex gap-2">
                    <button onClick={handlePrevPage} disabled={currentPage === 1} className="p-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-gray-700 rounded-lg"><ChevronLeft size={20} /></button>
                    <span className="p-2 text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
                    <button onClick={handleNextPage} disabled={currentPage === totalPages} className="p-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200 dark:bg-gray-700 rounded-lg"><ChevronRight size={20} /></button>
                </div>
            </div>

            {isModalOpen && <StudentFormModal student={editingStudent} buses={buses} onSave={handleSaveStudent} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

const StudentFormModal = ({ student, buses, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: student?.name || '',
        id: student?.id || '', 
        department: student?.department || '', // New field
        assignedBusId: student?.assignedBusId || '', 
        paymentStatus: student?.paymentStatus || 'Unpaid',
        stop: student?.stop || '',
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? (checked ? 'Paid' : 'Unpaid') : value 
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.id || !formData.assignedBusId || !formData.name) {
            alert("Student ID, Name, and Bus must be filled.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w_lg p-6 m-4">
                <div className="flex justify-between items-center border-b dark:border-gray-700 pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{student ? 'Edit Student' : 'Add New Student'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student ID (Key)</label>
                            <input 
                                type="text" 
                                name="id" 
                                value={formData.id} 
                                onChange={handleChange} 
                                className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                                required 
                                disabled={!!student} 
                                placeholder="e.g., S001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                            <input 
                                type="text" 
                                name="department" 
                                value={formData.department} 
                                onChange={handleChange} 
                                className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                                placeholder="e.g., CSE"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bus</label>
                            <select name="assignedBusId" value={formData.assignedBusId} onChange={handleChange} className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required>
                                <option value="">Select a bus</option>
                                {buses && buses.map(bus => <option key={bus.id} value={bus.id}>{bus.id} - {bus.routeName}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bus Stop / Locality</label>
                            <input type="text" name="stop" value={formData.stop} onChange={handleChange} className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div className="md:col-span-2 flex items-center pt-2">
                            <input 
                                type="checkbox" 
                                name="paymentStatus" 
                                checked={formData.paymentStatus === 'Paid'} 
                                onChange={handleChange} 
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                            />
                            <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300 font-semibold">Fees Paid (Check to set status to 'Paid')</label>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-3 rounded-xl hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 shadow-md">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ------------------------------------------------------------------------
// BUS MANAGEMENT VIEW (Simplified to display live status)
// ------------------------------------------------------------------------

const BusManagementView = ({ buses, students, isLoadingBuses, addBus, editBus, deleteBus }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBus, setEditingBus] = useState(null);
    const [showPassword, setShowPassword] = useState({}); // New state to manage password visibility per bus
    const safeBuses = buses || [];
    const safeStudents = students || [];

    const handleSaveBus = async (busData) => {
        if (editingBus) {
            await editBus(busData);
        } else {
            await addBus(busData);
        }
        setEditingBus(null);
        setIsModalOpen(false);
    };

    const handleEdit = (bus) => {
        setEditingBus(bus);
        setIsModalOpen(true);
    };

    const handleDelete = (busId) => {
        const studentCount = safeStudents.filter(s => s.assignedBusId === busId).length;
        if (studentCount > 0) {
            alert(`Cannot delete Bus ${busId}. ${studentCount} students are currently assigned to this bus. Please reassign them first.`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete Bus ${busId}?`)) {
            deleteBus(busId);
        }
    };

    const togglePasswordVisibility = (busId) => {
        setShowPassword(prev => ({
            ...prev,
            [busId]: !prev[busId] // Toggle visibility for this specific bus ID
        }));
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Bus Management</h2>
                <button 
                    onClick={() => { setEditingBus(null); setIsModalOpen(true); }}
                    className="bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 flex items-center transition shadow-md"
                >
                    <Plus size={18} className="mr-2" /> Add New Bus
                </button>
            </div>
            
            {isLoadingBuses ? (
                <div className="text-center p-10 bg-white rounded-xl shadow-lg">
                    <Loader size={40} className="animate-spin mx-auto text-blue-500 mb-4" />
                    <p className="text-lg text-gray-600">Loading bus data from Firestore...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {safeBuses.map(bus => {
                        const currentStudents = safeStudents.filter(s => s.assignedBusId === bus.id).length;
                        const occupancyPercent = (currentStudents / bus.capacity) * 100;
                        const statusColor = occupancyPercent > 90 ? 'bg-red-500' : occupancyPercent > 60 ? 'bg-orange-500' : 'bg-green-500';
                        const statusTextColor = occupancyPercent > 90 ? 'text-red-500' : occupancyPercent > 60 ? 'text-orange-500' : 'text-green-500';
                        const isPasswordSet = !!bus.password;

                        return (
                            <div key={bus.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-t-4" style={{borderColor: bus.color}}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{bus.id}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{bus.routeName}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(bus)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full transition"><Edit size={16} /></button>
                                        <button onClick={() => handleDelete(bus.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full transition"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                
                                <div className="space-y-1 text-sm">
                                    <p><span className="font-medium text-gray-700 dark:text-gray-300">Driver:</span> {bus.driver}</p>
                                    <p className="flex items-center"><Bus size={14} className="mr-2 text-gray-500" /> <span className="font-medium">Capacity:</span> {bus.capacity} seats</p>
                                    {/* 🚨 UPDATED: Password Display with Toggle */}
                                    <p className="flex items-center justify-between">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Login Password:</span> 
                                        <span className='flex items-center'>
                                            {isPasswordSet ? (
                                                <span className='mr-2 font-mono text-xs'>
                                                    {showPassword[bus.id] ? bus.password : '••••••••'}
                                                </span>
                                            ) : (
                                                <span className='text-red-500 font-medium mr-2'>Not Set</span>
                                            )}
                                            {isPasswordSet && (
                                                <button 
                                                    type='button' // Prevents form submission errors
                                                    onClick={() => togglePasswordVisibility(bus.id)}
                                                    className="text-gray-500 hover:text-gray-800 p-1 rounded-full"
                                                >
                                                    {showPassword[bus.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            )}
                                        </span>
                                    </p>
                                </div>

                                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                    <p className="font-bold text-lg flex items-center">
                                        <Users size={18} className={`mr-2 ${statusTextColor}`} />
                                        {currentStudents} / {bus.capacity}
                                    </p>
                                    <p className={`text-xs font-semibold mt-1 ${statusTextColor}`}>
                                        Occupancy: {occupancyPercent.toFixed(0)}%
                                    </p>
                                    <div className="w-full h-1 mt-2 rounded-full" style={{ backgroundColor: '#e5e7eb' }}>
                                        <div className={`h-1 rounded-full ${statusColor}`} style={{ width: `${Math.min(occupancyPercent, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}


            {isModalOpen && <BusFormModal bus={editingBus} onSave={handleSaveBus} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

const BusFormModal = ({ bus, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: bus?.id || '',
        routeName: bus?.routeName || '',
        driver: bus?.driver || '',
        capacity: bus?.capacity || 50,
        color: bus?.color || '#3b82f6', // Default blue
        password: bus?.password || '', // NEW: Conductor Password field
    });
    const [showPassword, setShowPassword] = useState(false);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.id || !formData.routeName || !formData.driver || !formData.password) {
            alert("All fields, including Password, are required.");
            return;
        }
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w_md p-6 m-4">
                <div className="flex justify-between items-center border-b dark:border-gray-700 pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{bus ? 'Edit Bus' : 'Add New Bus'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bus ID (Key)</label>
                            <input 
                                type="text" 
                                name="id" 
                                value={formData.id} 
                                onChange={handleChange} 
                                disabled={!!bus} 
                                className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                                required 
                                placeholder="e.g., B101"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Route Name</label>
                            <input type="text" name="routeName" value={formData.routeName} onChange={handleChange} className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Driver Name</label>
                            <input type="text" name="driver" value={formData.driver} onChange={handleChange} className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Capacity</label>
                            <input type="number" name="capacity" value={formData.capacity} onChange={handleChange} className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Route Color (Hex)</label>
                            <input type="color" name="color" value={formData.color} onChange={handleChange} className="mt-1 block h-10 w-full border dark:border-gray-600 rounded-md shadow-sm p-1 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                         {/* 🚨 NEW: Password Field for Conductor Login */}
                        <div className='relative'>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Conductor Login Password</label>
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                                className="mt-1 block w-full border dark:border-gray-600 rounded-md shadow-sm p-2 pr-10 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                                required
                                placeholder="Password conductor uses to login"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(prev => !prev)}
                                className='absolute right-2 top-8 text-gray-500 hover:text-gray-800'
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-3 rounded-xl hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 shadow-md">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ------------------------------------------------------------------------
// REPORTS VIEW (Updated for production-ready concept)
// ------------------------------------------------------------------------

const ReportsView = ({ students, buses }) => {
    // NOTE: In a real app, this data would come from the scanLogs collection on the server.
    const [selectedBusId, setSelectedBusId] = useState('');
    const safeStudents = students || [];
    const safeBuses = buses || [];

    // Set default bus ID on initial load if buses are available
    useEffect(() => {
        if (safeBuses.length > 0 && !selectedBusId) {
            setSelectedBusId(safeBuses[0].id);
        }
    }, [safeBuses, selectedBusId]);

    // Filter students for the selected bus for reporting
    const studentsOnBus = selectedBusId 
        ? safeStudents.filter(s => s.assignedBusId === selectedBusId) 
        : safeStudents;

    // Mock Data based on the filtered student list
    const totalScans = 154; // Placeholder
    const uniqueRidership = studentsOnBus.length; 
    const invalidScans = totalScans - studentsOnBus.length; 

    const recentScanData = [
        { hour: '8 AM', scans: 45 },
        { hour: '9 AM', scans: 30 },
        { hour: '1 PM', scans: 25 },
        { hour: '2 PM', scans: 40 },
    ];

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Live Operations Reports</h2>
            
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg flex justify-between items-center">
                <label className="text-lg font-medium text-gray-700 dark:text-gray-300 mr-4">Select Bus:</label>
                <select
                    value={selectedBusId}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    className="px-4 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Buses</option>
                    {safeBuses.map(bus => (
                        <option key={bus.id} value={bus.id}>Bus {bus.id} - {bus.routeName}</option>
                    ))}
                </select>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title={`Total Scans Today (${selectedBusId || 'All'})`} value={totalScans} icon={<QrCode size={24} className="text-blue-500" />} color="bg-blue-500" />
                <StatCard title="Unique Ridership" value={uniqueRidership} icon={<Users size={24} className="text-purple-500" />} color="bg-purple-500" />
                <StatCard title="Invalid Scans" value={invalidScans} icon={<XCircle size={24} className="text-red-500" />} color="bg-red-500" />
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Scans by Time Window (Today)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={recentScanData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="scans" fill="#8884d8" name="Successful Scans" radius={[10, 10, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};


// ------------------------------------------------------------------------
// SETTINGS VIEW (Updated for production-ready concepts)
// ------------------------------------------------------------------------

// 🚨 NEW COMPONENT: Admin User Management Modal
const AdminFormModal = ({ onClose, onSave }) => {
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Sub-Admin');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!adminId || !password) {
            setError("Admin ID and Password are required.");
            return;
        }
        onSave({ adminId, password, role });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w_md p-6 m-4">
                <div className="flex justify-between items-center border-b dark:border-gray-700 pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center"><UserPlus size={20} className='mr-2' /> Add New Admin</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"><X size={24} /></button>
                </div>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin ID</label>
                        <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} placeholder="Unique ID (e.g., ADM002)" className="mt-1 block w-full border rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full border rounded-md shadow-sm p-2 bg-white dark:bg-gray-700 focus:ring-blue-500">
                             <option value="Super-Admin">Super Admin (Full Access)</option>
                             <option value="Sub-Admin">Sub-Admin (Limited Access)</option>
                        </select>
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl">Create Admin</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const SettingsView = ({ currentAdmin }) => {
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [admins, setAdmins] = useState(MOCK_ADMIN_DATABASE); // Use MOCK data for display/simulation
    
    // 🚨 Logic to register a new admin (connects to backend)
    const handleRegisterAdmin = async (adminData) => {
        try {
             // 1. API Call: POST /api/admin/register
             const response = await fetch(`${API_BASE_URL}/admin/register`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(adminData),
            });

            const responseData = await response.json();

            if (response.status === 409) {
                alert(`Error: Admin ID ${adminData.adminId} already exists.`);
                return;
            }
            if (!response.ok) {
                 throw new Error(responseData.message || 'Server returned an unknown error.');
            }
            
             // Update local list (Simulated success)
             const newAdmin = { id: adminData.adminId, role: adminData.role };
             setAdmins(prev => [...prev, newAdmin]);

             alert(`Admin ${adminData.adminId} created successfully!`);
             setIsAdminModalOpen(false);

        } catch (error) {
            console.error('Admin Registration Error:', error);
            alert(`Failed to register admin: ${error.message}. Check the backend connection or console.`);
        }
    };
    
    // Role-Based Access Control: Only the SUPER_ADMIN can see the management panel
    const isSuperAdmin = currentAdmin.role === 'Super-Admin';

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">System Settings & Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Admin Management Card (Visible only to Super Admin) */}
                {isSuperAdmin && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg md:col-span-3">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                                <Lock size={20} className='mr-3 text-red-500' /> Admin Access Control
                            </h3>
                            <button
                                onClick={() => setIsAdminModalOpen(true)}
                                className="bg-red-600 text-white px-4 py-2 rounded-xl flex items-center hover:bg-red-700"
                            >
                                <UserPlus size={18} className='mr-2' /> New Admin
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-3">Admin ID</th>
                                        <th className="p-3">Role</th>
                                        <th className="p-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {admins.map(admin => (
                                        <tr key={admin.id} className="border-b dark:border-gray-700">
                                            <td className="p-3 font-semibold">{admin.id} {admin.id === currentAdmin.id && '(You)'}</td>
                                            <td className={`p-3 font-medium ${admin.role === 'Super-Admin' ? 'text-purple-600' : 'text-blue-600'}`}>{admin.role}</td>
                                            <td className="p-3">
                                                {admin.id !== currentAdmin.id && (
                                                    <button className="text-red-500 hover:text-red-700 p-1" title="Delete Admin">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                
                {/* API Status Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
                        <Cloud size={24} className="mr-3 text-blue-500" /> API Connection Status
                    </h3>
                    <div className="space-y-3">
                        <p className="flex justify-between items-center text-sm">
                            <span className="font-medium">Backend URL:</span> 
                            <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded">http://localhost:5000</code>
                        </p>
                        <p className="flex justify-between items-center text-sm">
                            <span className="font-medium">Database:</span> 
                            <span className="flex items-center text-green-600 font-semibold"><Check size={16} className="mr-1" /> Firestore (Live)</span>
                        </p>
                        <p className="flex justify-between items-center text-sm">
                            <span className="font-medium">Last Sync:</span> 
                            <span className="text-gray-500 flex items-center"><Clock size={14} className="mr-1" /> Just now</span>
                        </p>
                        <button className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-xl hover:bg-gray-300">
                            Force Data Refresh
                        </button>
                    </div>
                </div>

                {/* Configuration Card */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-xl mb-4 text-gray-800 dark:text-white">System Configuration</h3>
                    <div className="space-y-3">
                         <div className="flex justify-between items-center text-sm">
                            <label className="font-medium text-gray-700 dark:text-gray-300">Trips Per Day:</label>
                            <span className="font-semibold text-blue-600">2 (Morning/Afternoon)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <label className="font-medium text-gray-700 dark:text-gray-300">Default Bus Capacity:</label>
                            <span className="font-semibold">50</span>
                        </div>
                        <p className="text-xs text-gray-500 pt-2">Note: Global settings are managed directly in the backend code for security.</p>
                    </div>
                </div>
            </div>
            {isAdminModalOpen && <AdminFormModal onClose={() => setIsAdminModalOpen(false)} onSave={handleRegisterAdmin} />}
        </div>
    );
};


// --- MAIN APP COMPONENT (Refactored for Login) --- //

const App = () => {
    const [currentAdmin, setCurrentAdmin] = useState(null); // Holds { id, role } if logged in
    const [activeView, setActiveView] = useState('dashboard');
    const [students, setStudents] = useState(null); 
    const [buses, setBuses] = useState(null); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    const [isLoadingBuses, setIsLoadingBuses] = useState(true);
    
    // 🚨 API Base URL (Crucial for integration)
    const API_BASE_URL = 'http://localhost:5000/api'; 


    // ----------------------------------------------------------------
    // DATA FETCHING & CRUD FUNCTIONS (Integrated Logic)
    // ----------------------------------------------------------------
    
    // STUDENT FUNCTIONS
    const fetchStudents = useCallback(async () => {
        setIsLoadingStudents(true);
        try {
            const response = await fetch(`${API_BASE_URL}/students`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
            const data = await response.json();
            setStudents(data); 
        } catch (error) {
            console.error('Failed to load students:', error);
            alert(`Failed to connect to backend API at ${API_BASE_URL}. Ensure server is running.`);
            setStudents([]);
        } finally {
            setIsLoadingStudents(false);
        }
    }, []);

    const addStudent = async (newStudent) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newStudent),
            });
            if (!response.ok) throw new Error('Failed to add student');
            await response.json();
            fetchStudents(); 
        } catch (error) {
            console.error('Error adding student:', error);
            alert(`Error creating student: ${error.message}`);
        }
    };

    const editStudent = async (updatedStudent) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${updatedStudent.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedStudent),
            });
            if (!response.ok) throw new Error('Failed to update student');
            fetchStudents(); 
        } catch (error) {
            console.error('Error updating student:', error);
            alert(`Error updating student: ${error.message}`);
        }
    };

    const deleteStudent = async (studentId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!response.ok) throw new Error('Failed to delete student');

            setStudents(prev => prev.filter(s => s.id !== studentId));
            
        } catch (error) {
            console.error('Error deleting student:', error);
            alert(`Error deleting student: ${error.message}`);
        }
    };


    // BUS FUNCTIONS
    const fetchBuses = useCallback(async () => {
        setIsLoadingBuses(true);
        try {
            const response = await fetch(`${API_BASE_URL}/buses`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error(`Failed to fetch buses: ${response.statusText}`);
            const data = await response.json();
            setBuses(data);
        } catch (error) {
            console.error('Failed to load buses:', error);
            alert(`Failed to connect to backend API at ${API_BASE_URL}. Ensure server is running.`);
            setBuses([]);
        } finally {
            setIsLoadingBuses(false);
        }
    }, []);

    const addBus = async (newBus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/buses`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newBus),
            });
            if (!response.ok) throw new Error('Failed to add bus');
            await response.json();
            fetchBuses(); 
        } catch (error) {
            console.error('Error adding bus:', error);
            alert(`Error creating bus: ${error.message}`);
        }
    };

    const editBus = async (updatedBus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/buses/${updatedBus.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedBus),
            });
            if (!response.ok) throw new Error('Failed to update bus');
            fetchBuses(); 
        } catch (error) {
            console.error('Error updating bus:', error);
            alert(`Error updating bus: ${error.message}`);
        }
    };

    const deleteBus = async (busId) => {
        if (!window.confirm('Are you sure you want to delete this bus?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/buses/${busId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!response.ok) throw new Error('Failed to delete bus');

            fetchBuses(); 
        } catch (error) {
            console.error('Error deleting bus:', error);
            alert(`Error deleting bus: ${error.message}`);
        }
    };


    // Load data on initial component mount
    useEffect(() => {
        // Load session from localStorage
        const storedAdmin = localStorage.getItem('smartbusAdmin');
        if (storedAdmin) {
            try {
                setCurrentAdmin(JSON.parse(storedAdmin));
            } catch (e) {
                console.error("Failed to parse admin session:", e);
                localStorage.removeItem('smartbusAdmin');
            }
        }
    }, []);

    // Save session to localStorage when admin state changes
    useEffect(() => {
        if (currentAdmin) {
            localStorage.setItem('smartbusAdmin', JSON.stringify(currentAdmin));
            // Fetch initial data immediately after successful login/session load
            fetchStudents();
            fetchBuses();
        } else {
            localStorage.removeItem('smartbusAdmin');
            // Clear data if logged out
            setStudents(null);
            setBuses(null);
            setIsLoadingStudents(true);
            setIsLoadingBuses(true);
        }
    }, [currentAdmin, fetchStudents, fetchBuses]); 


    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); 
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // --- Render Logic ---
    
    // 🚨 1. Show Login Page if not authenticated
    if (!currentAdmin) {
        return <LoginPage onLogin={setCurrentAdmin} />;
    }

    // 🚨 2. Show Dashboard if authenticated
    const renderView = () => {
        const studentsLoading = isLoadingStudents || students === null;
        const busesLoading = isLoadingBuses || buses === null;

        if (studentsLoading || busesLoading) {
            return (
                <div className="text-center p-20 bg-white rounded-xl shadow-lg">
                    <Loader size={60} className="animate-spin mx-auto text-blue-500 mb-6" />
                    <h2 className="text-xl font-bold text-gray-700">Loading System Data...</h2>
                    <p className="text-gray-500">Connecting to database and fetching records.</p>
                </div>
            );
        }

        switch (activeView) {
            case 'dashboard': return <DashboardView students={students} buses={buses} />;
            case 'students': return (
                <StudentManagementView 
                    students={students} 
                    buses={buses} 
                    isLoading={isLoadingStudents}
                    refreshStudents={fetchStudents} 
                    addStudent={addStudent} 
                    editStudent={editStudent} 
                    deleteStudent={deleteStudent} 
                />
            );
            case 'buses': return ( 
                <BusManagementView 
                    buses={buses} 
                    students={students}
                    isLoadingBuses={isLoadingBuses}
                    addBus={addBus} 
                    editBus={editBus} 
                    deleteBus={deleteBus} 
                />
            );
            case 'reports': return <ReportsView students={students} buses={buses} />;
            case 'settings': return <SettingsView currentAdmin={currentAdmin} />; // Pass currentAdmin for RBAC
            default: return <DashboardView students={students} buses={buses} />;
        }
    };
    
    const NavLink = ({ view, icon, children }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`w-full flex items-center py-3 px-4 text-left rounded-xl transition-colors ${activeView === view ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
        >
            {icon}
            <span className="ml-3">{children}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {/* Sidebar */}
            <aside className={`bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0 overflow-hidden'} flex-shrink-0`}>
                <div className="p-4 border-b dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
                        <Bus className="mr-2 text-blue-600" /> SmartBus
                    </h1>
                </div>
                <nav className="p-4 space-y-2">
                    <NavLink view="dashboard" icon={<Home size={20} />}>Dashboard</NavLink>
                    <NavLink view="students" icon={<Users size={20} />}>Students</NavLink>
                    <NavLink view="buses" icon={<Bus size={20} />}>Buses</NavLink>
                    <NavLink view="reports" icon={<BarChart2 size={20} />}>Reports</NavLink>
                    <NavLink view="settings" icon={<Settings size={20} />}>Settings</NavLink>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-600 dark:text-gray-300 md:hidden">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center">
                        <span className="mr-4 font-semibold text-sm">{currentAdmin.role} ({currentAdmin.id})</span>
                        <button 
                            onClick={() => setCurrentAdmin(null)} 
                            className="p-2 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
                            title="Log Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default App;
