// src/app/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const expectedRoles: string[] = (route.data['roles'] as string[]) ?? [];

  const userRoles = authService.getUserRoles();

  const hasAccess = userRoles.some(role => expectedRoles.includes(role));

  if (!hasAccess) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
