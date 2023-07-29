import { Link } from '@remix-run/react';
import { Stack } from 'react-bootstrap';
import { MdHome } from 'react-icons/md';

export function GoHomeLink() {
  return (
    <Link to="/" className="btn btn-outline-primary">
      <Stack direction="horizontal" gap={2} className="align-items-center">
        <MdHome size={22} />
        <span>Go Home</span>
      </Stack>
    </Link>
  );
}
