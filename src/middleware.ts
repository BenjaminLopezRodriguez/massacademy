import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth;

export const config = {
  matcher: ["/profile/me", "/dashboard"],
};
