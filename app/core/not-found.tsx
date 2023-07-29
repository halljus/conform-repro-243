import { GoHomeLink } from './go-home-link';

export default function NotFound() {
  return (
    <>
      <h1 className="mb-5">Not Found</h1>
      <p className="mb-5 display-5">Hmm, there&apos;s nothing here.</p>
      <GoHomeLink />
    </>
  );
}
