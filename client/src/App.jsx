import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PortfolioPage } from './pages/PortfolioPage';
import { TasksPage } from './pages/TasksPage';
import { ShopPage } from './pages/ShopPage';
import './styles.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/shop" element={<ShopPage />} />
      </Routes>
    </BrowserRouter>
  );
}

