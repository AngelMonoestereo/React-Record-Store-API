import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Results from "./pages/Results.jsx";
import RecordDetail from "./pages/RecordDetail.jsx";
import Header from "./components/Header.jsx";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/record/:id" element={<RecordDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
