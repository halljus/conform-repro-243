import * as React from "react";
import { Outlet, useNavigation } from "@remix-run/react";
import nProgress from "nprogress";
import { useSpinDelay } from "spin-delay";
import { clsx } from "clsx";
import { Container } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import { ErrorBoundary as CoreErrorBoundary } from "~/core/errors";

nProgress.configure({ showSpinner: false });

export default function AppLayout() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const isNavigatingSlowly = useSpinDelay(isNavigating);

  React.useEffect(() => {
    if (isNavigatingSlowly) nProgress.start();
    else nProgress.done();
  }, [isNavigatingSlowly]);

  return (
    <>
      <fieldset
        disabled={isNavigatingSlowly}
        className={clsx({ "opacity-75": isNavigatingSlowly })}
      >
        <Container as="main" className="py-5">
          <Outlet />
        </Container>
      </fieldset>
      <ToastContainer
        autoClose={3000}
        position="bottom-right"
        toastClassName="mt-3 mb-0"
      />
    </>
  );
}

// This pathless layout route will render an error fallback for any errors that are thrown within
// the app (anything below this pathless route). This happens here instead of in the root route so
// the error fallback gets rendered within the root layout. In the event something in the root
// layout itself throws an error, it will not be caught here and it will be handled by the root
// route (or Remix itself if there is not an error boundary defined in the root route).
export function ErrorBoundary() {
  return (
    <div className="my-4">
      <CoreErrorBoundary />
    </div>
  );
}
