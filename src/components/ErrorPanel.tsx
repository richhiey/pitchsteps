export function ErrorPanel({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <main className="app-main app-main--setup">
      <section className="panel error-panel">
        <h1>Microphone access needs attention</h1>
        <p>{message}</p>
        <ol>
          <li>Open site permissions beside the address bar.</li>
          <li>Allow microphone access.</li>
          <li>Retry here after changing the setting.</li>
        </ol>
        <button className="button button--primary" onClick={onReset}>Try again</button>
      </section>
    </main>
  );
}
