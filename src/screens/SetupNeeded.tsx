// Shown when the app hasn't been connected to a Supabase project yet.
export default function SetupNeeded() {
  return (
    <div className="screen">
      <header className="appbar">
        <h1>Linen Routes</h1>
      </header>
      <main className="content">
        <div className="card">
          <h2>Almost there 🧺</h2>
          <p>
            This app needs to be connected to your free Supabase project before
            it can save routes.
          </p>
          <ol className="setup-steps">
            <li>
              Create a project at <strong>supabase.com</strong>.
            </li>
            <li>
              Open the SQL editor and run the <code>supabase/schema.sql</code>{" "}
              file from this project.
            </li>
            <li>
              Copy your Project URL and anon key into a <code>.env</code> file
              (see <code>.env.example</code>).
            </li>
            <li>Restart the app.</li>
          </ol>
          <p className="muted">
            Full instructions are in the project <code>README.md</code>.
          </p>
        </div>
      </main>
    </div>
  );
}
