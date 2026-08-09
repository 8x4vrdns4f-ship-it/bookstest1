export type EmployeeBooking = {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  client_name: string;
  client_email: string | null;
  service: string;
  status: string;
  notes: string | null;
  party_size: number | null;
  service_price: number | null;
};

export type EmployeeShift = {
  id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
};

export type EmployeeRecord = {
  id: string;
  name: string;
  phone: string | null;
  position: string | null;
  available_now: boolean;
  manual_status: string | null;
  manual_status_date: string | null;
  user_id: string;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const minutesSinceMidnight = (t: string) => {
  const [h, m] = t.split(":");
  return Number(h) * 60 + Number(m);
};

export const formatTime = (t: string) => t.slice(0, 5);

export const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
