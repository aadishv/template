import { useAuthActions } from "@convex-dev/auth/react";
import {
  Authenticated,
  Unauthenticated,
  useConvexAuth,
  useQuery,
} from "convex/react";
import { Button } from "./ui/button";
import { GoogleLogo, GitHubLogo } from "./logos";
import { api } from "@/../convex/_generated/api";

export default function AuthWrapper(props: { Content: React.ComponentType }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut, signIn } = useAuthActions();
  const { viewer, image } = useQuery(api.myFunctions.getUser) ?? {};
  return (
    <>
      <main>
        <Authenticated>
          <div className="top-0 right-0 w-full fixed mx-2 mt-2 flex gap-5">
            <span className="font-serif my-auto mx-5 text-2xl mr-auto">Lyrix</span>
            <div className="flex">
              <img
                src={image ?? undefined}
                className="w-7 h-7 rounded-full my-auto"
              ></img>{" "}
              <p className="ml-2 my-auto">{viewer ?? "Anonymous"}</p>
            </div>
            {isAuthenticated && (
              <Button variant="fancy" onClick={() => void signOut()}>
                Sign out
              </Button>
            )}
          </div>
          <props.Content />
        </Authenticated>
        <Unauthenticated>
          <div className="w-screen h-screen flex flex-col items-center justify-center gap-2">
          <Button
            // className="h-[4vh] mt-[46vh] mb-[1vh]"
            variant="default"
            type="button"
            onClick={() => void signIn("google")}
          >
            <GoogleLogo className="mr-2 h-4 w-4" /> Sign in with Google
          </Button>
          <Button
            // className="h-[4vh] mb-[45vh] mt-[1vh]"
            variant="default"
            type="button"
            onClick={() => void signIn("github")}
          >
            <GitHubLogo className="mr-2 h-4 w-4" /> Sign in with Github
          </Button>
          </div>
        </Unauthenticated>
      </main>
    </>
  );
}
