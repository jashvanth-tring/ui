/**
 * Label for requirement dropdowns. API may return client as flat ClientProfile
 * (clientName on client) or nested client.clientProfile; location is optional.
 */
export function formatRequirementSelectLabel(r: {
  id?: number;
  client?: {
    clientName?: string;
    clientProfile?: { clientName?: string };
    location?: unknown;
  } | null;
  positionDetails?: { positionName?: string } | null;
  relExp?: number | string | null;
}): string {
  const clientName =
    r?.client?.clientName ?? r?.client?.clientProfile?.clientName ?? '';
  const loc = r?.client?.location;
  const locationPart =
   loc != null && typeof loc === 'string' && loc.trim() !== '' ? loc : '';
  const position = r?.positionDetails?.positionName ?? '';
  const exp =
    r?.relExp != null && r?.relExp !== ''
      ? `${r.relExp} yrs`
      : '';
  const joined = [clientName, locationPart, position, exp]
    .filter((p) => p !== '')
    .join(' - ');
  return joined || (r?.id != null ? `Requirement #${r.id}` : '');
}

export function requirementClientDisplayName(
  client:
    | {
      clientName?: string;
      clientProfile?: { clientName?: string };
    }
    | null
    | undefined,
  fallback = 'Unknown Client',
): string {
  const name =
    client?.clientName ?? client?.clientProfile?.clientName ?? '';
  return name || fallback;
}
