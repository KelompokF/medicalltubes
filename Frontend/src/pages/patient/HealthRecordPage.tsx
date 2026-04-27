import { useEffect, useState } from "react";
import api from "@/services/api";

type HealthRecord = {
  id: string;
  description: string;
  created_at: string;
};

export default function HealthRecordPage() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/health-record")
      .then((res) => {
        setRecords(res.data);
      })
      .catch((err) => {
        console.error("ERROR FETCH:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Riwayat Kesehatan</h1>

      {loading ? (
        <p>Loading...</p>
      ) : records.length === 0 ? (
        <p>Tidak ada data kesehatan</p>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="p-4 border rounded-lg shadow-sm"
            >
              <p className="font-semibold">{record.description}</p>
              <p className="text-sm text-gray-500">
                {new Date(record.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}