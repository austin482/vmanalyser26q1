import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const LoginPage = () => {
    const { setUserRole, setCurrentUser } = useApp();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [showPasswordInput, setShowPasswordInput] = useState(false);

    const handleMemberLogin = () => {
        setUserRole('member');
        setCurrentUser('Member'); // Generic user
        navigate('/tracker');
    };

    const handleManagerLogin = (e) => {
        e.preventDefault();
        if (password === '8888') {
            setUserRole('manager');
            setCurrentUser('Manager');
            navigate('/manager');
        } else {
            alert('Incorrect Password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
            <div className="glass-panel p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4">
                        <span className="font-bold text-white text-2xl">VM</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
                    <p className="text-slate-400 mt-2">Sign in to Austina</p>
                </div>

                <div className="space-y-6">
                    {/* Member Login */}
                    {!showPasswordInput && (
                        <div className="space-y-4">
                            <button
                                onClick={handleMemberLogin}
                                className="w-full p-4 rounded-xl border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 transition-all group text-left"
                            >
                                <div className="font-bold text-blue-400 group-hover:text-blue-300">Member Access</div>
                                <div className="text-sm text-slate-400">Submit proposals and track results</div>
                            </button>

                            <button
                                onClick={() => setShowPasswordInput(true)}
                                className="w-full p-4 rounded-xl border border-purple-500/30 bg-purple-600/10 hover:bg-purple-600/20 transition-all group text-left"
                            >
                                <div className="font-bold text-purple-400 group-hover:text-purple-300">Manager Access</div>
                                <div className="text-sm text-slate-400">Review campaigns and manage sources</div>
                            </button>
                        </div>
                    )}

                    {/* Manager Password Input */}
                    {showPasswordInput && (
                        <form onSubmit={handleManagerLogin} className="space-y-4 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Enter Manager Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field text-center tracking-widest text-lg"
                                    placeholder="••••"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordInput(false)}
                                    className="flex-1 btn-secondary"
                                >
                                    Back
                                </button>
                                <button type="submit" className="flex-1 btn-primary bg-purple-600 hover:bg-purple-500">
                                    Login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
