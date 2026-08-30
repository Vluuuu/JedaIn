import { Link, Route, Routes } from "react-router";
import "./App.css";

export function App() {
  return (
    <Routes>
      <Route index element={<RootPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function RootPage() {
  return (
    <main className="page">
      <p className="eyebrow">JedaIn</p>
      <h1>Fondasi aplikasi siap.</h1>
      <p>
        Fitur traveler, partner, dan admin akan hadir pada tahap berikutnya.
      </p>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="page">
      <p className="eyebrow">404</p>
      <h1>Halaman tidak ditemukan.</h1>
      <Link to="/">Kembali ke halaman utama</Link>
    </main>
  );
}

export default App;
