"use client";
import "./index.css";
import ProviderWrapper from "./components/ProviderWrapper";
import { Switch, Route, Redirect, Link } from "wouter";
import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "./components/ui/button";
import { useAuthActions } from "@convex-dev/auth/react";
import api from "./cvx";
import { useQuery } from "convex/react";
import { Library, MessageSquare, Search } from "lucide-react";
import { useState, useEffect } from "react";

function NotFound() {
  const [count, setCount] = useState(3);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (count === 0) {
      setShouldRedirect(true);
      return;
    }
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  if (shouldRedirect) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-[40vh]">
      <h1 className="font-serif text-4xl mb-4">404: Not Found</h1>
      <p className="font-sans text-lg mb-2">
        Redirecting to home in <span className="font-bold">{count}</span>...
      </p>
      <p className="font-sans text-sm text-gray-500">
        If you are not redirected,{" "}
        <Link href="/" className="underline">
          click here
        </Link>
        .
      </p>
    </div>
  );
}

function App() {
  const { viewer, image } = useQuery(api.authFunctions.getUser) ?? {};
  const { signOut } = useAuthActions();
  return (
    <ProviderWrapper>
      <div className="top-0 right-0 backdrop-blur-sm h-15 bg-white z-50 w-full fixed px-2 py-2 flex gap-5">
        <span className="font-serif my-auto mx-5 text-2xl mr-auto">My template app</span>
        <NavigationMenu className="mx-auto my-auto">
          <NavigationMenuList>
            <NavigationMenuLink asChild>
              <Link className="flex !flex-row" href="/">
                <Search className="my-auto h-4 w-4" />
                <span className="my-auto">Default page</span>
              </Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link className="flex !flex-row" href="/page-1">
                <Search className="my-auto h-4 w-4" />
                <span className="my-auto">Page 1</span>
              </Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link href="/page-2" className="flex !flex-row">
                <Library className="my-auto h-4 w-4" />
                <span className="my-auto">Page 2</span>
              </Link>
            </NavigationMenuLink>
            <NavigationMenuLink asChild>
              <Link href="/page-3" className="flex !flex-row">
                <MessageSquare className="my-auto h-4 w-4" />
                <span className="my-auto">Page 3</span>
              </Link>
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
        <Button
          variant="fancy"
          className="my-auto"
          onClick={() => void signOut()}
        >
          Sign out
        </Button>
      </div>
      <div className="mt-[10vh] mx-[10vw]">
        <Switch>
          <Route path="/">
            <h1>Default page</h1>
          </Route>
          <Route path="/page-1">
            <h1>Page 1</h1>
          </Route>
          <Route path="/page-2">
            <h1>Page 2</h1>
          </Route>
          <Route path="/page-3">
            <h1>Page 3</h1>
          </Route>
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </div>
    </ProviderWrapper>
  );
}

export default App;
