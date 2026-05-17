import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { MODEL_OPTIONS, getBestPlanningModel } from '@/data/model-options'
import { PROVIDER_CONFIGS } from '@/data/provider-config'
import { getTauriInvoke } from '@/services/material-ingest'
import { saveProviderConfig } from '@/services/provider-settings'
import { deleteApiKey, saveApiKey } from '@/services/api-key'

type SettingsTab = 'general' | 'llm' | 'search' | 'data' | 'diagnostics'

const TABS: { key: SettingsTab; labelKey: string; icon: string }[] = [
  { key: 'general', labelKey: 'settings.general', icon: '⚙' },
  { key: 'llm', labelKey: 'settings.llm', icon: '🤖' },
  { key: 'search', labelKey: 'settings.search', icon: '🔍' },
  { key: 'data', labelKey: 'settings.data', icon: '💾' },
  { key: 'diagnostics', labelKey: 'settings.diagnostics', icon: '📊' },
]

const MODEL_COLORS: Record<string, { icon: string; color: string }> = {
  openai: { icon: '⬡', color: '#10a37f' },
  openrouter: { icon: '◈', color: '#5b6ee1' },
  openrelay: { icon: '◎', color: '#c48a2a' },
  ollama: { icon: '⌂', color: '#6b7280' },
  custom: { icon: '⚙', color: '#8b5cf6' },
}
const DEFAULT_MODEL_VISUAL = { icon: '⚙', color: '#8b5cf6' }

/* ─── Toggle ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative w-[38px] h-[22px] rounded-full transition-colors duration-fast shrink-0',
        checked ? 'bg-primary' : 'bg-border',
      )}
    >
      <div
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-[left] duration-fast ease-spring"
        style={{ left: checked ? 19 : 3 }}
      />
    </button>
  )
}

/* ─── SettingRow ─── */
function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-border-2 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-foreground">{label}</div>
        {sub && <div className="text-[11px] text-fg-3 mt-px">{sub}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/* ─── Select ─── */
function MiniSelect({ value, options, onChange }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 bg-bg-2 border border-border rounded-lg text-xs text-foreground outline-none cursor-pointer transition-colors duration-fast focus:border-primary"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [lang, setLang] = useState(i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US')
  const [themeVal, setThemeVal] = useState('warm')
  const [autoSave, setAutoSave] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [primaryProvider, setPrimaryProvider] = useState(getBestPlanningModel().id)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({ 'openai-gpt-4o': 'sk-***' })
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<string, string>>({})
  const [testStates, setTestStates] = useState<Record<string, string>>({})
  const [providerEdits, setProviderEdits] = useState<Record<string, { baseUrl: string; model: string }>>({})
  const [searchEnabled, setSearchEnabled] = useState(false)

  function handleLangChange(newLang: string) {
    setLang(newLang)
    i18n.changeLanguage(newLang)
  }

  function handleThemeChange(newTheme: string) {
    setThemeVal(newTheme)
    localStorage.setItem('miniverto-theme', newTheme)
    if (newTheme === 'cool') {
      document.documentElement.setAttribute('data-theme', 'cool')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  function testConnection(providerId: string) {
    setTestStates((v) => ({ ...v, [providerId]: 'testing' }))
    setTimeout(() => setTestStates((v) => ({ ...v, [providerId]: 'ok' })), 1800)
  }

  async function saveModelProvider(modelId: string) {
    const option = MODEL_OPTIONS.find((model) => model.id === modelId)
    if (!option) return
    const base = PROVIDER_CONFIGS[option.providerId]
    const edit = providerEdits[modelId]
    const invoke = await getTauriInvoke()
    await saveProviderConfig({
      ...base,
      baseUrl: edit?.baseUrl ?? base.baseUrl,
      defaultModel: edit?.model ?? option.modelName,
      enabled: true,
      isDefault: primaryProvider === modelId,
      updatedAt: Date.now(),
    }, invoke)
    setTestStates((v) => ({ ...v, [modelId]: 'saved' }))
  }

  async function saveModelApiKey(modelId: string) {
    const option = MODEL_OPTIONS.find((model) => model.id === modelId)
    const value = apiKeyInputs[modelId]?.trim()
    if (!option || !value) return
    const invoke = await getTauriInvoke()
    await saveApiKey(option.providerId, value, invoke)
    setApiKeys((v) => ({ ...v, [modelId]: 'saved' }))
    setApiKeyInputs((v) => ({ ...v, [modelId]: '' }))
  }

  async function deleteModelApiKey(modelId: string) {
    const option = MODEL_OPTIONS.find((model) => model.id === modelId)
    if (!option) return
    const invoke = await getTauriInvoke()
    await deleteApiKey(option.providerId, invoke)
    setApiKeys((v) => {
      const next = { ...v }
      delete next[modelId]
      return next
    })
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sub-nav */}
      <div className="w-[180px] shrink-0 border-r border-border bg-surface py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
        <div className="px-3 pb-3 mb-1 border-b border-border-2">
          <h1 className="text-base font-bold text-foreground font-display tracking-[-0.2px]">{t('settings.title')}</h1>
        </div>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-left transition-colors duration-fast w-full',
              activeTab === tab.key
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-fg-2 hover:bg-bg-2 hover:text-foreground',
            )}
          >
            <span className="text-sm">{tab.icon}</span>
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* General */}
        {activeTab === 'general' && (
          <div>
            <SectionTitle>{t('settings.general')}</SectionTitle>
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <SettingRow label={t('settings.language')} sub={t('settings.languageSub')}>
                <MiniSelect
                  value={lang}
                  options={[
                    { value: 'zh-CN', label: '简体中文' },
                    { value: 'en-US', label: 'English' },
                  ]}
                  onChange={handleLangChange}
                />
              </SettingRow>
              <SettingRow label={t('settings.theme')} sub={t('settings.themeSub')}>
                <MiniSelect
                  value={themeVal}
                  options={[
                    { value: 'warm', label: t('settings.themes.warm') },
                    { value: 'cool', label: t('settings.themes.cool') },
                    { value: 'system', label: t('settings.themes.system') },
                  ]}
                  onChange={handleThemeChange}
                />
              </SettingRow>
              <SettingRow label={t('settings.autoSave')} sub={t('settings.autoSaveSub')}>
                <Toggle checked={autoSave} onChange={setAutoSave} />
              </SettingRow>
              <SettingRow label={t('settings.notifications')} sub={t('settings.notificationsSub')}>
                <Toggle checked={notifications} onChange={setNotifications} />
              </SettingRow>
            </div>
          </div>
        )}

        {/* LLM Providers */}
        {activeTab === 'llm' && (
          <div>
            <SectionTitle>{t('settings.llm')}</SectionTitle>
            <div className="flex flex-col gap-2.5">
              <div className="px-4 py-3.5 rounded-lg border border-info bg-info-bg text-info text-xs leading-normal">
                {t('settings.modelRecommendation')}
              </div>
              {MODEL_OPTIONS.map((p) => {
                const isPrimary = primaryProvider === p.id
                const hasKey = !!apiKeys[p.id]
                const testState = testStates[p.id]
                const visual = MODEL_COLORS[p.providerId] ?? DEFAULT_MODEL_VISUAL
                const providerConfig = PROVIDER_CONFIGS[p.providerId]
                const edit = providerEdits[p.id] ?? { baseUrl: providerConfig.baseUrl, model: p.modelName }

                return (
                  <div
                    key={p.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 rounded-lg border transition-all duration-fast',
                      isPrimary
                        ? 'bg-accent border-accent-raw'
                        : 'bg-surface border-border',
                    )}
                  >
                    <div
                      className="w-9 h-9 rounded-[9px] flex items-center justify-center text-base shrink-0"
                      style={{ background: visual.color + '20', color: visual.color }}
                    >
                      {visual.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">{p.providerName} · {p.label}</span>
                        {isPrimary && (
                          <span className="text-[9px] font-bold px-1.5 py-px bg-primary text-primary-foreground rounded-full uppercase">
                            {t('settings.primary')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-fg-3 mt-px">{p.bestFor}</div>
                      <div className="text-[11px] text-fg-3 mt-1">{p.caution}</div>
                      {p.providerId === 'openrelay' && (
                        <div className="text-[11px] text-warn mt-1">
                          {PROVIDER_CONFIGS.openrelay.mobileNote}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <input
                          value={edit.baseUrl}
                          onChange={(e) => setProviderEdits((v) => ({ ...v, [p.id]: { ...edit, baseUrl: e.target.value } }))}
                          className="px-2.5 py-1.5 bg-bg-2 border border-border rounded text-[11px] text-foreground font-mono outline-none"
                        />
                        <input
                          value={edit.model}
                          onChange={(e) => setProviderEdits((v) => ({ ...v, [p.id]: { ...edit, model: e.target.value } }))}
                          className="px-2.5 py-1.5 bg-bg-2 border border-border rounded text-[11px] text-foreground font-mono outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {providerConfig.requiresApiKey && (
                        <div className="flex gap-1">
                          <input
                            type="password"
                            value={apiKeyInputs[p.id] ?? ''}
                            onChange={(e) => setApiKeyInputs((v) => ({ ...v, [p.id]: e.target.value }))}
                            placeholder={hasKey ? 'saved' : 'sk-...'}
                            className="w-[120px] px-2.5 py-1.5 bg-bg-2 border border-border rounded text-[11px] text-foreground font-mono outline-none"
                          />
                          <button
                            onClick={() => void saveModelApiKey(p.id)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-2 border border-border text-fg-2 hover:bg-bg-3 transition-colors duration-fast"
                          >
                            {t('common.save')}
                          </button>
                        </div>
                      )}
                      {hasKey && (
                        <button
                          onClick={() => testConnection(p.id)}
                          disabled={testState === 'testing'}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-fast',
                            testState === 'ok' ? 'bg-ok-bg text-ok border-ok' :
                            testState === 'testing' ? 'bg-bg-2 text-fg-3 border-border' :
                            'bg-bg-2 text-fg-2 border-border hover:bg-bg-3',
                          )}
                        >
                          {testState === 'testing' ? t('settings.testing') :
                           testState === 'ok' ? '✓ OK' :
                           t('settings.testConnection')}
                        </button>
                      )}
                      {hasKey && providerConfig.requiresApiKey && (
                        <button
                          onClick={() => void deleteModelApiKey(p.id)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-err-bg border border-err text-err hover:brightness-95 transition-colors duration-fast"
                        >
                          {t('common.delete')}
                        </button>
                      )}
                      {!isPrimary && hasKey && (
                        <button
                          onClick={() => setPrimaryProvider(p.id)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-2 border border-border text-fg-2 hover:bg-bg-3 transition-colors duration-fast"
                        >
                          {t('settings.setPrimary')}
                        </button>
                      )}
                      <button
                        onClick={() => void saveModelProvider(p.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-2 border border-border text-fg-2 hover:bg-bg-3 transition-colors duration-fast"
                      >
                        {testState === 'saved' ? '✓ Saved' : t('common.save')}
                      </button>
                      {!hasKey && (
                        <button
                          onClick={() => setApiKeys((v) => ({ ...v, [p.id]: 'sk-new' }))}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-2 border border-border text-fg-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors duration-fast"
                        >
                          {t('settings.configure')}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-fg-3 mt-3 px-1">{t('settings.llmNote')}</p>
          </div>
        )}

        {/* Search */}
        {activeTab === 'search' && (
          <div>
            <SectionTitle>{t('settings.search')}</SectionTitle>
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <SettingRow label={t('settings.searchEnabled')} sub={t('settings.searchEnabledSub')}>
                <Toggle checked={searchEnabled} onChange={setSearchEnabled} />
              </SettingRow>
            </div>
            {searchEnabled && (
              <div className="mt-3 flex flex-col gap-2.5">
                {[
                  { id: 'brave', name: 'Brave Search', desc: '免费额度充足', emoji: '🦁' },
                  { id: 'tavily', name: 'Tavily', desc: '专为模型检索优化', emoji: '🔍' },
                ].map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 bg-surface border border-border rounded-lg">
                    <span className="text-xl">{s.emoji}</span>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-foreground">{s.name}</div>
                      <div className="text-[11px] text-fg-3">{s.desc}</div>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-2 border border-border text-fg-2 hover:bg-bg-3 transition-colors duration-fast">
                      {t('settings.configure')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Data */}
        {activeTab === 'data' && (
          <div>
            <SectionTitle>{t('settings.data')}</SectionTitle>
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <SettingRow label={t('settings.exportAll')} sub={t('settings.exportAllSub')}>
                <button className="px-3.5 py-1.5 rounded-lg text-[11px] font-medium bg-bg-2 border border-border text-fg-2 hover:bg-bg-3 transition-colors duration-fast">
                  {t('settings.export')}
                </button>
              </SettingRow>
              <SettingRow label={t('settings.importData')} sub={t('settings.importDataSub')}>
                <button className="px-3.5 py-1.5 rounded-lg text-[11px] font-medium bg-bg-2 border border-border text-fg-2 hover:bg-bg-3 transition-colors duration-fast">
                  {t('settings.import')}
                </button>
              </SettingRow>
              <SettingRow label={t('settings.clearCache')} sub={t('settings.clearCacheSub')}>
                <button className="px-3.5 py-1.5 rounded-lg text-[11px] font-medium bg-err-bg border border-err text-err hover:brightness-95 transition-colors duration-fast">
                  {t('settings.clear')}
                </button>
              </SettingRow>
            </div>
          </div>
        )}

        {/* Diagnostics */}
        {activeTab === 'diagnostics' && (
          <div>
            <SectionTitle>{t('settings.diagnostics')}</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: t('settings.diag.projects'), value: '4', color: 'text-primary' },
                { label: t('settings.diag.totalTasks'), value: '70', color: 'text-foreground' },
                { label: t('settings.diag.apiCalls'), value: '156', color: 'text-info' },
                { label: t('settings.diag.storageUsed'), value: '12.4 MB', color: 'text-fg-2' },
              ].map((stat) => (
                <div key={stat.label} className="px-5 py-4 bg-surface border border-border rounded-lg text-center">
                  <div className={cn('text-xl font-extrabold font-display tracking-[-0.5px] mb-1', stat.color)}>
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-fg-3">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <SettingRow label={t('settings.diag.version')} sub="miniverto">
                <span className="text-xs text-fg-3 font-mono">v0.1.0-alpha</span>
              </SettingRow>
              <SettingRow label={t('settings.diag.runtime')} sub="Tauri">
                <span className="text-xs text-fg-3 font-mono">2.x (deferred)</span>
              </SettingRow>
              <SettingRow label={t('settings.diag.resetOnboarding')} sub={t('settings.diag.resetOnboardingSub')}>
                <button className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-bg-2 border border-border text-fg-2 hover:bg-bg-3 transition-colors duration-fast">
                  {t('settings.diag.reset')}
                </button>
              </SettingRow>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-bold text-foreground font-display tracking-[-0.3px] mb-4">{children}</h2>
  )
}
