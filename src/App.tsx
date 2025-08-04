"use client";
import "./index.css";
import AuthWrapper from "./components/ProviderWrapper";
import { Switch, Route } from "wouter";
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "./components/ui/button";
import { useAuthActions } from "@convex-dev/auth/react";
import api from "./cvx";
import { useQuery } from "convex/react";
import { Library, Search } from "lucide-react";
import SearchPage from "./pages/Search";
import LibraryPage from "./pages/Library";
import SongPage from "./pages/SongPage";
import { useState, useEffect } from "react";

function NotFound() {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count === 0) {
      window.location.href = "/";
      return;
    }
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);
  return (
    <div className="flex flex-col items-center justify-center h-[40vh]">
      <h1 className="font-serif text-4xl mb-4">404: Not Found</h1>
      <p className="font-sans text-lg mb-2">Redirecting to home in <span className="font-bold">{count}</span>...</p>
      <p className="font-sans text-sm text-gray-500">If you are not redirected, <a href="/" className="underline">click here</a>.</p>
    </div>
  );
}

function App() {
  const { viewer, image } = useQuery(api.authFunctions.getUser) ?? {};
  const { signOut } = useAuthActions();
  return (
    <AuthWrapper>
      <div className="top-0 right-0 backdrop-blur-sm h-15 bg-white z-50 w-full fixed px-2 py-2 flex gap-5">
        <span className="font-serif my-auto mx-5 text-2xl mr-auto">Lyrix</span>
        <NavigationMenu className="mx-auto my-auto">
          <NavigationMenuList>
            <NavigationMenuLink className="flex !flex-row" href="/">
              <Search className="my-auto h-4 w-4" />
            <span className="my-autp">Search</span>
            </NavigationMenuLink>
            <NavigationMenuLink href="/library" className="flex !flex-row">
              <Library className="my-auto h-4 w-4" />
            <span className="my-autp">Library</span>
            </NavigationMenuLink>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex">
          <img
            src={image ?? undefined}
            className="w-7 h-7 rounded-full my-auto"
          />
          <p className="ml-2 my-auto">{viewer ?? "Anonymous"}</p>

        </div>
        <Button variant="fancy" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
      <div className="mt-[10vh] mx-[10vw]">
        <Switch>
          <Route path="/"><SearchPage /></Route>
          <Route path="/library">
            <LibraryPage />
          </Route>
          <Route path="/song">
            <SongPage />
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </div>
    </AuthWrapper>
  );
}

export default App;
