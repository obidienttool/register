import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-white text-gray-800 px-4">
      <div className="max-w-3xl text-center space-y-6">
        <h1 className="text-5xl font-extrabold text-green-700 tracking-tight">
          Obidient State Register
        </h1>
        <p className="text-xl text-gray-600">
          A structured political membership management system organized by State, Local Government, Ward, and Polling Unit.
        </p>
        <div className="flex gap-4 justify-center pt-8">
          <Link
            href="/signup"
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Join the Movement <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-3 bg-white text-green-700 border-2 border-green-600 rounded-lg font-semibold hover:bg-green-50 transition"
          >
            Member Login
          </Link>
        </div>
      </div>
    </div>
  )
}
