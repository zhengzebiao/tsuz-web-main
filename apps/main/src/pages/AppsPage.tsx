import AppGrid from "../components/AppGrid";

export default function AppsPage() {
  return (
    <main className="app-page">
      <section className="app-page-main">
        <header className="app-page-heading">
          <h1>应用中心</h1>
          <p>选择一个子应用开始工作</p>
        </header>
        <AppGrid />
      </section>
    </main>
  );
}
