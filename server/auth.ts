import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Express, Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    throw new Error("JWT_SECRET must be set to a strong random value.");
  }

  return secret;
})();

// User roles
export enum UserRole {
  COMMUNITY = 'community',
  MODERATOR = 'moderator',
  ADMIN = 'admin'
}

// User status
export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected'
}

// Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}

// Strong password validation
const strongPasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Password must contain at least one special character");

// Registration schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be less than 50 characters"),
  nickname: z.string().min(2, "Nickname must be at least 2 characters").max(20, "Nickname must be less than 20 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: strongPasswordSchema,
});

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user: { id: string; username: string; email: string; role: UserRole; status?: UserStatus }): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role,
      status: user.status || UserStatus.APPROVED
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Auth middleware - Headers:', req.headers['authorization']);
  console.log('Auth middleware - Token:', token ? 'Token present' : 'No token');

  if (!token) {
    console.log('Auth middleware - No token provided');
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  console.log('Auth middleware - Decoded token:', decoded);
  
  if (!decoded) {
    console.log('Auth middleware - Invalid token');
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  req.user = decoded;
  console.log('Auth middleware - User set:', req.user);
  next();
}

// Optional authentication middleware (for routes that work with or without auth)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
}

// Role-based authorization middleware
export function requireRole(role: UserRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log('Role middleware - Required role:', role);
    console.log('Role middleware - User:', req.user);
    
    if (!req.user) {
      console.log('Role middleware - No user in request');
      return res.status(401).json({ message: 'Authentication required' });
    }

    const roleHierarchy = {
      [UserRole.COMMUNITY]: 1,
      [UserRole.MODERATOR]: 2,
      [UserRole.ADMIN]: 3,
    };

    console.log('Role middleware - User role level:', roleHierarchy[req.user.role]);
    console.log('Role middleware - Required role level:', roleHierarchy[role]);

    if (roleHierarchy[req.user.role] < roleHierarchy[role]) {
      console.log('Role middleware - Insufficient permissions');
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    console.log('Role middleware - Access granted');
    next();
  };
}

// Convenience middleware functions
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireModerator = requireRole(UserRole.MODERATOR);

// Setup authentication routes
export function setupAuth(app: Express) {
  // Register endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, nickname, email, password } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await db.select({
        id: users.id,
        email: users.email
      }).from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Check if username is taken
      const existingUsername = await db.select({
        id: users.id,
        username: users.username
      }).from(users).where(eq(users.username, username)).limit(1);
      if (existingUsername.length > 0) {
        return res.status(400).json({ message: 'Username is already taken' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const newUser = await db.insert(users).values({
        username,
        nickname,
        email,
        password: hashedPassword,
        role: UserRole.COMMUNITY, // Default role
        status: UserStatus.PENDING, // Pending approval
        experiencePoints: 0,
        level: 1,
        badges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      res.status(201).json({
        message: 'Account created successfully. Please wait for admin approval.',
        user: {
          id: newUser[0].id,
          username: newUser[0].username,
          email: newUser[0].email,
          role: newUser[0].role,
          status: newUser[0].status,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message).join(', ');
        return res.status(400).json({ message: errorMessages });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email
      const userResult = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        role: users.role,
        status: users.status,
        experiencePoints: users.experiencePoints,
        level: users.level,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).where(eq(users.email, email)).limit(1);
      if (userResult.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = userResult[0];

      // Check if user has password (should not be null for local auth)
      if (!user.password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check user status
      if (user.status === UserStatus.PENDING) {
        return res.status(401).json({ message: 'Account pending approval. Please wait for admin approval.' });
      }

      if (user.status === UserStatus.REJECTED) {
        return res.status(401).json({ message: 'Account access denied. Contact admin for more information.' });
      }

      if (user.status === UserStatus.SUSPENDED) {
        return res.status(401).json({ message: 'Account suspended. Contact admin for more information.' });
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        username: user.username || '',
        email: user.email || '',
        role: user.role as UserRole,
        status: user.status as UserStatus,
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          experiencePoints: user.experiencePoints,
          level: user.level,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/me', authenticateToken as any, async (req: any, res: Response) => {
    try {
      const userResult = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        nickname: users.nickname,
        experiencePoints: users.experiencePoints,
        level: users.level,
        badges: users.badges
      }).from(users).where(eq(users.id, req.user!.id)).limit(1);
      if (userResult.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = userResult[0];
      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
          experiencePoints: user.experiencePoints,
          level: user.level,
          badges: user.badges,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Change role endpoint (admin only)
  app.patch('/api/auth/users/:userId/role', authenticateToken as any, requireAdmin as any, async (req: any, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));

      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get all users (admin and moderator access)
  app.get('/api/admin/users', authenticateToken as any, requireModerator as any, async (req: any, res: Response) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        role: users.role,
        status: users.status,
        contributionsCount: users.contributionsCount,
        experiencePoints: users.experiencePoints,
        level: users.level,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users);

      res.json({ users: allUsers });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update user status (admin and moderator access with restrictions)
  app.patch('/api/admin/users/:userId/status', authenticateToken as any, requireModerator as any, async (req: any, res: Response) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!Object.values(UserStatus).includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // Moderators cannot reject users, only admins can
      if (req.user.role === UserRole.MODERATOR && status === UserStatus.REJECTED) {
        return res.status(403).json({ message: 'Moderators cannot reject users. Only approve or suspend.' });
      }

      await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));

      res.json({ message: 'User status updated successfully' });
    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update user role (admin only)
  app.patch('/api/admin/users/:userId/role', authenticateToken as any, requireAdmin as any, async (req: any, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));

      res.json({ message: 'User role updated successfully' });
    } catch (error) {
      console.error('Update role error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete user (admin only)
  app.delete('/api/admin/users/:userId', authenticateToken as any, requireAdmin as any, async (req: any, res: Response) => {
    try {
      const { userId } = req.params;

      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      await db.delete(users).where(eq(users.id, userId));

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create admin account
  app.post('/api/auth/create-admin', async (req: Request, res: Response) => {
    try {
      const { username, email, password } = registerSchema.parse(req.body);
      const nickname = req.body.nickname || username; // Use username as fallback for admin

      // Check if user already exists
      const existingUser = await db.select({
        id: users.id,
        email: users.email
      }).from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Check if username is taken
      const existingUsername = await db.select({
        id: users.id,
        username: users.username
      }).from(users).where(eq(users.username, username)).limit(1);
      if (existingUsername.length > 0) {
        return res.status(400).json({ message: 'Username is already taken' });
      }

      // Create admin account
      const hashedPassword = await hashPassword(password);
      const newAdmin = await db.insert(users).values({
        username,
        nickname,
        email,
        password: hashedPassword,
        role: UserRole.ADMIN,
        status: UserStatus.APPROVED,
        experiencePoints: 0,
        level: 1,
        badges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      res.status(201).json({
        message: 'Admin account created successfully',
        user: {
          id: newAdmin[0].id,
          username: newAdmin[0].username,
          email: newAdmin[0].email,
          role: newAdmin[0].role,
        },
      });
    } catch (error) {
      console.error('Create admin error:', error);
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message).join(', ');
        return res.status(400).json({ message: errorMessages });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  
  // Update profile endpoint
  app.patch('/api/auth/update-profile', authenticateToken as any, async (req: any, res: Response) => {
    try {
      const { nickname, currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Validation
      if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 20) {
        return res.status(400).json({ error: 'Nickname must be between 2 and 20 characters' });
      }

      const userResult = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        password: users.password,
        role: users.role,
        status: users.status,
        nickname: users.nickname,
        createdAt: users.createdAt
      }).from(users).where(eq(users.id, userId)).limit(1);
      const user = userResult[0];
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prepare update data
      const updateData: any = {
        nickname: nickname.trim(),
        updatedAt: new Date()
      };

      // If changing password, validate current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to change password' });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password || '');
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
          return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
          return res.status(400).json({ 
            error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
          });
        }

        // Hash new password
        const saltRounds = 12;
        updateData.password = await bcrypt.hash(newPassword, saltRounds);
      }

      // Update user in database
      await db.update(users).set(updateData).where(eq(users.id, userId));

      console.log(`✅ Profile updated for user: ${user.username}`);
      
      // Ensure proper JSON response
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ 
        message: 'Profile updated successfully',
        user: { 
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: updateData.nickname,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: updateData.updatedAt
        }
      });

    } catch (error) {
      console.error('❌ Profile update error:', error);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  console.log('✅ Authentication system initialized');
}
