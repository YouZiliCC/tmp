import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import Search from "./pages/Search";
import QA from "./pages/QA";
import Review from "./pages/Review";
import PaperDetail from "./pages/PaperDetail";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import { applyTheme, getTheme } from "./lib/theme";

export default function App() {
  // 由 React 在挂载时再强制断言一次主题（默认浅色），确保即使首屏内联脚本被缓存/未执行，
  // 当前加载的样式表也一定按存储/默认值应用 data-theme。
  useEffect(() => {
    applyTheme(getTheme());
  }, []);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-column w-full mx-auto px-8 py-9">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/qa" element={<QA />} />
            <Route path="/review" element={<Review />} />
            <Route path="/paper/:id" element={<PaperDetail />} />
            <Route path="/help" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
