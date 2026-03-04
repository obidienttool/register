'use client'

import { useState, useEffect, Suspense } from 'react'
import { getStates, getLgas, getWards, getPollingUnits } from '@/app/actions/locations'
import { signup } from '@/app/actions/auth'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

type LocationOptions = { id: number; name: string }[]

function SignupForm() {
    const searchParams = useSearchParams()
    const errorMsg = searchParams.get('message')

    const [states, setStates] = useState<LocationOptions>([])
    const [lgas, setLgas] = useState<LocationOptions>([])
    const [wards, setWards] = useState<LocationOptions>([])
    const [pollingUnits, setPollingUnits] = useState<{ id: number; name: string; code: string }[]>([])

    const [selectedState, setSelectedState] = useState('')
    const [selectedLga, setSelectedLga] = useState('')
    const [selectedWard, setSelectedWard] = useState('')

    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        getStates().then(setStates).catch(console.error)
    }, [])

    useEffect(() => {
        if (selectedState) {
            getLgas(parseInt(selectedState)).then(setLgas).catch(console.error)
            setLgas([])
            setWards([])
            setPollingUnits([])
            setSelectedLga('')
            setSelectedWard('')
        }
    }, [selectedState])

    useEffect(() => {
        if (selectedLga) {
            getWards(parseInt(selectedLga)).then(setWards).catch(console.error)
            setWards([])
            setPollingUnits([])
            setSelectedWard('')
        }
    }, [selectedLga])

    useEffect(() => {
        if (selectedWard) {
            getPollingUnits(parseInt(selectedWard)).then(setPollingUnits).catch(console.error)
            setPollingUnits([])
        }
    }, [selectedWard])

    return (
        <>
            {errorMsg && (
                <div className="rounded-md bg-red-50 p-4 border border-red-200 mb-6">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <p className="text-sm font-medium text-red-800">{errorMsg}</p>
                    </div>
                </div>
            )}

            <form action={signup} className="space-y-6" onSubmit={() => setIsLoading(true)}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input name="full_name" type="text" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500" placeholder="John Doe" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input name="phone" type="tel" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500" placeholder="08012345678" />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input name="password" type="password" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500" placeholder="Minimum 6 characters" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <select name="state_id" required value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 bg-white">
                            <option value="" disabled>{states.length > 0 ? 'Select State' : 'No states found (Seed DB)'}</option>
                            {states.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                        </select>
                        {states.length === 0 && (
                            <p className="mt-1 text-xs text-red-500">
                                Location data is missing. Please run the seeder script.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Local Government</label>
                        <select name="lga_id" required value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)} disabled={!selectedState} className="w-full disabled:bg-gray-100 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 bg-white">
                            <option value="" disabled>Select LGA</option>
                            {lgas.map((lga) => <option key={lga.id} value={lga.id}>{lga.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ward</label>
                        <select name="ward_id" required value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} disabled={!selectedLga} className="w-full disabled:bg-gray-100 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 bg-white">
                            <option value="" disabled>Select Ward</option>
                            {wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Polling Unit</label>
                        <select name="polling_unit_id" required disabled={!selectedWard} className="w-full disabled:bg-gray-100 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 bg-white">
                            <option value="" disabled>Select Polling Unit</option>
                            {pollingUnits.map((pu) => <option key={pu.id} value={pu.id}>{pu.code ? `${pu.code} - ` : ''}{pu.name}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 mt-6 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
                >
                    {isLoading ? 'Registering...' : 'Sign Up'}
                </button>
            </form>
        </>
    )
}

export default function SignupPage() {
    return (
        <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gray-50 flex justify-center">
            <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Create an Account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Join the Obidient Movement. Already registered?{' '}
                        <Link href="/login" className="font-medium text-green-600 hover:text-green-500">Log in</Link>
                    </p>
                </div>
                <Suspense fallback={<div className="text-center">Loading form...</div>}>
                    <SignupForm />
                </Suspense>
            </div>
        </div>
    )
}
