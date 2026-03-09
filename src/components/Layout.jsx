import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Layout = ({ children }) => {
    const { userRole, currentUser, setUserRole, setCurrentUser } = useApp();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        setUserRole(null);
        setCurrentUser('');
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500/30">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 glass-panel border-b border-slate-700/50 rounded-none mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <span className="font-bold text-white">VM</span>
                                </div>
                                <span className="font-bold text-xl tracking-tight">Marketing Tracker</span>
                            </div>

                            {/* Navigation Links */}
                            <div className="hidden md:flex items-center gap-1">
                                {userRole === 'manager' && (
                                    <>
                                        <Link
                                            to="/manager"
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/manager') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                }`}
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/sources"
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/sources') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                }`}
                                        >
                                            Sources
                                        </Link>
                                        <Link
                                            to="/okr-setup"
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/okr-setup') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                                }`}
                                        >
                                            🎯 OKR Setup
                                        </Link>
                                    </>
                                )}
                                {userRole === 'member' && (
                                    <Link
                                        to="/tracker"
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/tracker') ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                            }`}
                                    >
                                        My Tracker
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 pl-6 border-l border-slate-700">
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-medium text-white">{currentUser}</div>
                                    <div className="text-xs text-slate-400 capitalize">{userRole}</div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-500 flex items-center justify-center">
                                    {currentUser.charAt(0)}
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="ml-2 text-slate-400 hover:text-white transition-colors"
                                    title="Logout"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {children}
            </main>
        </div>
    );
};

export default Layout;
