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
    const [age, setAge] = useState<number>(0)
    const [isRegisteredVoter, setIsRegisteredVoter] = useState<boolean | null>(null)

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
                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input name="full_name" type="text" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500" placeholder="John Doe" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500"
                            placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input name="phone" type="tel" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500" placeholder="08012345678" />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input name="password" type="password" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500" placeholder="Minimum 6 characters" />
                    </div>

                    {/* Eligibility & Voter Status - ASK THESE FIRST */}
                    <div className="sm:col-span-2 border-t pt-4 mt-2">
                        <label className="block text-sm font-bold text-gray-900 mb-1">Step 1: Eligibility & Voter Info</label>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">How old are you?</label>
                        <input
                            name="age"
                            type="number"
                            required
                            min="1"
                            max="120"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500"
                            placeholder="Your current age"
                            value={age > 0 ? age : ''}
                            onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                        />
                    </div>

                    {age >= 18 && (
                        <>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Are you a registered voter?</label>
                                <div className="space-x-4 flex items-center">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="is_registered_voter"
                                            value="true"
                                            required
                                            className="mr-2 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            checked={isRegisteredVoter === true}
                                            onChange={() => setIsRegisteredVoter(true)}
                                        />
                                        <span className="text-sm">Yes</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="is_registered_voter"
                                            value="false"
                                            required
                                            className="mr-2 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                            checked={isRegisteredVoter === false}
                                            onChange={() => setIsRegisteredVoter(false)}
                                        />
                                        <span className="text-sm">No</span>
                                    </label>
                                </div>
                            </div>

                            {isRegisteredVoter === false && (
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Do you need help registering as a voter?</label>
                                    <div className="space-x-4 flex items-center">
                                        <label className="flex items-center cursor-pointer">
                                            <input type="radio" name="needs_registration_help" value="true" required className="mr-2 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500" />
                                            <span className="text-sm">Yes</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input type="radio" name="needs_registration_help" value="false" required className="mr-2 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500" />
                                            <span className="text-sm">No</span>
                                        </label>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {age > 0 && age < 18 && (
                        <div className="sm:col-span-2 bg-blue-50 p-4 rounded-md border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> You will be eligible to register when you turn 18.
                            </p>
                            <input type="hidden" name="is_under_18" value="true" />
                        </div>
                    )}

                    {/* Step 2: Location Selection */}
                    <div className="sm:col-span-2 border-t pt-4 mt-2">
                        <label className="block text-sm font-bold text-gray-900 mb-1">Step 2: Your Location & Polling Unit</label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <select name="state_id" required value={selectedState} onChange={(e) => setSelectedState(e.target.value)} className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 bg-white">
                            <option value="" disabled>{states.length > 0 ? 'Select State' : 'No states found'}</option>
                            {states.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
                        </select>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {age >= 18
                                ? (isRegisteredVoter ? 'Your Registered Polling Unit' : 'Your Intended Polling Unit')
                                : 'Base Polling Unit'
                            }
                        </label>
                        <select name="polling_unit_id" required disabled={!selectedWard} className="w-full disabled:bg-gray-100 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-green-500 bg-white">
                            <option value="" disabled>Select Polling Unit</option>
                            {pollingUnits.map((pu) => <option key={pu.id} value={pu.id}>{pu.code ? `${pu.code}-` : ''}{pu.name}</option>)}
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 mt-6 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition shadow-sm"
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
