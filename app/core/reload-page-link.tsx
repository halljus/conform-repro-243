import { Link, useLocation } from "@remix-run/react";
import { Stack } from "react-bootstrap";
import { MdRestartAlt } from "react-icons/md";

export function ReloadPageLink() {
  const { pathname, search } = useLocation();
  return (
    <Link
      to={`${pathname}${search}`}
      className="btn btn-outline-primary"
      reloadDocument
    >
      <Stack direction="horizontal" gap={2} className="align-items-center">
        <MdRestartAlt size={22} />
        <span>Reload Page</span>
      </Stack>
    </Link>
  );
}
