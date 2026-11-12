import { Policy } from '@nestjs/authorization';
import type { AuthUser } from './auth.types.js';

/** Back-office : réservé aux ADMIN. */
@Policy()
export class AdminPolicy {
  manage(user: AuthUser | null) {
    return user?.role === 'ADMIN';
  }
}
