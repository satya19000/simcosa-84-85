import { useState } from 'react'
import { motion } from 'framer-motion'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, Lock } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const provider = new GoogleAuthProvider()

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, provider)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign in failed')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0A0E27]">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#7C3AED]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#06B6D4]/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-violet-500/30"
            animate={{ boxShadow: ['0 20px 60px rgba(124,58,237,0.3)', '0 20px 60px rgba(6,182,212,0.3)', '0 20px 60px rgba(124,58,237,0.3)'] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-4xl">✦</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white">ARIA</h1>
          <p className="text-white/40 text-sm mt-1">Your AI Executive Assistant</p>
        </div>

        {/* Google Sign In */}
        <Button
          variant="ghost"
          className="w-full mb-4 border border-white/15"
          onClick={handleGoogle}
          loading={googleLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          <Button type="submit" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#7C3AED] hover:text-[#6D28D9] font-medium">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
