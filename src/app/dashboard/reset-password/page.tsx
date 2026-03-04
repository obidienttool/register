import { updatePassword } from '@/app/actions/auth'
import { AlertCircle, Lock } from 'lucide-react'

export default async function ResetPassword({
    searchParams,
}: {
    searchParams: Promise<{ message: string }>
}) {
    const resolvedSearchParams = await searchParams;

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg font-inter">
                <div>
                    <div className="flex justify-center">
                        <div className="p-3 bg-green-100 rounded-full">
                            <Lock className="h-8 w-8 text-green-600" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Reset Your Password
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Please enter your new password below.
                    </p>
                </div>

                <form className="mt-8 space-y-6" action={updatePassword}>
                    {resolvedSearchParams?.message && (
                        <div className="rounded-md bg-red-50 p-4 border border-red-200">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">
                                        {resolvedSearchParams.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="rounded-md shadow-sm">
                        <div>
                            <label htmlFor="password" className="sr-only">New Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="New Password (min 6 chars)"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md transition"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
