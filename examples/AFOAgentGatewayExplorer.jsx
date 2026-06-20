import { useMemo, useState } from 'react';

const MODEL_OPTIONS = {
  anthropic: ['claude-sonnet-4-6', 'claude-opus-4-1', 'claude-sonnet-4-5'],
  openai: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-5-mini'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  xai: ['grok-4', 'grok-3', 'grok-3-mini'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  kimi: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
  mistral: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
  groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-120b'],
  cerebras: ['llama3.1-8b', 'llama-3.3-70b', 'qwen-3-coder-480b'],
  'openai-compatible': ['custom-model']
};

const PROVIDERS = [
  ['anthropic', 'Anthropic / Claude'],
  ['openai', 'ChatGPT / OpenAI'],
  ['gemini', 'Google Gemini'],
  ['xai', 'xAI / Grok'],
  ['deepseek', 'DeepSeek'],
  ['kimi', 'Kimi / Moonshot'],
  ['mistral', 'Mistral'],
  ['groq', 'Groq'],
  ['cerebras', 'Cerebras'],
  ['openai-compatible', 'Custom OpenAI-Compatible']
];

export default function AFOAgentGatewayExplorer() {
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState(MODEL_OPTIONS.anthropic[0]);
  const [baseUrl, setBaseUrl] = useState('');
  const [byokToken, setByokToken] = useState('');
  const [afoRoleToken, setAfoRoleToken] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const modelOptions = useMemo(() => MODEL_OPTIONS[provider] || ['custom-model'], [provider]);

  const handleProviderChange = (nextProvider) => {
    setProvider(nextProvider);
    setModel((MODEL_OPTIONS[nextProvider] || ['custom-model'])[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await fetch('/api/byok/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, baseUrl, providerKey: byokToken, afoRoleToken, prompt, maxTokens: 1000 })
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || `API error: ${res.status}`);
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (blocks = []) => blocks.map((block, index) => {
    if (block.type === 'text') return <p key={index} className="response-text">{block.text}</p>;
    if (block.type === 'mcp_tool_use' || block.type === 'tool_use') return <div key={index} className="tool-use"><strong>Tool Used:</strong> {block.name}<pre>{JSON.stringify(block.input, null, 2)}</pre></div>;
    if (block.type === 'mcp_tool_result') return <div key={index} className="tool-result"><strong>Tool Result:</strong><pre>{JSON.stringify(block.content, null, 2)}</pre></div>;
    return <pre key={index}>{JSON.stringify(block, null, 2)}</pre>;
  });

  return (
    <div className="container">
      <h1>AFO BYOK Agent Gateway Explorer</h1>
      <p className="subtitle">Select a provider and model, then route the request through AFO Agent Gateway.</p>
      <form onSubmit={handleSubmit} className="form">
        <label>Provider<select value={provider} onChange={(e) => handleProviderChange(e.target.value)} disabled={loading}>{PROVIDERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Model preset<select value={modelOptions.includes(model) ? model : 'custom'} onChange={(e) => e.target.value !== 'custom' && setModel(e.target.value)} disabled={loading}>{modelOptions.map((option) => <option key={option} value={option}>{option}</option>)}<option value="custom">Custom model ID</option></select></label>
        <label>Model ID<input value={model} onChange={(e) => setModel(e.target.value)} disabled={loading} placeholder="Paste any current model ID here" /></label>
        {provider === 'openai-compatible' && <label>Base URL<input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} disabled={loading} placeholder="https://your-provider.example/v1" /></label>}
        <label>BYOK token<input type="password" value={byokToken} onChange={(e) => setByokToken(e.target.value)} placeholder="Sent to the BYOK backend for this request" disabled={loading} /></label>
        <label>AFO role token<input type="password" value={afoRoleToken} onChange={(e) => setAfoRoleToken(e.target.value)} placeholder="Optional read/operator/owner token" disabled={loading} /></label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask the selected model to search AFO Gateway for GitHub tools..." className="input-area" disabled={loading} />
        <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Processing...' : 'Send'}</button>
      </form>
      {error && <div className="error-box"><strong>Error:</strong> {error}</div>}
      {response && <div className="response-box"><h2>Response</h2>{renderContent(response.content)}{response.text && <p className="response-text">{response.text}</p>}{response.toolCalls?.length > 0 && <details className="raw-response"><summary>Tool calls</summary><pre>{JSON.stringify(response.toolCalls, null, 2)}</pre></details>}<details className="raw-response"><summary>Raw JSON</summary><pre>{JSON.stringify(response, null, 2)}</pre></details></div>}
    </div>
  );
}
