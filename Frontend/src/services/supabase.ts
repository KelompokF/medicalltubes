import axios from "axios";

const DEFAULT_SUPABASE_URL = "https://eypuqdjmyjxllybocffq.supabase.co";
const DEFAULT_SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5cHVxZGpteWp4bGx5Ym9jZmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MTIxNTcsImV4cCI6MjA5MTQ4ODE1N30.kU8KCCNyUDY9ssL6xpou1JAkq6RicoUKt8VifO0Ir40";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL).replace(/\/rest\/v1\/?$/i, "");
const SUPABASE_KEY = DEFAULT_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Supabase environment variables are missing or invalid:", {
    SUPABASE_URL,
    SUPABASE_KEY,
  });
}

const supabase = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 8000,
});

const INDONESIAN_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function getHariIndonesia(date: string) {
  if (!date) return "";
  const dayIndex = new Date(date).getDay();
  return INDONESIAN_DAYS[dayIndex] ?? "";
}

export const doctorScheduleService = {
  getSchedulesByDay: (date: string) => {
    const selectedDay = getHariIndonesia(date);
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error("Supabase environment variables VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY tidak ditemukan.");
    }
    console.debug("Supabase query getSchedulesByDay", { date, selectedDay });
    return supabase.get("doctor_schedules", {
      params: {
        select: "doctor_id,hari,jam_tersedia",
        hari: `eq.${selectedDay}`,
      },
    });
  },
  getDoctorsByIds: (ids: string[]) => {
    if (!ids || ids.length === 0) return Promise.resolve({ data: [] });
    return supabase.get("doctor_profiles", {
      params: {
        select: "id,full_name,specialization",
        id: `in.(${ids.join(",")})`,
      },
    });
  }
};
