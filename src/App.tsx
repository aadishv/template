"use client";
import "./index.css";
import AuthWrapper from "./components/auth-wrapper";

function Content() {
  return (
    <div className="mt-[10vh] mx-[10vw]">

    </div>
  );
}

export default function App() {
  return <AuthWrapper Content={Content} />;
}
