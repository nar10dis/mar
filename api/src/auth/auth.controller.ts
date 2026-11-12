import { Body, ConflictException, Controller, Get, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { Authenticate, CurrentUser, PasswordHasher, Public, SignInService } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { PrismaService } from '../prisma/prisma.service.js';
import { RateLimit } from '../rate-limit/rate-limit.js';
import { adminEmails } from './admin-emails.js';
import { signInSchema, signUpSchema } from './auth.schemas.js';
import type { SignInInput, SignUpInput } from './auth.schemas.js';
import { AUTH_USER_SELECT } from './auth.types.js';
import type { AuthUser } from './auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasher,
    private readonly signInService: SignInService,
  ) {}

  @Public()
  @RateLimit('sign-up')
  @Post('sign-up')
  async signUp(@Body({ schema: signUpSchema }) body: SignUpInput): Promise<AuthUser> {
    const taken = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { pseudo: { equals: body.pseudo, mode: 'insensitive' } }],
      },
      select: { email: true },
    });
    if (taken) {
      throw new ConflictException(taken.email === body.email ? 'Cet email a déjà un compte' : 'Ce pseudo est déjà pris');
    }
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        pseudo: body.pseudo,
        passwordHash: await this.hasher.hash(body.password),
        role: adminEmails().has(body.email) ? 'ADMIN' : 'USER',
      },
      select: AUTH_USER_SELECT,
    });
    await this.signInService.signIn(String(user.id), { method: 'password' });
    return user;
  }

  @Public()
  @RateLimit('sign-in')
  @Post('sign-in')
  @HttpCode(200)
  async signIn(@Body({ schema: signInSchema }) body: SignInInput): Promise<AuthUser> {
    const row = await this.prisma.user.findUnique({
      where: { email: body.email },
      select: { ...AUTH_USER_SELECT, passwordHash: true },
    });
    // verify() compare aussi avec un faux hash quand le compte n'existe pas :
    // même temps de réponse, on ne révèle pas quels emails sont inscrits.
    const ok = await this.hasher.verify(body.password, row?.passwordHash);
    if (!row || !ok) throw new UnauthorizedException('Email ou mot de passe incorrect');

    if (this.hasher.needsRehash(row.passwordHash)) {
      await this.prisma.user.update({
        where: { id: row.id },
        data: { passwordHash: await this.hasher.hash(body.password) },
      });
    }
    await this.signInService.signIn(String(row.id), { method: 'password' });
    const { passwordHash: _omit, ...user } = row;
    return user;
  }

  @Public()
  @Post('sign-out')
  @HttpCode(204)
  async signOut() {
    await this.signInService.signOut();
  }

  /** L'utilisateur connecté, ou { user: null } pour un visiteur. */
  @Authenticate({ optional: true })
  @Can.Anyone()
  @Get('me')
  me(@CurrentUser() user: AuthUser | null): { user: AuthUser | null } {
    return { user: user ?? null };
  }
}
