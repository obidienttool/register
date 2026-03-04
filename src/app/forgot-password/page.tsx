import Link from 'next/link'
import { forgotPassword } from '@/app/actions/auth'
import { AlertCircle, Mail, ArrowLeft } from 'lucide-react'

export default async function ForgotPassword({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const resolvedSearchParams = await searchParams;
    const isSuccess = resolvedSearchParams?.message?.includes('Check your email');

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg font-inter">
                <div>
                    <div className="flex justify-center">
                        <div className="p-3 bg-green-100 rounded-full">
                            <Mail className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Forgot Password?
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form className="mt-8 space-y-6" action={forgotPassword}>
                    {resolvedSearchParams?.message && (
                        <div className={`rounded-md p-4 border ${isSuccess ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    {isSuccess ? (
                                        <AlertCircle className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                                <div className="ml-3">
                                    <p className={`text-sm font-medium ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
                                        {resolvedSearchParams.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email" className="sr-only">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Email Address"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md transition"
                        >
                            Send Reset Link
                        </button>
                    </div>

                    <div className="text-center">
                        <Link href="/login" className="flex items-center justify-center text-sm font-medium text-gray-600 hover:text-green-600 transition">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
