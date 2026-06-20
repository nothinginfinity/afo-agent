import { useState } from 'react';

export default function AFOAgentGatewayExplorer() {
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [providerKey, setProviderKey] = useState('');
  const [afoRoleToken, setAfoRoleToken] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/byok/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          model,
          providerKey,
          afoRoleToken,
          prompt,
          maxTokens: 1000
        })
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

  const renderContent = (blocks = []) => {
    return blocks.map((block, index) => {
      if (block.type === 'text') {
        return <p key={index} className="response-text">{block.text}</p>;
      }
      if (block.type === 'mcp_tool_use' || block.type === 'tool_use') {
        return (
          <div key={index} className="tool-use">
            <strong>Tool Used:</strong> {block.name}
            <pre>{JSON.stringify(block.input, null, 2)}</pre>
          </div>
        );
      }
      if (block.type === 'mcp_tool_result') {
        return (
          <div key={index} className="tool-result">
            <strong>Tool Result:</strong>
            <pre>{JSON.stringify(block.content, null, 2)}</pre>
          </div>
        );
      }
      return (
        <div key={index} className="raw-block">
          <pre>{JSON.stringify(block, null, 2)}</pre>
        </div>
      );
    });
  };

  return (
    <div className="container">
      <h1>AFO BYOK Agent Gateway Explorer</h1>
      <p className="subtitle">Use your own model key while routing tools through AFO Agent Gateway.</p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Provider
          <select value={provider} onChange={(e) => setProvider(e.target.value)} disabled={loading}>
            <option value="anthropic">Anthropic</option>
          </select>
        </label>

        <label>
          Model
          <input value={model} onChange={(e) => setModel(e.target.value)} disabled={loading} />
        </label>

        <label>
          Provider key
          <input
            type="password"
            value={providerKey}
            onChange={(e) => setProviderKey(e.target.value)}
            placeholder="Used only by the BYOK backend request"
            disabled={loading}
          />
        </label>

        <label>
          AFO role token
          <input
            type="password"
            value={afoRoleToken}
            onChange={(e) => setAfoRoleToken(e.target.value)}
            placeholder="Optional read/operator/owner token"
            disabled={loading}
          />
        </label>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask Claude to search AFO Gateway for GitHub tools..."
          className="input-area"
          disabled={loading}
        />

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Processing...' : 'Send'}
        </button>
      </form>

      {error && <div className="error-box"><strong>Error:</strong> {error}</div>}

      {response && (
        <div className="response-box">
          <h2>Response</h2>
          {renderContent(response.content)}
          {response.toolCalls?.length > 0 && (
            <details className="raw-response">
              <summary>Tool calls</summary>
              <pre>{JSON.stringify(response.toolCalls, null, 2)}</pre>
            </details>
          )}
          <details className="raw-response">
            <summary>Raw JSON</summary>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
