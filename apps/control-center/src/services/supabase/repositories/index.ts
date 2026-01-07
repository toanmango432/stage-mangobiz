/**
 * Repository Index
 * Exports all repository instances
 */

export { BaseRepository, APIError, type QueryOptions, type QueryResult } from './base.repository';
export { tenantsRepository, TenantsRepository } from './tenants.repository';
export { licensesRepository, LicensesRepository } from './licenses.repository';
export { storesRepository, StoresRepository } from './stores.repository';
export { adminUsersRepository, AdminUsersRepository } from './admin-users.repository';
export { devicesRepository, DevicesRepository } from './devices.repository';
