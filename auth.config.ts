import type { NextAuthConfig, Session as NextAuthSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUserByEmail, createUser, nextId } from '@/app/_lib/store';
import { simpleHash } from '@/app/_lib/auth';
import type { User } from '@/app/_lib/types';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'employee' | 'manager' | 'admin';
    };
  }
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'employee' | 'manager' | 'admin';
  }
}

export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' },
        action: { label: 'Action', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials.email || !credentials.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;
        const name = credentials.name as string;
        const action = credentials.action as string;

        // Sign up
        if (action === 'signup') {
          if (!name) {
            throw new Error('Name is required.');
          }

          if (password.length < 6) {
            throw new Error('Password must be at least 6 characters.');
          }

          const existing = getUserByEmail(email);
          if (existing) {
            throw new Error('Email already in use.');
          }

          const newUser: User = {
            id: nextId('user'),
            email,
            name: name.trim(),
            passwordHash: simpleHash(password),
            role: 'employee',
            managerId: null,
            department: 'General',
            avatarInitials: name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
          };

          createUser(newUser);

          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
          };
        }

        // Sign in
        const user = getUserByEmail(email);
        if (!user || user.passwordHash !== simpleHash(password)) {
          throw new Error('Invalid email or password.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

