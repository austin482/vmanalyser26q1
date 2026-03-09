import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const OKRDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [okr, setOkr] = React.useState(null);

    React.useEffect(() => {
        // Load OKR from localStorage
        const savedOKRs = JSON.parse(localStorage.getItem('austina_okrs') || '[]');
        const foundOkr = savedOKRs.find(o => o.id === id);
        setOkr(foundOkr);
    }, [id]);

    if (!okr) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50">
            {/* Navigation */}
            <nav className="border-b border-stone-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                                <span className="font-bold text-white text-xl">A</span>
                            </div>
                            <span className="font-bold text-2xl text-stone-900 tracking-tight">Austina</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link to="/okr" className="px-4 py-2 text-amber-600 font-medium">
                                🎯 OKR
                            </Link>
                            <Link to="/vm" className="px-4 py-2 text-stone-600 hover:text-amber-600 transition-colors">
                                📊 VM
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/okr')}
                    className="mb-6 flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors font-medium"
                >
                    ← Back to OKRs
                </button>

                {/* OKR Header */}
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="text-amber-600 font-medium text-sm mb-2">{okr.quarter}</div>
                            <h1 className="text-3xl font-bold text-stone-900 mb-2">{okr.objective}</h1>
                            <div className="text-stone-600">
                                <span className="font-semibold text-stone-700">BU:</span> {okr.buName}
                            </div>
                            {okr.owners && (
                                <div className="text-stone-600 mt-1">
                                    <span className="font-semibold text-stone-700">Owners:</span> {okr.owners}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Key Results */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-stone-900">Key Results</h2>

                    {okr.keyResults.map((kr, index) => (
                        <div key={kr.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-amber-600 font-bold">KR {index + 1}</span>
                                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium border border-amber-200">
                                            {kr.category}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {kr.pic && (
                                            <div>
                                                <div className="text-stone-500 text-sm">PIC</div>
                                                <div className="text-stone-900 font-medium">{kr.pic}</div>
                                            </div>
                                        )}
                                        {kr.ratio && (
                                            <div>
                                                <div className="text-stone-500 text-sm">Ratio</div>
                                                <div className="text-stone-900 font-medium">{kr.ratio}</div>
                                            </div>
                                        )}
                                        {kr.target && (
                                            <div className="col-span-2">
                                                <div className="text-stone-500 text-sm">Target</div>
                                                <div className="text-stone-900 font-medium">{kr.target}</div>
                                            </div>
                                        )}
                                        {kr.projection && (
                                            <div>
                                                <div className="text-stone-500 text-sm">Projection</div>
                                                <div className="text-stone-900 font-medium">{kr.projection}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Metrics */}
                            {kr.metrics && kr.metrics.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-stone-100">
                                    <div className="text-stone-500 text-sm mb-2">Metrics</div>
                                    <ul className="space-y-2">
                                        {kr.metrics.map((metric, mIndex) => (
                                            <li key={mIndex} className="flex items-start gap-2 text-stone-600">
                                                <span className="text-amber-500 mt-1">•</span>
                                                <span>{metric}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OKRDetailPage;
