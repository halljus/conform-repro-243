import { Link } from "@remix-run/react";

export default function IndexRoute() {
  return (
    <p>
      <Link to="repro">Click here to go to the reproduction route.</Link>
    </p>
  );
}
