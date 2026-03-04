import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { AlertCircle } from 'lucide-react'

export default async function Login({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const resolvedSearchParams = await searchParams;
    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to Register
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-medium text-green-600 hover:text-green-500 transition">
                            Sign up
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" action={login}>
                    {resolvedSearchParams?.message && (
                        <div className="rounded-md bg-red-50 p-4 border border-red-200">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{resolvedSearchParams.message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="identifier" className="sr-only">Email or Phone Number</label>
                            <input
                                name="identifier"
                                type="text"
                                required
                                className="appearance-none rounded-md rounded-t-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Email or Phone Number"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-md rounded-b-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end">
                        <div className="text-sm">
                            <Link href="/forgot-password" size="sm" className="font-medium text-green-600 hover:text-green-500">
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md transition"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
