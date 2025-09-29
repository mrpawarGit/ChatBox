import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./App.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./page/user-login/Login";

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <BrowserRouter>
        <Routes>
          <Route path="/user-login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
