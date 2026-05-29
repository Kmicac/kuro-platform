'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Loader2, Shield, Monitor,
  LayoutGrid, ShieldCheck, Award,
} from 'lucide-react'
import { KuroLogo } from '@/components/kuro/logo'
import { authApi, ApiError, principalToSession } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/lib/utils'

type FormState =
  | 'idle' | 'loading' | 'error:credentials'
  | 'error:orgRequired' | 'error:forbidden'
  | 'error:network' | 'success'

const ERROR_COPY: Record<string, string> = {
  'error:credentials':  'Email o contraseña incorrectos. Verificá los datos ingresados.',
  'error:orgRequired':  'Esta cuenta requiere un slug de organización. Completá el campo opcional.',
  'error:forbidden':    'No tenés permisos para acceder. Contactá al administrador.',
  'error:network':      'No se pudo conectar con el servidor. Intentá de nuevo.',
}

const FEATURES = [
  { Icon: LayoutGrid,  title: 'Claridad operacional',     desc: 'Cada rol con la visibilidad exacta y los permisos que le corresponden.' },
  { Icon: ShieldCheck, title: 'Gobernanza segura',         desc: 'Jerarquía real de la organización, auditada y completamente trazable.' },
  { Icon: Award,       title: 'Legado técnico protegido',  desc: 'El historial técnico de cada alumno, preservado con trazabilidad de grado.' },
]

export default function LoginPage() {
  const router = useRouter()
  const hydrateSession = useAuthStore((s) => s.hydrateSession)

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [orgSlug,   setOrgSlug]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [formState, setFormState] = useState<FormState>('idle')
  const [focused,   setFocused]   = useState<string | null>(null)

  const isLoading = formState === 'loading'
  const canSubmit = Boolean(email && password && !isLoading)
  const errorMsg  = formState.startsWith('error:') ? ERROR_COPY[formState] : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setFormState('loading')
    try {
      const res = await authApi.login(email, password, orgSlug || undefined)
      // Misma transición atómica que usa el bootstrap post-F5 → el store
      // queda idéntico tanto si recién logueaste como si restauraste sesión.
      hydrateSession(principalToSession(res.accessToken, res.principal))

      const membership = res.principal.membership
      const orgId = membership?.organizationId
      if (!membership || !orgId) {
        // Usuario PUBLIC sin membership de tenant — no hay flujo público aún.
        router.replace('/login')
        return
      }

      setFormState('success')

      // Destino según scope/rol del membership:
      //  - org-wide (MESTRE / ORG_ADMIN / ORGANIZATION_WIDE) → dashboard org
      //  - branch-scoped → su filial primaria (evita el org dashboard
      //    "Restringido" que pega a analytics org-wide)
      //  - branch-scoped sin primaryBranchId → org dashboard (prompt)
      const roles = membership.assignedRoles ?? []
      const isOrgWide =
        membership.scopeType === 'ORGANIZATION_WIDE' ||
        roles.includes('MESTRE') ||
        roles.includes('ORG_ADMIN')

      if (isOrgWide) {
        router.push(`/org/${orgId}`)
      } else if (membership.primaryBranchId) {
        router.push(`/org/${orgId}/branches/${membership.primaryBranchId}`)
      } else {
        router.push(`/org/${orgId}`)
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          const msg = ((err.body as { message?: string } | null)?.message ?? '').toLowerCase()
          setFormState(msg.includes('organization') || msg.includes('slug') ? 'error:orgRequired' : 'error:credentials')
        } else if (err.status === 403) {
          setFormState('error:forbidden')
        } else {
          setFormState('error:network')
        }
      } else {
        console.error('[login] unexpected error', err)
        setFormState('error:network')
      }
    }
  }

  const borderFor = (field: string, isErr = false) => {
    if (isErr) return '#d4923a'
    if (focused === field) return '#899878'
    return '#252b25'
  }

  return (
    <div className="flex min-h-screen">

      {/* COLUMNA IZQUIERDA — Ethereal Shadow */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{ flex: '0 0 54%', position: 'relative', overflow: 'hidden', padding: '52px 52px' }}
      >
        {/* Base */}
        <div aria-hidden="true" style={{ position:'absolute', inset:0, background:'#050908', pointerEvents:'none' }} />

        {/* Orb principal — verde profundo base izquierda */}
        <div aria-hidden="true" style={{
          position:'absolute', bottom:'-20%', left:'-15%',
          width:'80%', height:'80%', borderRadius:'50%',
          background:'radial-gradient(circle at 40% 40%, rgba(30,55,22,0.55) 0%, rgba(20,40,15,0.25) 35%, transparent 70%)',
          filter:'blur(55px)', animation:'korb1 16s ease-in-out infinite',
        }} />

        {/* Orb secundario — sage superior derecha */}
        <div aria-hidden="true" style={{
          position:'absolute', top:'-5%', right:'-8%',
          width:'60%', height:'65%', borderRadius:'50%',
          background:'radial-gradient(circle at 55% 45%, rgba(55,80,42,0.28) 0%, rgba(35,55,28,0.10) 45%, transparent 70%)',
          filter:'blur(70px)', animation:'korb2 20s ease-in-out infinite',
        }} />

        {/* Orb acento — center glow sutil */}
        <div aria-hidden="true" style={{
          position:'absolute', top:'38%', left:'28%',
          width:'44%', height:'48%', borderRadius:'50%',
          background:'radial-gradient(circle at 50% 50%, rgba(137,152,120,0.09) 0%, transparent 65%)',
          filter:'blur(90px)', animation:'korb3 24s ease-in-out infinite',
        }} />

        {/* Viñeta perimetral */}
        <div aria-hidden="true" style={{
          position:'absolute', inset:0,
          background:'radial-gradient(ellipse at 45% 48%, transparent 35%, rgba(2,5,2,0.75) 100%)',
        }} />

        {/* Borde derecho sutil */}
        <div aria-hidden="true" style={{
          position:'absolute', top:'10%', right:0, bottom:'10%', width:'1px',
          background:'linear-gradient(to bottom, transparent, rgba(137,152,120,0.12) 30%, rgba(137,152,120,0.18) 60%, transparent)',
        }} />

        <style>{`
          @keyframes korb1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(22px,-28px) scale(1.06)}66%{transform:translate(-14px,18px) scale(0.95)}}
          @keyframes korb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-26px,32px) scale(1.09)}}
          @keyframes korb3{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(28px,-18px) scale(0.92)}80%{transform:translate(-18px,24px) scale(1.11)}}
          @keyframes kup{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        `}</style>

        {/* Contenido superior */}
        <div style={{ position:'relative', zIndex:1, animation:'kup .5s ease both' }}>
          <KuroLogo forceDark size="lg" />
          <p style={{ fontSize:'10px', letterSpacing:'.2em', textTransform:'uppercase', color:'#2a3828', fontWeight:500, marginTop:'8px', marginBottom:'28px' }}>
            Academy Operations
          </p>
          <div style={{ width:'34px', height:'1px', background:'linear-gradient(to right,#475c38,#899878)', marginBottom:'28px', opacity:.7 }} />
          <h1 className="font-display" style={{ fontSize:'38px', fontWeight:700, color:'#dde8d8', lineHeight:1.18, marginBottom:'16px', letterSpacing:'-.01em' }}>
            Domina la estructura<br />de tu academia.
          </h1>
          <p style={{ fontSize:'14px', color:'#4a5848', lineHeight:1.7, maxWidth:'360px' }}>
            Conducción, comunidad, gestión y legado<br />en un solo centro digital.
          </p>
        </div>

        {/* Feature cards */}
        <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:'10px' }}>
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <div key={title} style={{
              background:'rgba(137,152,120,0.04)', border:'.5px solid rgba(137,152,120,0.12)',
              borderRadius:'9px', padding:'13px 16px', display:'flex', alignItems:'flex-start', gap:'12px',
              backdropFilter:'blur(4px)', animation:'kup .55s ease both', animationDelay:`${.15 + i * .1}s`,
            }}>
              <Icon size={15} aria-hidden style={{ color:'#899878', flexShrink:0, marginTop:'2px' }} />
              <div>
                <p style={{ fontSize:'13px', fontWeight:500, color:'#b0c0a8', marginBottom:'3px' }}>{title}</p>
                <p style={{ fontSize:'12px', color:'#465040', lineHeight:1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ position:'relative', zIndex:1, fontSize:'11px', color:'#222e22', letterSpacing:'.08em' }}>
          Tecnología con raíces en el tatami.
        </p>
      </div>

      {/* COLUMNA DERECHA — Formulario */}
      <div style={{ flex:1, background:'#0b0f0b', display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 28px' }}>
        <div style={{ width:'100%', maxWidth:'400px' }}>

          <div className="flex justify-center mb-8 lg:hidden">
            <KuroLogo forceDark size="md" />
          </div>

          {/* Card */}
          <div style={{
            background:'#141918', borderRadius:'14px', padding:'36px 32px',
            border:'.5px solid #232823', borderTop:'1.5px solid #899878',
            boxShadow:'0 0 0 1px rgba(137,152,120,0.04), 0 24px 48px rgba(0,0,0,0.4)',
          }}>
            <div style={{ marginBottom:'26px' }}>
              <h2 style={{ fontSize:'20px', fontWeight:600, color:'#dde8d8', marginBottom:'5px', letterSpacing:'-.01em' }}>
                Bienvenido a KURO
              </h2>
              <p style={{ fontSize:'13px', color:'#485040', lineHeight:1.5 }}>
                Operá tu red de academias con claridad.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'15px' }}>

              <div>
                <label htmlFor="k-email" style={{ display:'block', fontSize:'10.5px', fontWeight:500, textTransform:'uppercase', letterSpacing:'.09em', color:'#485040', marginBottom:'7px' }}>Email</label>
                <input id="k-email" type="email" required autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  placeholder="instructor@academia.com"
                  style={{ width:'100%', background:'#0a0d0a', border:`.5px solid ${borderFor('email')}`, borderRadius:'8px', padding:'11px 13px', fontSize:'13px', color:'#dde8d8', outline:'none', transition:'border-color .15s' }}
                />
              </div>

              <div>
                <label htmlFor="k-pwd" style={{ display:'block', fontSize:'10.5px', fontWeight:500, textTransform:'uppercase', letterSpacing:'.09em', color:'#485040', marginBottom:'7px' }}>Contraseña</label>
                <div style={{ position:'relative' }}>
                  <input id="k-pwd" type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('pwd')} onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    style={{ width:'100%', background:'#0a0d0a', border:`.5px solid ${borderFor('pwd')}`, borderRadius:'8px', padding:'11px 42px 11px 13px', fontSize:'13px', color:'#dde8d8', outline:'none', transition:'border-color .15s' }}
                  />
                  <button type="button" aria-label={showPwd ? 'Ocultar' : 'Mostrar'} onClick={() => setShowPwd(v => !v)}
                    style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#384036', padding:0 }}>
                    {showPwd ? <EyeOff size={15} aria-hidden /> : <Eye size={15} aria-hidden />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="k-org" style={{ display:'block', fontSize:'10.5px', fontWeight:500, textTransform:'uppercase', letterSpacing:'.09em', color:'#485040', marginBottom:'7px' }}>
                  Organización <span style={{ textTransform:'none', letterSpacing:0, fontWeight:400, color:'#2e3830' }}>(opcional)</span>
                </label>
                <input id="k-org" type="text"
                  value={orgSlug} onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  onFocus={() => setFocused('org')} onBlur={() => setFocused(null)}
                  placeholder="gracie-academy"
                  style={{ width:'100%', background:'#0a0d0a', border:`.5px solid ${borderFor('org', formState === 'error:orgRequired')}`, borderRadius:'8px', padding:'11px 13px', fontSize:'13px', color:'#dde8d8', outline:'none', transition:'border-color .15s', fontFamily:'var(--font-jetbrains), monospace' }}
                />
                <p style={{ fontSize:'11px', color:'#2e3830', marginTop:'5px', lineHeight:1.5 }}>
                  Requerido solo si tu organización usa un workspace personalizado.
                </p>
              </div>

              {errorMsg && (
                <div role="alert" style={{ background:'rgba(212,88,88,0.07)', border:'.5px solid rgba(212,88,88,0.22)', borderRadius:'8px', padding:'11px 13px', fontSize:'12px', color:'#d45858', lineHeight:1.55 }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ textAlign:'right', marginTop:'-5px' }}>
                <button type="button" onClick={() => alert('Recuperación de contraseña próximamente. Contactá a tu administrador.')}
                  style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'#485040', padding:0 }}>
                  Olvidé mi contraseña
                </button>
              </div>

              <button type="submit" disabled={!canSubmit}
                className={cn(!canSubmit && 'opacity-40 cursor-not-allowed')}
                style={{ width:'100%', background:'#2d4a20', color:'#F7F7F2', border:'none', borderRadius:'8px', padding:'12px', fontSize:'14px', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'opacity .15s', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
                {isLoading
                  ? <><Loader2 size={15} className="animate-spin" aria-hidden />Ingresando...</>
                  : formState === 'success' ? 'Redirigiendo...' : 'Ingresar'
                }
              </button>
            </form>
          </div>

          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', justifyContent:'center', marginTop:'16px' }}>
            {[{ Icon: Shield, text: 'Acceso seguro de operadores' }, { Icon: Monitor, text: 'Plataforma web operativa' }].map(({ Icon, text }) => (
              <span key={text} style={{ background:'rgba(137,152,120,0.06)', border:'.5px solid rgba(137,152,120,0.12)', borderRadius:'20px', padding:'4px 11px', fontSize:'10px', color:'#485040', display:'flex', alignItems:'center', gap:'5px' }}>
                <Icon size={11} aria-hidden /> {text}
              </span>
            ))}
          </div>
          <p style={{ textAlign:'center', marginTop:'10px', fontSize:'10px', color:'#222e22', lineHeight:1.6 }}>
            Restringido al personal autorizado y operadores de la organización.
          </p>
        </div>
      </div>

    </div>
  )
}