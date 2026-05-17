import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from '@tanstack/react-router'
import { Logo } from '@/components/layout/Logo'
import { cn } from '@/lib/utils'
import { MODEL_OPTIONS } from '@/data/model-options'

const TOTAL_STEPS = 7

const MODEL_COLORS: Record<string, { icon: string; color: string }> = {
  openai: { icon: '⬡', color: '#10a37f' },
  openrouter: { icon: '◈', color: '#5b6ee1' },
  openrelay: { icon: '◎', color: '#c48a2a' },
  ollama: { icon: '⌂', color: '#6b7280' },
  custom: { icon: '⚙', color: '#8b5cf6' },
}
const DEFAULT_MODEL_VISUAL = { icon: '⚙', color: '#8b5cf6' }

const SEARCH_PROVIDERS = [
  { id: 'brave', name: 'Brave Search', desc: '免费额度充足', emoji: '🦁' },
  { id: 'tavily', name: 'Tavily', desc: '专为模型检索优化', emoji: '🔍' },
] as const

const SAMPLE_PROJECTS = [
  { id: 's1', emoji: '🦀', title: '系统学习 Rust', desc: '6 周从零到能写 CLI 工具', tags: ['编程', '6周'] },
  { id: 's2', emoji: '📊', title: 'PMP 备考 30 天', desc: '结合 PMBOK 的冲刺计划', tags: ['备考', '30天'] },
  { id: 's3', emoji: '🧠', title: '机器学习入门', desc: '数学→理论→实战三段式', tags: ['ML', '12周'] },
] as const

function OnboardProgress({ step }: { step: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex-1 h-[3px] rounded-full transition-colors duration-normal',
            i < step ? 'bg-primary' : i === step ? 'bg-accent' : 'bg-border',
          )}
        />
      ))}
    </div>
  )
}

function SelectCard({ selected, onClick, children, wide }: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  wide?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border-2 cursor-pointer select-none transition-all duration-fast ease-spring',
        wide ? 'px-5 py-3.5' : 'p-[18px]',
        selected
          ? 'border-primary bg-accent scale-[1.02] shadow-sm'
          : 'border-border bg-surface hover:border-fg-3 hover:bg-bg-2',
      )}
    >
      {children}
    </div>
  )
}

export function OnboardingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [lang, setLang] = useState('zh')
  const [theme, setTheme] = useState('system')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [testState, setTestState] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle')
  const [selectedSample, setSelectedSample] = useState<string | null>(null)

  function complete() {
    navigate({ to: '/' })
  }

  function testConnection() {
    setTestState('testing')
    setTimeout(() => setTestState('ok'), 1800)
  }

  function getNextDisabled(): boolean {
    if (step === 3) return !privacyAgreed
    const selectedModel = MODEL_OPTIONS.find((model) => model.id === provider)
    if (step === 4) return !provider || (selectedModel?.providerId !== 'ollama' && testState !== 'ok')
    return false
  }

  function getNextLabel(): string {
    if (step === 0) return t('onboarding.welcome.cta')
    if (step === 5) return t('onboarding.search.skip')
    if (step === TOTAL_STEPS - 1) {
      return selectedSample ? t('onboarding.example.importSample') : t('onboarding.example.createOwn')
    }
    return step === TOTAL_STEPS - 1 ? t('onboarding.finish') : t('common.next') + ' →'
  }

  function handleLanguageChange(newLang: string) {
    setLang(newLang)
    i18n.changeLanguage(newLang === 'zh' ? 'zh-CN' : 'en-US')
  }

  const PRIVACY_ITEMS = [
    { icon: '🔒', textKey: 'onboarding.privacy.local' },
    { icon: '🔑', textKey: 'onboarding.privacy.keychain' },
    { icon: '📤', textKey: 'onboarding.privacy.noMeta' },
  ]

  const DATA_FLOW = [
    { icon: '💻', labelKey: 'onboarding.privacy.device', subKey: 'onboarding.privacy.deviceSub' },
    { icon: '🔑', labelKey: 'onboarding.privacy.api', subKey: 'onboarding.privacy.apiSub' },
    { icon: '✦', labelKey: 'onboarding.privacy.provider', subKey: 'onboarding.privacy.providerSub' },
  ]

  return (
    <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center p-8">
      {/* Top: progress */}
      <div className="w-full max-w-[520px] mb-10">
        <div className="flex justify-between items-center mb-2.5">
          <Logo />
          {step > 0 && (
            <button onClick={complete} className="text-[11px] text-fg-3 hover:text-fg-2 transition-colors">
              {t('onboarding.skipAll')}
            </button>
          )}
        </div>
        <OnboardProgress step={step} />
      </div>

      {/* Content */}
      <div key={step} className="w-full max-w-[520px] animate-slide-up">
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center flex flex-col items-center gap-5">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" fill="var(--accent-bg)" />
              <circle cx="40" cy="40" r="12" fill="var(--accent)" opacity="0.85" />
              <ellipse cx="40" cy="40" rx="32" ry="13" stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="4 2.5" opacity="0.5" />
              <ellipse cx="40" cy="40" rx="22" ry="8" stroke="var(--accent)" strokeWidth="1.5" fill="none" opacity="0.3" />
              <circle cx="68" cy="28" r="4" fill="var(--accent)" opacity="0.7" />
              <circle cx="14" cy="54" r="2.5" fill="var(--accent)" opacity="0.5" />
              <circle cx="72" cy="58" r="2" fill="var(--text-3)" opacity="0.6" />
              <circle cx="10" cy="30" r="1.5" fill="var(--text-3)" opacity="0.5" />
            </svg>
            <div>
              <h1 className="font-display text-[32px] font-bold text-foreground tracking-[-0.5px] mb-2.5">
                {t('onboarding.welcome.title')}
              </h1>
              <p className="text-base text-fg-2 leading-[1.65] max-w-[380px]">
                {t('onboarding.welcome.subtitle')}
              </p>
            </div>
            <p className="text-xs text-fg-3 mt-1">{t('onboarding.welcome.timeHint')}</p>
          </div>
        )}

        {/* Step 1: Language */}
        {step === 1 && (
          <div className="flex flex-col gap-4 max-w-[400px] mx-auto">
            <h2 className="text-xl font-bold text-foreground font-display tracking-[-0.3px] text-center mb-2">
              {t('onboarding.language.title')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'zh', flag: '🇨🇳', name: '简体中文', sub: 'Simplified Chinese' },
                { id: 'en', flag: '🇺🇸', name: 'English', sub: '英文界面' },
              ].map((l) => (
                <SelectCard key={l.id} selected={lang === l.id} onClick={() => handleLanguageChange(l.id)}>
                  <div className="text-center">
                    <div className="text-[32px] mb-2">{l.flag}</div>
                    <div className="text-sm font-semibold text-foreground mb-[3px]">{l.name}</div>
                    <div className="text-[11px] text-fg-3">{l.sub}</div>
                  </div>
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Theme */}
        {step === 2 && (
          <div className="flex flex-col gap-4 max-w-[480px] mx-auto">
            <h2 className="text-xl font-bold text-foreground font-display tracking-[-0.3px] text-center mb-2">
              {t('onboarding.theme.title')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'light', label: t('settings.themes.warm'), bg: '#faf8f4', sidebar: '#f3ede3' },
                { id: 'dark', label: '深色', bg: '#1c1410', sidebar: '#231a14' },
                { id: 'system', label: t('settings.themes.system'), bg: 'linear-gradient(135deg,#faf8f4 50%,#1c1410 50%)', sidebar: '#f3ede3' },
              ].map((th) => (
                <SelectCard key={th.id} selected={theme === th.id} onClick={() => setTheme(th.id)}>
                  <div>
                    <div
                      className="h-16 rounded-lg mb-2.5 border border-border flex overflow-hidden"
                      style={{ background: th.bg }}
                    >
                      <div className="w-6 border-r border-black/5" style={{ background: th.sidebar }} />
                      <div className="flex-1 p-1.5 flex flex-col gap-1">
                        <div className="h-2 w-[70%] bg-border rounded" />
                        <div className="h-6 bg-surface rounded-[5px] border border-black/5" />
                      </div>
                    </div>
                    <div className="text-center text-xs font-medium text-foreground">{th.label}</div>
                  </div>
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Privacy */}
        {step === 3 && (
          <div className="flex flex-col gap-[18px] max-w-[460px] mx-auto">
            <h2 className="text-xl font-bold text-foreground font-display tracking-[-0.3px] text-center mb-1">
              {t('onboarding.privacy.title')}
            </h2>
            {/* Data flow diagram */}
            <div className="px-5 py-4 bg-bg-2 rounded-lg border border-border">
              <div className="flex items-center justify-between gap-1">
                {DATA_FLOW.map((n, i) => (
                  <div key={n.labelKey} className="flex items-center gap-1 flex-1">
                    {i > 0 && <div className="text-fg-3 text-base mx-1">→</div>}
                    <div className="text-center flex-1">
                      <div className="text-[22px] mb-1">{n.icon}</div>
                      <div className="text-[11px] font-semibold text-foreground">{t(n.labelKey)}</div>
                      <div className="text-[10px] text-fg-3">{t(n.subKey)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {PRIVACY_ITEMS.map((item) => (
                <div key={item.textKey} className="flex gap-2.5 items-start px-3.5 py-2.5 bg-surface rounded-lg border border-border-2">
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[13px] text-fg-2 leading-normal">{t(item.textKey)}</span>
                </div>
              ))}
            </div>
            <label
              className={cn(
                'flex gap-2.5 items-start cursor-pointer px-3.5 py-3 rounded-lg border transition-all duration-fast',
                privacyAgreed ? 'bg-ok-bg border-ok' : 'bg-bg-2 border-border',
              )}
            >
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                className="w-4 h-4 mt-px shrink-0 accent-ok"
              />
              <span className="text-[13px] text-foreground leading-normal">{t('onboarding.privacy.agree')}</span>
            </label>
          </div>
        )}

        {/* Step 4: LLM Provider */}
        {step === 4 && (
          <div className="flex flex-col gap-3.5 max-w-[480px] mx-auto">
            <h2 className="text-xl font-bold text-foreground font-display tracking-[-0.3px] text-center mb-1">
              {t('onboarding.llm.title')}
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {MODEL_OPTIONS.slice(0, 6).map((p) => {
                const visual = MODEL_COLORS[p.providerId] ?? DEFAULT_MODEL_VISUAL
                return (
                <SelectCard key={p.id} selected={provider === p.id} onClick={() => setProvider(p.id)}>
                  <div className="text-center">
                    <div
                      className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-base"
                      style={{ background: visual.color + '20', color: visual.color }}
                    >
                      {visual.icon}
                    </div>
                    <div className="text-xs font-semibold text-foreground mb-[2px]">{p.providerName}</div>
                    <div className="text-[10px] text-fg-3 leading-[1.4]">{p.label}</div>
                  </div>
                </SelectCard>
                )
              })}
            </div>
            {provider && (
              <div className="flex gap-2 animate-slide-up">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setTestState('idle') }}
                  placeholder={MODEL_OPTIONS.find((model) => model.id === provider)?.providerId === 'ollama' ? t('onboarding.llm.noKey') : 'sk-…'}
                  className="flex-1 px-[13px] py-[9px] bg-bg-2 border border-border rounded-lg text-[13px] text-foreground font-mono outline-none transition-colors duration-fast focus:border-primary"
                />
                <button
                  onClick={testConnection}
                  disabled={testState === 'testing' || (!apiKey && MODEL_OPTIONS.find((model) => model.id === provider)?.providerId !== 'ollama')}
                  className={cn(
                    'px-4 py-[9px] rounded-lg text-xs font-medium shrink-0 border transition-all duration-fast',
                    testState === 'ok' ? 'bg-ok-bg text-ok border-ok' :
                    testState === 'fail' ? 'bg-err-bg text-err border-err' :
                    'bg-bg-2 text-fg-2 border-border hover:bg-bg-3',
                  )}
                >
                  {testState === 'testing' ? t('onboarding.llm.testing') :
                   testState === 'ok' ? t('onboarding.llm.ok') :
                   testState === 'fail' ? t('onboarding.llm.fail') :
                   t('settings.testConnection')}
                </button>
              </div>
            )}
            <p className="text-[11px] text-fg-3 text-center">{t('onboarding.llm.keyNote')}</p>
          </div>
        )}

        {/* Step 5: Search Provider */}
        {step === 5 && (
          <div className="flex flex-col gap-3.5 max-w-[440px] mx-auto">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground font-display tracking-[-0.3px] mb-1.5">
                {t('onboarding.search.title')}
              </h2>
              <p className="text-[13px] text-fg-3">{t('onboarding.search.subtitle')}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {SEARCH_PROVIDERS.map((s) => (
                <SelectCard key={s.id} selected={false} onClick={() => {}}>
                  <div className="flex gap-2.5 items-center">
                    <span className="text-xl">{s.emoji}</span>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{s.name}</div>
                      <div className="text-[11px] text-fg-3">{s.desc}</div>
                    </div>
                  </div>
                </SelectCard>
              ))}
            </div>
            <div className="px-4 py-3 bg-info-bg border border-info rounded-lg text-xs text-info flex gap-2 items-start">
              <span>ℹ</span>
              <span>{t('onboarding.search.note')}</span>
            </div>
          </div>
        )}

        {/* Step 6: Sample Projects */}
        {step === 6 && (
          <div className="flex flex-col gap-3.5 max-w-[480px] mx-auto">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground font-display tracking-[-0.3px] mb-1.5">
                {t('onboarding.example.title')}
              </h2>
              <p className="text-[13px] text-fg-3">{t('onboarding.example.subtitle')}</p>
            </div>
            <div className="flex flex-col gap-2.5">
              {SAMPLE_PROJECTS.map((s) => (
                <SelectCard
                  key={s.id}
                  selected={selectedSample === s.id}
                  onClick={() => setSelectedSample((v) => (v === s.id ? null : s.id))}
                  wide
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-accent flex items-center justify-center text-xl shrink-0">
                      {s.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-foreground mb-[3px]">{s.title}</div>
                      <div className="text-[11px] text-fg-3">{s.desc}</div>
                    </div>
                    <div className="flex gap-1">
                      {s.tags.map((tag) => (
                        <span key={tag} className="text-[10px] px-[7px] py-[2px] bg-bg-3 rounded-full text-fg-3">{tag}</span>
                      ))}
                    </div>
                  </div>
                </SelectCard>
              ))}
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex justify-between items-center mt-8">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-[13px] text-fg-3 px-3.5 py-2 rounded-[var(--radius)] hover:bg-bg-2 hover:text-fg-2 transition-colors duration-fast flex items-center gap-[5px]"
            >
              ← {t('common.prev')}
            </button>
          ) : <div />}
          <button
            onClick={() => { if (step < TOTAL_STEPS - 1) setStep((s) => s + 1); else complete() }}
            disabled={getNextDisabled()}
            className={cn(
              'px-7 py-2.5 rounded-[var(--radius)] text-sm font-medium transition-all duration-fast ease-spring',
              getNextDisabled()
                ? 'bg-border text-fg-3 cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary-hover hover:-translate-y-px shadow-[0_2px_8px_rgba(196,149,106,0.3)]',
            )}
          >
            {getNextLabel()}
          </button>
        </div>
      </div>
    </div>
  )
}
