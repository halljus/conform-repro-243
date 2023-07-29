import { isRouteErrorResponse, useRouteError } from '@remix-run/react';
import NotFound from '~/core/not-found';
import { ReloadPageLink } from './reload-page-link';
import { GoHomeLink } from './go-home-link';
import type { GuardType } from './types';

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <NotFound />;
    }

    return (
      <BoundaryContainer>
        <h1 className="fs-2">
          <span>
            {error.status} {error.statusText}
          </span>
        </h1>
        <section>
          {error.status === 403 ? (
            <>
              <p>You are not authorized to view this page.</p>
              <p>Please contact an application superuser if you feel you need access.</p>
            </>
          ) : null}
          {error.data ? <p>The error message was as follows:</p> : null}
        </section>
        {error.data ? <BoundaryError>{renderRouteErrorData(error.data)}</BoundaryError> : null}
        <RecoveryLinks />
      </BoundaryContainer>
    );
  }

  return (
    <BoundaryContainer>
      <h1 className="d-flex gap-3 fs-2">
        <span role="img" aria-hidden>
          💥
        </span>
        <span>Unhandled Exception</span>
        <span role="img" aria-hidden>
          💥
        </span>
      </h1>
      <section>
        <p>Something unexpected happened and we were not prepared. Sorry about that.</p>
        <p>The error message was as follows:</p>
      </section>
      <BoundaryError>{error instanceof Error ? error.message : 'Unknown Error'}</BoundaryError>
      <RecoveryLinks />
    </BoundaryContainer>
  );
}

function BoundaryContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="d-flex flex-column align-items-center gap-3 px-3 fs-5 text-black gap-md-5">
      {children}
    </div>
  );
}

function BoundaryError({ children }: { children: React.ReactNode }) {
  return (
    <pre
      className="p-5 bg-black text-white w-100"
      style={{ maxWidth: '80rem', whiteSpace: 'pre-wrap' }}
    >
      <code>{children}</code>
    </pre>
  );
}

function RecoveryLinks() {
  return (
    <div className="d-flex flex-wrap gap-3 gap-sm-5">
      <ReloadPageLink />
      <GoHomeLink />
    </div>
  );
}

function renderRouteErrorData(routeErrorData: GuardType<typeof isRouteErrorResponse>) {
  if (typeof routeErrorData === 'object') {
    return JSON.stringify(routeErrorData, null, 2);
  }

  return routeErrorData;
}
