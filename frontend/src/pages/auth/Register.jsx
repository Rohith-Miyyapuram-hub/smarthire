import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import useAuthStore from '../../store/authStore'
import api from '../../services/api'

const ROLES = [
  { value: 'candidate', emoji: '👤', label: "I'm looking for jobs" },
  { value: 'recruiter', emoji: '🏢', label: "I'm hiring"            },
]

function Register() {
  const navigate  = useNavigate()
  const loginUser = useAuthStore((state) => state.login)

  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'candidate' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.name.trim())                      e.name     = 'Full name is required'
    if (!form.email)                             e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email))  e.email    = 'Enter a valid email'
    if (!form.password)                          e.password = 'Password is required'
    else if (form.password.length < 8)           e.password = 'Minimum 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const { mutate, isPending, error: apiError } = useMutation({
    mutationFn: (data) => api.post('/auth/register', data),
    onSuccess: (res) => {
      loginUser(res.data.user, res.data.token)
      navigate(`/${res.data.user.role}`)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) mutate(form)
  }

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-2xl mb-4 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SmartHire</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered recruiting, simplified</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Create an account</h2>
          <p className="text-sm text-gray-500 mb-5">Join SmartHire — it's free</p>

          {/* Role toggle */}
          <div className="flex gap-2 mb-6">
            {ROLES.map(({ value, emoji, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, role: value }))}
                className={[
                  'flex-1 py-3 px-2 rounded-xl text-sm font-medium border transition-all text-center',
                  form.role === value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300',
                ].join(' ')}
              >
                <span className="text-base mr-1">{emoji}</span> {label}
              </button>
            ))}
          </div>

          {/* API error */}
          {apiError && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              {apiError.response?.data?.message || 'Something went wrong. Please try again.'}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Alex Johnson"
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />

            <Button type="submit" loading={isPending} className="w-full mt-2">
              Create account
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400 mt-4 leading-relaxed">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>

          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
