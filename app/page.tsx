export default function HomePage() {
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontFamily: "Arial",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1>🏠 RoofFlow CRM</h1>

        <p>Welcome to RoofFlow CRM</p>

        <a
          href="/auth/login"
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "10px 20px",
            background: "#2563eb",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 6,
          }}
        >
          Login
        </a>
      </div>
    </main>
  );
}