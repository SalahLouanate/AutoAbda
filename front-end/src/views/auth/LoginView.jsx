import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Quote, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function LoginView() {
  const auth = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe]     = useState(true)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre e-mail et votre mot de passe.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/login', {
        email: email.trim(),
        password,
      })

      const { token, user } = response.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      if (auth?.login) {
        auth.login(user)
      }

      const role = user.role?.toLowerCase()
      if (role === 'technicien') {
        navigate('/technicien/dashboard')
      } else if (role === 'reception' || role === 'receptionniste') {
        navigate('/reception/dashboard')
      } else {
        navigate('/direction/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants invalides')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans">
      {/* ─────────────────────────────────────────────────────────────
          PANNEAU GAUCHE — Visuel Premium & Branding Renault SAV (Desktop)
      ───────────────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col relative w-1/2 h-full bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=2074&auto=format&fit=crop')",
        }}
      >
        {/* Overlay sombre riche */}
        <div className="absolute inset-0 bg-slate-900/80 pointer-events-none" />

        {/* Disposition interne */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 lg:p-16">
          {/* En-tête : Logo Renault blanc + Branding */}
          <div className="flex items-center gap-4">
            <img src="/logo_renault.png" alt="Renault" className="h-10 w-auto brightness-0 invert" />
            <div className="h-7 w-px bg-white/20" />
            <span className="text-white text-2xl font-bold tracking-wide">
              Auto Abda - SAV
            </span>
          </div>

          {/* Bas : Citation inspirante */}
          <div>
            <Quote className="w-12 h-12 text-blue-400 mb-6 fill-blue-400/20" />
            <p className="text-3xl font-light leading-snug text-white mb-8">
              « L'excellence opérationnelle et la rigueur au service de chaque véhicule. Un diagnostic précis, une prise en charge exemplaire. »
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold text-sm">
                SAV
              </div>
              <div>
                <p className="text-white font-bold text-base">Service Après-Vente</p>
                <p className="text-slate-400 text-sm">Réseau Renault Garages</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PANNEAU DROIT — Le Formulaire Ultra-Moderne
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 w-full lg:w-1/2 h-full flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        
        {/* La Carte Ultra-Moderne */}
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-2xl w-full max-w-lg border border-slate-100 my-auto">
          
          {/* En-tête de carte avec le logo Renault */}
          <div className="mb-10">
            <img src="/logo_renault.png" alt="Renault" className="h-12 w-auto mb-4" />
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
              Connexion
            </h1>
            <p className="text-slate-500 text-lg font-normal">
              Accédez à votre espace de gestion atelier
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>

            {/* Field: Email */}
            <div>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 block">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="size-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="exemple@autoabda.ma"
                  className="w-full h-16 text-lg bg-slate-50 border-2 border-slate-200 rounded-xl pl-14 pr-4 font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-300 outline-none"
                  required
                />
              </div>
            </div>

            {/* Field: Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Mot de passe
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault()
                    alert('Veuillez contacter votre administrateur atelier.')
                  }}
                  className="text-blue-600 font-semibold hover:text-blue-700 transition text-sm"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <Lock className="size-6 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••"
                  className="w-full h-16 text-lg bg-slate-50 border-2 border-slate-200 rounded-xl pl-14 pr-14 font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all duration-300 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
                </button>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="flex items-center justify-between my-1">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded-md text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className="text-slate-600 font-medium text-base">Se souvenir de moi</span>
              </label>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Bouton de Connexion Massif */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99] mt-2"
            >
              {loading ? (
                <span>Connexion en cours…</span>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="size-6" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  )
}
