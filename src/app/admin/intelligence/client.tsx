'use client'

import { useState, useTransition } from 'react'
import { checkRateLimitAndGenerate } from '@/app/actions/intelligence'
import { Brain, AlertOctagon, TrendingUp, TrendingDown, Target, MessageSquareCode, ShieldAlert, Cpu } from 'lucide-react'

export default function AIIntelligenceClient({ initialCache, liveRiskFlags }: { initialCache: any, liveRiskFlags: any }) {
    const [isPending, startTransition] = useTransition()
    const [report, setReport] = useState<any>(initialCache?.ai_response || null)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [lastUpdate, setLastUpdate] = useState<string>(initialCache ? new Date(initialCache.created_at).toLocaleString() : 'Never')

    const handleGenerate = () => {
        if (!confirm('Generating a new AI report heavily consumes processing power and operates strictly under Daily quotas. Continue?')) return
        setErrorMsg(null)
        startTransition(async () => {
            try {
                const res = await checkRateLimitAndGenerate()
                if (!res.success) {
                    setErrorMsg(res.error || 'Cognitive engine failed to return strategy mapping.')
                } else {
                    setReport(res.aiAnalysis)
                    setLastUpdate(new Date().toLocaleString())
                }
            } catch (e: any) {
                setErrorMsg(e.message)
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        <Cpu className="w-6 h-6 text-indigo-600" /> Strategic Analysis Layer
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Utilizes Deep Data Aggregation running explicitly through LLM Models mapping network strengths, liabilities, and SMS performance indices.
                    </p>
                    <p className="text-xs text-indigo-600 font-mono mt-2 bg-indigo-50 px-2 py-1 rounded inline-block">
                        Last Run: {lastUpdate}
                    </p>
                </div>
                <div className="mt-4 md:mt-0">
                    <button
                        disabled={isPending}
                        onClick={handleGenerate}
                        className="bg-indigo-600 font-bold hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition disabled:opacity-50 shadow-sm"
                    >
                        {isPending ? <span className="animate-pulse">Aggregating Nodes...</span> : <><Brain className="w-5 h-5" /> Generate Intelligence Report</>}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-wider font-bold">Max 5 Generation Cycles / Day</p>
                </div>
            </div>

            {/* Pre-AI Live Risk Hardware Checks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg border border-red-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lagging LGAs (&lt;20% Verif)</p>
                    <p className="text-2xl font-black text-red-600">{liveRiskFlags?.lgas_sub_20_percent_verified?.length || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Empty Polling Units (0 Team)</p>
                    <p className="text-2xl font-black text-orange-500">{liveRiskFlags?.pus_with_zero_team_members || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-yellow-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Inactive Coordinators (30d)</p>
                    <p className="text-2xl font-black text-yellow-600">{liveRiskFlags?.inactive_coordinators_last_30_days || 0}</p>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 flex items-center shadow-sm">
                    <AlertOctagon className="h-6 w-6 text-red-500 mr-2 shrink-0" />
                    <p className="text-red-700 font-medium text-sm">{errorMsg}</p>
                </div>
            )}

            {!report && !isPending && (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-500">Awaiting Aggregation</h3>
                    <p className="text-sm text-gray-400">Click Generate to compile thousands of Data nodes instantly into actionable regional strategy.</p>
                </div>
            )}

            {report && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">

                    {/* Strengths */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-green-100 flex flex-col h-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            <TrendingUp className="w-5 h-5 text-green-600" /> Key Structural Strengths
                        </h3>
                        <ul className="space-y-3 flex-1 overflow-y-auto">
                            {report.strengths?.map((s: string, i: number) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">•</span> <span>{s}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100 flex flex-col h-full relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            <TrendingDown className="w-5 h-5 text-red-500" /> Critical Weaknesses
                        </h3>
                        <ul className="space-y-3 flex-1 overflow-y-auto">
                            {report.weaknesses?.map((w: string, i: number) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span> <span>{w}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Risk Alerts */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-100 lg:col-span-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            <ShieldAlert className="w-5 h-5 text-yellow-600" /> Priority Risk Alerts
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {report.risk_alerts?.map((r: string, i: number) => (
                                <div key={i} className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm text-yellow-900 flex items-start gap-2">
                                    <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0 text-yellow-600" />
                                    <span>{r}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommended Actions */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-indigo-100 lg:col-span-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-2">
                            <Target className="w-5 h-5 text-indigo-600" /> AI Recommended Actions
                        </h3>
                        <div className="space-y-4">
                            {report.recommended_actions?.map((a: string, i: number) => (
                                <div key={i} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="bg-indigo-100 text-indigo-700 font-black h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1.5 font-medium">{a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Suggested SMS Copy */}
                    {report.suggested_sms_copy && (
                        <div className="bg-gray-900 p-6 rounded-lg shadow-sm border border-black lg:col-span-2 relative overflow-hidden text-white">
                            <h3 className="font-bold text-gray-100 mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                                <MessageSquareCode className="w-5 h-5 text-blue-400" /> Suggested Engagement SMS Copy
                            </h3>
                            <div className="bg-black p-4 rounded font-mono text-green-400 text-sm italic tracking-wide">
                                "{report.suggested_sms_copy}"
                            </div>
                            <div className="mt-4 flex justify-end">
                                <a href="/admin/sms" className="bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2 rounded font-bold transition">Proceed to Broadcast Gateway &rarr;</a>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
