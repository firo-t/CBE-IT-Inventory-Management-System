
import { getUser } from './auth';

export type Permission =
  | 'view'
  | 'create'
  | 'update'
  | 'return'
  | 'receive'
  | 'assign'
  | 'record'
  | 'status'
  | 'delete'
  | 'download';

export type NormalizedRole =
  | 'ADMIN'
  | 'INVENTORY_OFFICER'
  | 'TECHNICIAN'
  | 'BRANCH_MANAGER'
  | '';

const normalizeRole = (role: string = ''): NormalizedRole => {
  const value = role.toUpperCase().trim();

  if (value.includes('ADMIN')) {
    return 'ADMIN';
  }

  if (value.includes('INVENTORY OFFICER')) {
    return 'INVENTORY_OFFICER';
  }

  if (value.includes('TECHNICIAN')) {
    return 'TECHNICIAN';
  }

  if (value.includes('MANAGER')) {
    return 'BRANCH_MANAGER';
  }

  return '';
};

export const getCurrentRole = (): NormalizedRole => {
  const user = getUser();

  return normalizeRole(user?.role);
};

export const can = (
  resource: string,
  permission: Permission
): boolean => {
  const role = getCurrentRole();

  switch (resource) {
    /*
     * USERS
     *
     * Backend:
     * POST   /users
     * GET    /users
     * GET    /users/:id
     * PATCH  /users/:id
     * PATCH  /users/:id/password
     * PATCH  /users/:id/status
     *
     * All are Admin-only.
     * There is NO DELETE /users/:id endpoint.
     */
    case 'users':
      if (role !== 'ADMIN') {
        return false;
      }

      return [
        'view',
        'create',
        'update',
        'status',
      ].includes(permission);

    /*
     * BRANCHES
     *
     * Backend:
     * POST  /branches
     * GET   /branches
     * GET   /branches/:id
     * PATCH /branches/:id
     *
     * Admin-only.
     * No DELETE endpoint.
     */
    case 'branches':
      if (role !== 'ADMIN') {
        return false;
      }

      return [
        'view',
        'create',
        'update',
      ].includes(permission);

    /*
     * ASSET TYPES
     *
     * Backend:
     * POST  /asset-types
     * GET   /asset-types
     * GET   /asset-types/:id
     * PATCH /asset-types/:id
     *
     * Admin-only.
     * No DELETE endpoint.
     */
    case 'asset-types':
      if (role !== 'ADMIN') {
        return false;
      }

      return [
        'view',
        'create',
        'update',
      ].includes(permission);

    /*
     * ASSETS
     *
     * POST /assets
     *   Admin, Inventory Officer
     *
     * GET /assets
     * GET /assets/:id
     *   Admin, Inventory Officer, Branch Manager, Technician
     *
     * PATCH /assets/:id
     * PATCH /assets/:id/status
     *   Admin, Inventory Officer
     *
     * No DELETE endpoint.
     */
    case 'assets':
      if (permission === 'view') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'TECHNICIAN',
          'BRANCH_MANAGER',
        ].includes(role);
      }

      if (permission === 'create') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
        ].includes(role);
      }

      if (
        permission === 'update' ||
        permission === 'status'
      ) {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
        ].includes(role);
      }

      return false;

    /*
     * ASSIGNMENTS
     *
     * POST /assignments
     *   Admin, Inventory Officer
     *
     * GET /assignments
     * GET /assignments/:id
     *   All four roles
     *
     * PATCH /assignments/:id/return
     *   Admin, Inventory Officer
     *
     * No generic PATCH and no DELETE.
     */
    case 'assignments':
      if (permission === 'view') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'TECHNICIAN',
          'BRANCH_MANAGER',
        ].includes(role);
      }

      if (permission === 'create') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
        ].includes(role);
      }

      if (permission === 'return') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
        ].includes(role);
      }

      return false;

    /*
     * DISPATCHES
     *
     * POST /dispatches
     *   Admin, Inventory Officer
     *
     * GET /dispatches
     * GET /dispatches/:id
     *   All four roles
     *
     * PATCH /dispatches/:id/receive
     *   Admin, Inventory Officer, Branch Manager
     *
     * No generic PATCH and no DELETE.
     */
    case 'dispatches':
      if (permission === 'view') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'TECHNICIAN',
          'BRANCH_MANAGER',
        ].includes(role);
      }

      if (permission === 'create') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
        ].includes(role);
      }

      if (permission === 'receive') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'BRANCH_MANAGER',
        ].includes(role);
      }

      return false;

    /*
     * MAINTENANCE
     *
     * POST /maintenance/requests
     *   Admin, Inventory Officer, Branch Manager
     *
     * GET /maintenance/requests
     * GET /maintenance/requests/:id
     *   All four roles
     *
     * PATCH /maintenance/requests/:id
     *   Admin, Inventory Officer, Branch Manager
     *
     * PATCH /maintenance/requests/:id/status
     *   Admin, Inventory Officer, Technician
     *
     * POST /maintenance/requests/:id/records
     *   Admin, Technician
     *
     * POST /maintenance/requests/:id/assign
     *   All four roles
     *
     * No DELETE endpoint.
     */
    case 'maintenance':
      if (permission === 'view') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'TECHNICIAN',
          'BRANCH_MANAGER',
        ].includes(role);
      }

      if (permission === 'create') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'BRANCH_MANAGER',
        ].includes(role);
      }

      if (permission === 'update') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'BRANCH_MANAGER',
        ].includes(role);
      }

      if (permission === 'status') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'TECHNICIAN',
        ].includes(role);
      }

      if (permission === 'record') {
        return [
          'ADMIN',
          'TECHNICIAN',
        ].includes(role);
      }

      if (permission === 'assign') {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'BRANCH_MANAGER',
          'TECHNICIAN',
        ].includes(role);
      }

      return false;

    /*
     * ATTACHMENTS
     *
     * Keep these frontend permissions broad for now.
     * The actual attachment endpoints should ultimately
     * be checked against their backend guards as well.
     */
    case 'attachments':
      if (
        permission === 'view' ||
        permission === 'create' ||
        permission === 'download'
      ) {
        return [
          'ADMIN',
          'INVENTORY_OFFICER',
          'TECHNICIAN',
          'BRANCH_MANAGER',
        ].includes(role);
      }

      return false;

    /*
     * NOTIFICATIONS
     */
    case 'notifications':
      return [
        'ADMIN',
        'INVENTORY_OFFICER',
        'TECHNICIAN',
        'BRANCH_MANAGER',
      ].includes(role);

    /*
     * DASHBOARD
     */
    case 'dashboard':
      return [
        'ADMIN',
        'INVENTORY_OFFICER',
        'TECHNICIAN',
        'BRANCH_MANAGER',
      ].includes(role);

    /*
     * REPORTS
     *
     * This reflects the current frontend permission model.
     * Individual report endpoints should also be protected
     * by the backend.
     */
    case 'reports':
      return [
        'ADMIN',
        'INVENTORY_OFFICER',
        'TECHNICIAN',
        'BRANCH_MANAGER',
      ].includes(role);

    /*
     * AUDIT LOGS
     *
     * Admin-only.
     */
    case 'audit-logs':
      return role === 'ADMIN' && permission === 'view';

    /*
     * ROLES
     *
     * Admin-only frontend section.
     */
    case 'roles':
      return role === 'ADMIN' && permission === 'view';

    default:
      return false;
  }
};

