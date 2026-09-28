import { Route, Routes } from "react-router-dom";
import { PseudoGate } from "./components/PseudoGate";
import { Home } from "./pages/Home";
import { NewWine } from "./pages/NewWine";
import { WineDetail } from "./pages/WineDetail";

function App() {
  return (
    <PseudoGate>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nouveau" element={<NewWine />} />
        <Route path="/vins/:id" element={<WineDetail />} />
      </Routes>
    </PseudoGate>
  );
}

export default App;
