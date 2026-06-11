# FEATURE INVENTORY

MODULE: Authentication
  FEATURE: Login
    - Pengguna berhasil mensubmit form Login
    - Pengguna gagal mensubmit Login karena Email kosong
    - Pengguna gagal mensubmit Login dengan format Email invalid (EP)
    - Pengguna gagal mensubmit Login karena Password kosong
    - Pengguna gagal mensubmit Login dengan Password kurang dari 6 karakter (BVA Min-1)
  FEATURE: Register
    - Pengguna berhasil mensubmit form Register
    - Pengguna gagal mensubmit Register karena Nama Lengkap kosong
    - Pengguna gagal mensubmit Register karena Email kosong
    - Pengguna gagal mensubmit Register dengan format Email invalid (EP)
    - Pengguna gagal mensubmit Register karena Password kosong
    - Pengguna gagal mensubmit Register dengan Password kurang dari 6 karakter (BVA Min-1)
    - Pengguna gagal mensubmit Register karena Confirm Password kosong
    - Pengguna gagal mensubmit Register dengan Confirm Password kurang dari 6 karakter (BVA Min-1)
  FEATURE: Forgot Password
    - Pengguna berhasil mensubmit form Forgot Password
    - Pengguna gagal mensubmit Forgot Password karena Email kosong
    - Pengguna gagal mensubmit Forgot Password dengan format Email invalid (EP)

MODULE: Patient
  FEATURE: Patient Dashboard
    - Pengguna berhasil melihat Dashboard Pasien
  FEATURE: Search Doctor
    - Pengguna berhasil melihat daftar data pada tabel Daftar Dokter
    - Pengguna berhasil mencari data pada tabel Daftar Dokter
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Daftar Dokter
    - Pengguna berhasil melakukan aksi Lihat Detail pada data tabel Daftar Dokter
    - Pengguna membatalkan aksi Lihat Detail pada data tabel Daftar Dokter
    - Pengguna berhasil melakukan aksi Booking Konsultasi pada data tabel Daftar Dokter
    - Pengguna membatalkan aksi Booking Konsultasi pada data tabel Daftar Dokter
  FEATURE: Health Records
    - Pengguna berhasil mensubmit form Health Records
    - Pengguna gagal mensubmit Health Records karena Diagnosis kosong
    - Pengguna gagal mensubmit Health Records karena Tanggal kosong
    - Pengguna gagal mensubmit Health Records karena Catatan kosong
  FEATURE: Home Visit Booking
    - Pengguna berhasil mensubmit form Home Visit
    - Pengguna gagal mensubmit Home Visit karena Alamat kosong
    - Pengguna gagal mensubmit Home Visit karena Keluhan kosong
    - Pengguna gagal mensubmit Home Visit karena Jadwal kosong
  FEATURE: Home Visit History
    - Pengguna berhasil melihat daftar data pada tabel Riwayat Kunjungan
    - Pengguna berhasil mencari data pada tabel Riwayat Kunjungan
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Riwayat Kunjungan
    - Pengguna berhasil melakukan aksi Lihat Detail pada data tabel Riwayat Kunjungan
    - Pengguna membatalkan aksi Lihat Detail pada data tabel Riwayat Kunjungan
    - Pengguna berhasil melakukan aksi Batal pada data tabel Riwayat Kunjungan
    - Pengguna membatalkan aksi Batal pada data tabel Riwayat Kunjungan
  FEATURE: UserProfile
    - Pengguna berhasil mensubmit form Profile
    - Pengguna gagal mensubmit Profile karena Tempat Lahir kosong
    - Pengguna gagal mensubmit Profile karena Tanggal Lahir kosong
    - Pengguna gagal mensubmit Profile karena Golongan Darah kosong

MODULE: Admin
  FEATURE: Admin Dashboard
    - Admin berhasil melihat Dashboard
  FEATURE: User Management
    - Pengguna berhasil melihat daftar data pada tabel Daftar Pengguna
    - Pengguna berhasil mencari data pada tabel Daftar Pengguna
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Daftar Pengguna
    - Pengguna berhasil melakukan aksi Edit pada data tabel Daftar Pengguna
    - Pengguna membatalkan aksi Edit pada data tabel Daftar Pengguna
    - Pengguna berhasil melakukan aksi Hapus pada data tabel Daftar Pengguna
    - Pengguna membatalkan aksi Hapus pada data tabel Daftar Pengguna
    - Pengguna berhasil melakukan aksi Reset Password pada data tabel Daftar Pengguna
    - Pengguna membatalkan aksi Reset Password pada data tabel Daftar Pengguna
  FEATURE: Prescriptions Management
    - Pengguna berhasil melihat daftar data pada tabel Daftar Resep
    - Pengguna berhasil mencari data pada tabel Daftar Resep
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Daftar Resep
    - Pengguna berhasil melakukan aksi Verifikasi pada data tabel Daftar Resep
    - Pengguna membatalkan aksi Verifikasi pada data tabel Daftar Resep
    - Pengguna berhasil melakukan aksi Tolak pada data tabel Daftar Resep
    - Pengguna membatalkan aksi Tolak pada data tabel Daftar Resep
  FEATURE: Reports Management
    - Pengguna berhasil melihat daftar data pada tabel Laporan Sistem
    - Pengguna berhasil mencari data pada tabel Laporan Sistem
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Laporan Sistem
    - Pengguna berhasil melakukan aksi Export PDF pada data tabel Laporan Sistem
    - Pengguna membatalkan aksi Export PDF pada data tabel Laporan Sistem
    - Pengguna berhasil melakukan aksi Export Excel pada data tabel Laporan Sistem
    - Pengguna membatalkan aksi Export Excel pada data tabel Laporan Sistem

MODULE: Doctor
  FEATURE: Doctor Dashboard
    - Dokter berhasil melihat Dashboard
  FEATURE: Doctor Patients
    - Pengguna berhasil melihat daftar data pada tabel Daftar Pasien
    - Pengguna berhasil mencari data pada tabel Daftar Pasien
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Daftar Pasien
    - Pengguna berhasil melakukan aksi Lihat Rekam Medis pada data tabel Daftar Pasien
    - Pengguna membatalkan aksi Lihat Rekam Medis pada data tabel Daftar Pasien
    - Pengguna berhasil melakukan aksi Tulis Resep pada data tabel Daftar Pasien
    - Pengguna membatalkan aksi Tulis Resep pada data tabel Daftar Pasien
  FEATURE: Doctor Consultations
    - Pengguna berhasil melihat daftar data pada tabel Jadwal Konsultasi
    - Pengguna berhasil mencari data pada tabel Jadwal Konsultasi
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Jadwal Konsultasi
    - Pengguna berhasil melakukan aksi Mulai Chat pada data tabel Jadwal Konsultasi
    - Pengguna membatalkan aksi Mulai Chat pada data tabel Jadwal Konsultasi
    - Pengguna berhasil melakukan aksi Selesai pada data tabel Jadwal Konsultasi
    - Pengguna membatalkan aksi Selesai pada data tabel Jadwal Konsultasi
    - Pengguna berhasil melakukan aksi Batal pada data tabel Jadwal Konsultasi
    - Pengguna membatalkan aksi Batal pada data tabel Jadwal Konsultasi
  FEATURE: Doctor Home Visits
    - Pengguna berhasil melihat daftar data pada tabel Jadwal Kunjungan
    - Pengguna berhasil mencari data pada tabel Jadwal Kunjungan
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Jadwal Kunjungan
    - Pengguna berhasil melakukan aksi Terima pada data tabel Jadwal Kunjungan
    - Pengguna membatalkan aksi Terima pada data tabel Jadwal Kunjungan
    - Pengguna berhasil melakukan aksi Tolak pada data tabel Jadwal Kunjungan
    - Pengguna membatalkan aksi Tolak pada data tabel Jadwal Kunjungan
    - Pengguna berhasil melakukan aksi Selesai pada data tabel Jadwal Kunjungan
    - Pengguna membatalkan aksi Selesai pada data tabel Jadwal Kunjungan

MODULE: Ambulance
  FEATURE: Ambulance Dashboard
    - Ambulans berhasil melihat Dashboard
  FEATURE: Ambulance Active
    - Pengguna berhasil melihat daftar data pada tabel Permintaan Aktif
    - Pengguna berhasil mencari data pada tabel Permintaan Aktif
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Permintaan Aktif
    - Pengguna berhasil melakukan aksi Terima Panggilan pada data tabel Permintaan Aktif
    - Pengguna membatalkan aksi Terima Panggilan pada data tabel Permintaan Aktif
    - Pengguna berhasil melakukan aksi Selesai pada data tabel Permintaan Aktif
    - Pengguna membatalkan aksi Selesai pada data tabel Permintaan Aktif
  FEATURE: Ambulance History
    - Pengguna berhasil melihat daftar data pada tabel Riwayat Panggilan
    - Pengguna berhasil mencari data pada tabel Riwayat Panggilan
    - Pengguna gagal mencari data yang tidak tersedia pada tabel Riwayat Panggilan
    - Pengguna berhasil melakukan aksi Lihat Detail pada data tabel Riwayat Panggilan
    - Pengguna membatalkan aksi Lihat Detail pada data tabel Riwayat Panggilan

