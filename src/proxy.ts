import { NextResponse, type NextRequest } from "next/server";

// Gates /admin and /api/admin/* behind HTTP Basic Auth. Credentials come from
// ADMIN_USER / ADMIN_PASSWORD env vars. (Next 16 renamed the `middleware`
// convention to `proxy`; this is the same edge-style request gate.)
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

function constantTimeEqual(a: string, b: string): boolean {
  // Length leak is acceptable here; the secret is the password itself.
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ExpressIt Admin", charset="UTF-8"' },
  });
}

export function proxy(req: NextRequest) {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASSWORD;

  // Fail closed: if the credentials aren't configured, nobody gets in.
  if (!expectedUser || !expectedPass) return unauthorized();

  const header = req.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(":");
  if (sep === -1) return unauthorized();
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  // Evaluate both compares regardless of the first result.
  const userOk = constantTimeEqual(user, expectedUser);
  const passOk = constantTimeEqual(pass, expectedPass);
  if (!userOk || !passOk) return unauthorized();

  return NextResponse.next();
}
