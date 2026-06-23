import passport from "passport";
import type { Profile } from "passport";
import {
  Strategy as GoogleStrategy,
  type VerifyCallback,
} from "passport-google-oauth20";
import { Strategy as GithubStrategy } from "passport-github2";
import { prisma } from "../lib/prisma";

type DoneFn = (error: any, user?: Express.User | false | null) => void;

async function handleOAuthUser(
  provider: "googleId" | "githubId",
  profile: Profile,
  done: DoneFn,
) {
  try {
    const providerId = profile.id;
    const email =
      profile.emails?.[0]?.value ||
      `${providerId}@${provider.replace("Id", "")}-oauth.local`;
    const username =
      profile.displayName || profile.username || email.split("@")[0];
    const avatarUrl = profile.photos?.[0]?.value || null;

    let user = await prisma.user.findUnique({
      where: { [provider]: providerId } as any,
    });

    if (!user) {
      user = await prisma.user.upsert({
        where: { email },
        update: { [provider]: providerId, avatarUrl } as any,
        create: {
          email,
          username,
          passwordHash: "",
          [provider]: providerId,
          avatarUrl,
        } as any,
      });
    } else if (!(user as any)[provider]) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { [provider]: providerId, avatarUrl },
      });
    }

    done(null, { id: user.id, email: user.email, username: user.username });
  } catch (err) {
    done(err as Error);
  }
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL: "/api/auth/google/callback",
    },
    (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      handleOAuthUser("googleId", profile, done as DoneFn);
    },
  ),
);

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      callbackURL: "/api/auth/github/callback",
    },
    (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (err: any, user?: any) => void,
    ) => {
      handleOAuthUser("githubId", profile, done as DoneFn);
    },
  ),
);

passport.serializeUser((data: any, done) => done(null, data));
passport.deserializeUser((data: any, done) => done(null, data));

export default passport;
