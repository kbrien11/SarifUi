import TransparencyExplorer from "./components/TransparencyExplorer";
import { BrowserRouter } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
    <BrowserRouter>
  
      <TransparencyExplorer />
      </BrowserRouter>
  
    </div>
  );
}

export default App;