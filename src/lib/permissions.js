// Permissions configuration and helpers for user roles

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ORGANIZADOR: 'organizador',
  ADMIN_EQUIPO: 'admin_equipo',
  AFICIONADO: 'aficionado',
};

// Simple permission checker
export function hasRole(user, allowedRoles) {
  if (!user) return false;
  if (user.role === ROLES.SUPERADMIN) return true; // Superadmin has bypass access to everything
  return allowedRoles.includes(user.role);
}

// Check if user is organization manager
import db from './db';

export function isOrganizationAdmin(userId, organizationId) {
  const admin = db.prepare('SELECT 1 FROM organization_admins WHERE organization_id = ? AND user_id = ?').get(organizationId, userId);
  return !!admin;
}

// Check if user is team admin
export function isTeamAdmin(userId, teamId) {
  const team = db.prepare('SELECT id FROM teams WHERE id = ? AND admin_id = ?').get(teamId, userId);
  return !!team;
}

// Permission checking helpers for middleware or APIs
export function canManageOrganization(user, organizationId) {
  if (!user) return false;
  if (user.role === ROLES.SUPERADMIN) return true;
  if (user.role === ROLES.ORGANIZADOR) {
    return isOrganizationAdmin(user.id, organizationId);
  }
  return false;
}

export function canManageTournament(user, tournamentId) {
  if (!user) return false;
  if (user.role === ROLES.SUPERADMIN) return true;
  if (user.role === ROLES.ORGANIZADOR) {
    const tournament = db.prepare('SELECT organization_id FROM tournaments WHERE id = ?').get(tournamentId);
    if (!tournament) return false;
    return isOrganizationAdmin(user.id, tournament.organization_id);
  }
  return false;
}

export function canManageTeam(user, teamId) {
  if (!user) return false;
  if (user.role === ROLES.SUPERADMIN) return true;
  if (user.role === ROLES.ADMIN_EQUIPO) {
    return isTeamAdmin(user.id, teamId);
  }
  if (user.role === ROLES.ORGANIZADOR) {
    // Organizers can edit team information for tournaments they manage
    const team = db.prepare('SELECT tournament_id FROM teams WHERE id = ?').get(teamId);
    if (!team) return false;
    return canManageTournament(user, team.tournament_id);
  }
  return false;
}
