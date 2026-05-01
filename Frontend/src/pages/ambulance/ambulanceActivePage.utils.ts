export type EmergencyStatus =
  | "searching"
  | "dispatched"
  | "on_my_way"
  | "on_progress"
  | "completed"
  | "cancelled"
  | string;

export type UpdatableEmergencyStatus = "on_my_way" | "on_progress" | "completed";

export interface ActiveEmergencyItem {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  created_at: string;
  location_address?: string | null;
  location_lat: number;
  location_lng: number;
  distance_km: number;
  status: EmergencyStatus;
  type: string;
  notes?: string | null;
}

export function formatEmergencyLocation(item: ActiveEmergencyItem) {
  if (item.location_address) {
    return item.location_address;
  }

  return `${item.location_lat.toFixed(5)}, ${item.location_lng.toFixed(5)}`;
}

export function buildMapsUrl(item: ActiveEmergencyItem) {
  return `https://www.google.com/maps?q=${item.location_lat},${item.location_lng}`;
}

export function buildOsmEmbedUrl(item: ActiveEmergencyItem) {
  const latPadding = 0.015;
  const lngPadding = 0.02;
  const left = item.location_lng - lngPadding;
  const right = item.location_lng + lngPadding;
  const top = item.location_lat + latPadding;
  const bottom = item.location_lat - latPadding;
  const bbox = `${left},${bottom},${right},${top}`;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${encodeURIComponent(
    `${item.location_lat},${item.location_lng}`,
  )}`;
}

export function getNextEmergencyStatusAction(status: EmergencyStatus) {
  const actionMap: Record<
    string,
    { status: UpdatableEmergencyStatus; label: string; tone: "default" | "danger" | "success" }
  > = {
    searching: {
      status: "on_my_way",
      label: "On My Way",
      tone: "default",
    },
    dispatched: {
      status: "on_my_way",
      label: "On My Way",
      tone: "default",
    },
    on_my_way: {
      status: "on_progress",
      label: "On Progress",
      tone: "danger",
    },
    on_progress: {
      status: "completed",
      label: "Complete Case",
      tone: "success",
    },
  };

  return actionMap[status] ?? null;
}
