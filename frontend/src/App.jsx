import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./App.css";
import { Login } from "./pages/user-login/login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/user-login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
