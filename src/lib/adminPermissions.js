export const PERM = {
  NONE: 'NONE',
  READ: 'READ',
  WRITE: 'WRITE',
  READ_WRITE: 'READ_WRITE',
};

export const PERM_MODULES = ['tcs', 'pqa', 'survey', 'feedback', 'quiz'];

export const PERM_OPTIONS = [
  { value: PERM.NONE, label: 'No access' },
  { value: PERM.READ, label: 'Read only' },
  { value: PERM.WRITE, label: 'Write only' },
  { value: PERM.READ_WRITE, label: 'Read & write' },
];

export const MODULE_LABELS = {
  tcs: 'TCS data',
  pqa: 'PQA data',
  survey: 'Survey',
  feedback: 'Feedback',
  quiz: 'Live Quiz',
};

export const DEFAULT_FORM_PERMISSIONS = {
  tcs: PERM.READ_WRITE,
  pqa: PERM.NONE,
  survey: PERM.NONE,
  feedback: PERM.NONE,
  quiz: PERM.READ_WRITE,
};

export function isSuperAdmin(user) {
  return user?.role === 'SUPER_ADMIN';
}

function legacyModulePermission(user, module) {
  if (module === 'tcs') {
    if (user?.access === 'TCS_ONLY' || user?.access === 'ALL') return PERM.READ_WRITE;
    return PERM.NONE;
  }
  if (module === 'pqa') {
    if (user?.access === 'PQA_ONLY' || user?.access === 'ALL') return PERM.READ_WRITE;
    return PERM.NONE;
  }
  if (module === 'survey' || module === 'feedback' || module === 'quiz') return PERM.READ_WRITE;
  return PERM.NONE;
}

export function normalizePermissions(user) {
  if (isSuperAdmin(user)) {
    return {
      tcs: PERM.READ_WRITE,
      pqa: PERM.READ_WRITE,
      survey: PERM.READ_WRITE,
      feedback: PERM.READ_WRITE,
      quiz: PERM.READ_WRITE,
    };
  }
  const stored = user?.permissions;
  const out = {};
  for (const module of PERM_MODULES) {
    const value = stored?.[module];
    out[module] = value && Object.values(PERM).includes(value)
      ? value
      : legacyModulePermission(user, module);
  }
  return out;
}

export function getModulePermission(user, module) {
  return normalizePermissions(user)[module] || PERM.NONE;
}

export function canReadModule(user, module) {
  if (isSuperAdmin(user)) return true;
  const perm = getModulePermission(user, module);
  return perm === PERM.READ || perm === PERM.READ_WRITE;
}

export function canWriteModule(user, module) {
  if (isSuperAdmin(user)) return true;
  const perm = getModulePermission(user, module);
  return perm === PERM.WRITE || perm === PERM.READ_WRITE;
}

export function canAccessModule(user, module) {
  return canReadModule(user, module) || canWriteModule(user, module);
}

export function permissionLabel(perm) {
  return PERM_OPTIONS.find((option) => option.value === perm)?.label || 'No access';
}

export function permissionBadge(perm) {
  if (perm === PERM.READ_WRITE) return 'R+W';
  if (perm === PERM.READ) return 'R';
  if (perm === PERM.WRITE) return 'W';
  return null;
}

export function permissionsForForm(admin) {
  return { ...normalizePermissions(admin) };
}

export function buildPermissionsForSave(formData, role) {
  if (role === 'SUPER_ADMIN') {
    return {
      tcs: PERM.READ_WRITE,
      pqa: PERM.READ_WRITE,
      survey: PERM.READ_WRITE,
      feedback: PERM.READ_WRITE,
      quiz: PERM.READ_WRITE,
    };
  }
  const perms = formData.permissions || {};
  const access = formData.access || 'TCS_ONLY';
  return {
    tcs: perms.tcs ?? (access === 'TCS_ONLY' || access === 'ALL' ? PERM.READ_WRITE : PERM.NONE),
    pqa: perms.pqa ?? (access === 'PQA_ONLY' || access === 'ALL' ? PERM.READ_WRITE : PERM.NONE),
    survey: perms.survey ?? PERM.NONE,
    feedback: perms.feedback ?? PERM.NONE,
    quiz: perms.quiz ?? PERM.READ_WRITE,
  };
}

export function syncScopePermissions(access, permissions = {}) {
  return {
    ...permissions,
    tcs: access === 'TCS_ONLY' || access === 'ALL'
      ? (permissions.tcs === PERM.NONE ? PERM.READ_WRITE : permissions.tcs)
      : PERM.NONE,
    pqa: access === 'PQA_ONLY' || access === 'ALL'
      ? (permissions.pqa === PERM.NONE ? PERM.READ_WRITE : permissions.pqa)
      : PERM.NONE,
  };
}

export function canAccessTcsEnv(user) {
  return isSuperAdmin(user) || canAccessModule(user, 'tcs');
}

export function canAccessPqaEnv(user) {
  return isSuperAdmin(user) || canAccessModule(user, 'pqa');
}

/** Live Quiz — admins and super admins (module quiz). */
export function canAccessQuizEnv(user) {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return canAccessModule(user, 'quiz');
  return false;
}
