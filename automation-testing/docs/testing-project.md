MASTER TEST SCENARIO
This document is the SINGLE SOURCE OF TRUTH for all automated testing scenarios.

(Jenis testing) Functional

## [MODULE: Authentication]

Test Case TC-001
(type testing) Positive
Test Scenario:
Pengguna berhasil mensubmit form Login

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Login"
2. Isi field "Email" dengan email valid
3. Isi field "Password" dengan password valid
4. Klik tombol "Login"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan halaman "Dashboard" dan sesi pengguna aktif tanpa error.

---

Test Case TC-002
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Login karena Email kosong

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Login"
2. Biarkan field "Email" kosong
3. Isi field "Password" dengan password valid
4. Klik tombol "Login"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Email".

---

Test Case TC-003
(type testing) EP
Test Scenario:
Pengguna gagal mensubmit Login dengan format Email invalid (EP)

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Login"
2. Isi field "Email" dengan format tanpa @
3. Isi field "Password" dengan password valid
4. Klik tombol "Login"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi format email.

---

Test Case TC-004
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Login karena Password kosong

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Login"
2. Isi field "Email" dengan email valid
3. Biarkan field "Password" kosong
4. Klik tombol "Login"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Password".

---

Test Case TC-005
(type testing) BVA
Test Scenario:
Pengguna gagal mensubmit Login dengan Password kurang dari 6 karakter (BVA Min-1)

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Login"
2. Isi field "Email" dengan email valid
3. Isi field "Password" dengan 5 karakter
4. Klik tombol "Login"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi minimum karakter.

---

Test Case TC-006
(type testing) Positive
Test Scenario:
Pengguna berhasil mensubmit form Register

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Register"
2. Isi field "Nama Lengkap" dengan text valid
3. Isi field "Email" dengan email valid
4. Isi field "Password" dengan password valid
5. Isi field "Confirm Password" dengan password valid
6. Klik tombol "Register"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan pesan sukses akun berhasil dibuat.

---

Test Case TC-007
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Register karena Nama Lengkap kosong

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Register"
2. Biarkan field "Nama Lengkap" kosong
3. Isi field "Email" dengan email valid
4. Isi field "Password" dengan password valid
5. Isi field "Confirm Password" dengan password valid
6. Klik tombol "Register"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Nama Lengkap".

---

Test Case TC-008
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Register karena Email kosong

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Register"
2. Isi field "Nama Lengkap" dengan text valid
3. Biarkan field "Email" kosong
4. Isi field "Password" dengan password valid
5. Isi field "Confirm Password" dengan password valid
6. Klik tombol "Register"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Email".

---

Test Case TC-009
(type testing) EP
Test Scenario:
Pengguna gagal mensubmit Register dengan format Email invalid (EP)

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Register"
2. Isi field "Nama Lengkap" dengan text valid
3. Isi field "Email" dengan format tanpa @
4. Isi field "Password" dengan password valid
5. Isi field "Confirm Password" dengan password valid
6. Klik tombol "Register"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi format email.

---

Test Case TC-010
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Register karena Password kosong

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Register"
2. Isi field "Nama Lengkap" dengan text valid
3. Isi field "Email" dengan email valid
4. Biarkan field "Password" kosong
5. Isi field "Confirm Password" dengan password valid
6. Klik tombol "Register"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Password".

---

Test Case TC-011
(type testing) BVA
Test Scenario:
Pengguna gagal mensubmit Register dengan Password kurang dari 6 karakter (BVA Min-1)

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Register"
2. Isi field "Nama Lengkap" dengan text valid
3. Isi field "Email" dengan email valid
4. Isi field "Password" dengan 5 karakter
5. Isi field "Confirm Password" dengan password valid
6. Klik tombol "Register"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi minimum karakter.

---

Test Case TC-012
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Register karena Confirm Password kosong

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Register"
2. Isi field "Nama Lengkap" dengan text valid
3. Isi field "Email" dengan email valid
4. Isi field "Password" dengan password valid
5. Biarkan field "Confirm Password" kosong
6. Klik tombol "Register"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Confirm Password".

---

Test Case TC-013
(type testing) BVA
Test Scenario:
Pengguna gagal mensubmit Register dengan Confirm Password kurang dari 6 karakter (BVA Min-1)

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Register"
2. Isi field "Nama Lengkap" dengan text valid
3. Isi field "Email" dengan email valid
4. Isi field "Password" dengan password valid
5. Isi field "Confirm Password" dengan 5 karakter
6. Klik tombol "Register"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi minimum karakter.

---

Test Case TC-014
(type testing) Positive
Test Scenario:
Pengguna berhasil mensubmit form Forgot Password

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Forgot Password"
2. Isi field "Email" dengan email valid
3. Klik tombol "Reset Password"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengirimkan link reset ke email.

---

Test Case TC-015
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Forgot Password karena Email kosong

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Forgot Password"
2. Biarkan field "Email" kosong
3. Klik tombol "Reset Password"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Email".

---

Test Case TC-016
(type testing) EP
Test Scenario:
Pengguna gagal mensubmit Forgot Password dengan format Email invalid (EP)

Pre Condition:
* Pengguna telah membuka aplikasi web

Steps (WAJIB LENGKAP):
1. Buka halaman "Forgot Password"
2. Isi field "Email" dengan format tanpa @
3. Klik tombol "Reset Password"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi format email.

---

## [MODULE: Patient]

Test Case TC-017
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat Dashboard Pasien

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Dashboard"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan ringkasan data pasien.

---

Test Case TC-018
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Daftar Dokter

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Search Doctor"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Daftar Dokter dengan data yang sesuai.

---

Test Case TC-019
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Daftar Dokter

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Search Doctor"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Daftar Dokter.

---

Test Case TC-020
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Daftar Dokter

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Search Doctor"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-021
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Lihat Detail pada data tabel Daftar Dokter

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Search Doctor"
2. Klik tombol "Lihat Detail" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Lihat Detail tanpa error.

---

Test Case TC-022
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Lihat Detail pada data tabel Daftar Dokter

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Search Doctor"
2. Klik tombol "Lihat Detail" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Lihat Detail dan tidak ada data yang berubah.

---

Test Case TC-023
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Booking Konsultasi pada data tabel Daftar Dokter

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Search Doctor"
2. Klik tombol "Booking Konsultasi" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Booking Konsultasi tanpa error.

---

Test Case TC-024
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Booking Konsultasi pada data tabel Daftar Dokter

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Search Doctor"
2. Klik tombol "Booking Konsultasi" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Booking Konsultasi dan tidak ada data yang berubah.

---

Test Case TC-025
(type testing) Positive
Test Scenario:
Pengguna berhasil mensubmit form Health Records

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Health Records"
2. Isi field "Diagnosis" dengan text valid
3. Isi field "Tanggal" dengan date valid
4. Isi field "Catatan" dengan text valid
5. Klik tombol "Simpan Rekam Medis"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menyimpan rekam medis baru.

---

Test Case TC-026
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Health Records karena Diagnosis kosong

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Health Records"
2. Biarkan field "Diagnosis" kosong
3. Isi field "Tanggal" dengan date valid
4. Isi field "Catatan" dengan text valid
5. Klik tombol "Simpan Rekam Medis"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Diagnosis".

---

Test Case TC-027
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Health Records karena Tanggal kosong

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Health Records"
2. Isi field "Diagnosis" dengan text valid
3. Biarkan field "Tanggal" kosong
4. Isi field "Catatan" dengan text valid
5. Klik tombol "Simpan Rekam Medis"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Tanggal".

---

Test Case TC-028
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Health Records karena Catatan kosong

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Health Records"
2. Isi field "Diagnosis" dengan text valid
3. Isi field "Tanggal" dengan date valid
4. Biarkan field "Catatan" kosong
5. Klik tombol "Simpan Rekam Medis"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Catatan".

---

Test Case TC-029
(type testing) Positive
Test Scenario:
Pengguna berhasil mensubmit form Home Visit

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit"
2. Isi field "Alamat" dengan text valid
3. Isi field "Keluhan" dengan text valid
4. Isi field "Jadwal" dengan date valid
5. Klik tombol "Booking"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem membuat reservasi home visit.

---

Test Case TC-030
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Home Visit karena Alamat kosong

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit"
2. Biarkan field "Alamat" kosong
3. Isi field "Keluhan" dengan text valid
4. Isi field "Jadwal" dengan date valid
5. Klik tombol "Booking"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Alamat".

---

Test Case TC-031
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Home Visit karena Keluhan kosong

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit"
2. Isi field "Alamat" dengan text valid
3. Biarkan field "Keluhan" kosong
4. Isi field "Jadwal" dengan date valid
5. Klik tombol "Booking"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Keluhan".

---

Test Case TC-032
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Home Visit karena Jadwal kosong

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit"
2. Isi field "Alamat" dengan text valid
3. Isi field "Keluhan" dengan text valid
4. Biarkan field "Jadwal" kosong
5. Klik tombol "Booking"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Jadwal".

---

Test Case TC-033
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Riwayat Kunjungan

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit History"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Riwayat Kunjungan dengan data yang sesuai.

---

Test Case TC-034
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Riwayat Kunjungan

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit History"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Riwayat Kunjungan.

---

Test Case TC-035
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Riwayat Kunjungan

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit History"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-036
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Lihat Detail pada data tabel Riwayat Kunjungan

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit History"
2. Klik tombol "Lihat Detail" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Lihat Detail tanpa error.

---

Test Case TC-037
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Lihat Detail pada data tabel Riwayat Kunjungan

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit History"
2. Klik tombol "Lihat Detail" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Lihat Detail dan tidak ada data yang berubah.

---

Test Case TC-038
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Batal pada data tabel Riwayat Kunjungan

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit History"
2. Klik tombol "Batal" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Batal tanpa error.

---

Test Case TC-039
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Batal pada data tabel Riwayat Kunjungan

Pre Condition:
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visit History"
2. Klik tombol "Batal" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Batal dan tidak ada data yang berubah.

---

Test Case TC-040
(type testing) Positive
Test Scenario:
Pengguna berhasil mensubmit form Profile

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Profile"
2. Isi field "Tempat Lahir" dengan text valid
3. Isi field "Tanggal Lahir" dengan date valid
4. Isi field "Golongan Darah" dengan text valid
5. Klik tombol "Simpan Profil"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem memperbarui data profil.

---

Test Case TC-041
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Profile karena Tempat Lahir kosong

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Profile"
2. Biarkan field "Tempat Lahir" kosong
3. Isi field "Tanggal Lahir" dengan date valid
4. Isi field "Golongan Darah" dengan text valid
5. Klik tombol "Simpan Profil"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Tempat Lahir".

---

Test Case TC-042
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Profile karena Tanggal Lahir kosong

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Profile"
2. Isi field "Tempat Lahir" dengan text valid
3. Biarkan field "Tanggal Lahir" kosong
4. Isi field "Golongan Darah" dengan text valid
5. Klik tombol "Simpan Profil"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Tanggal Lahir".

---

Test Case TC-043
(type testing) Negative
Test Scenario:
Pengguna gagal mensubmit Profile karena Golongan Darah kosong

Pre Condition:
* Pengguna telah membuka aplikasi web
* Pengguna telah login sebagai Patient

Steps (WAJIB LENGKAP):
1. Buka halaman "Profile"
2. Isi field "Tempat Lahir" dengan text valid
3. Isi field "Tanggal Lahir" dengan date valid
4. Biarkan field "Golongan Darah" kosong
5. Klik tombol "Simpan Profil"

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem memunculkan pesan validasi pada field "Golongan Darah".

---

## [MODULE: Admin]

Test Case TC-044
(type testing) Positive
Test Scenario:
Admin berhasil melihat Dashboard

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Dashboard"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan grafik dan ringkasan data.

---

Test Case TC-045
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Daftar Pengguna

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Users"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Daftar Pengguna dengan data yang sesuai.

---

Test Case TC-046
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Daftar Pengguna

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Users"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Daftar Pengguna.

---

Test Case TC-047
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Daftar Pengguna

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Users"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-048
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Edit pada data tabel Daftar Pengguna

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Users"
2. Klik tombol "Edit" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Edit tanpa error.

---

Test Case TC-049
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Edit pada data tabel Daftar Pengguna

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Users"
2. Klik tombol "Edit" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Edit dan tidak ada data yang berubah.

---

Test Case TC-050
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Hapus pada data tabel Daftar Pengguna

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Users"
2. Klik tombol "Hapus" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Hapus tanpa error.

---

Test Case TC-051
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Hapus pada data tabel Daftar Pengguna

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Users"
2. Klik tombol "Hapus" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Hapus dan tidak ada data yang berubah.

---

Test Case TC-052
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Reset Password pada data tabel Daftar Pengguna

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Users"
2. Klik tombol "Reset Password" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Reset Password tanpa error.

---

Test Case TC-053
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Reset Password pada data tabel Daftar Pengguna

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Users"
2. Klik tombol "Reset Password" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Reset Password dan tidak ada data yang berubah.

---

Test Case TC-054
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Daftar Resep

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Prescriptions"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Daftar Resep dengan data yang sesuai.

---

Test Case TC-055
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Daftar Resep

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Prescriptions"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Daftar Resep.

---

Test Case TC-056
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Daftar Resep

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Prescriptions"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-057
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Verifikasi pada data tabel Daftar Resep

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Prescriptions"
2. Klik tombol "Verifikasi" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Verifikasi tanpa error.

---

Test Case TC-058
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Verifikasi pada data tabel Daftar Resep

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Prescriptions"
2. Klik tombol "Verifikasi" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Verifikasi dan tidak ada data yang berubah.

---

Test Case TC-059
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Tolak pada data tabel Daftar Resep

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Prescriptions"
2. Klik tombol "Tolak" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Tolak tanpa error.

---

Test Case TC-060
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Tolak pada data tabel Daftar Resep

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Prescriptions"
2. Klik tombol "Tolak" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Tolak dan tidak ada data yang berubah.

---

Test Case TC-061
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Laporan Sistem

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Reports"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Laporan Sistem dengan data yang sesuai.

---

Test Case TC-062
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Laporan Sistem

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Reports"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Laporan Sistem.

---

Test Case TC-063
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Laporan Sistem

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Reports"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-064
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Export PDF pada data tabel Laporan Sistem

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Reports"
2. Klik tombol "Export PDF" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Export PDF tanpa error.

---

Test Case TC-065
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Export PDF pada data tabel Laporan Sistem

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Reports"
2. Klik tombol "Export PDF" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Export PDF dan tidak ada data yang berubah.

---

Test Case TC-066
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Export Excel pada data tabel Laporan Sistem

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Reports"
2. Klik tombol "Export Excel" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Export Excel tanpa error.

---

Test Case TC-067
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Export Excel pada data tabel Laporan Sistem

Pre Condition:
* Pengguna telah login sebagai Admin

Steps (WAJIB LENGKAP):
1. Buka halaman "Admin Reports"
2. Klik tombol "Export Excel" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Export Excel dan tidak ada data yang berubah.

---

## [MODULE: Doctor]

Test Case TC-068
(type testing) Positive
Test Scenario:
Dokter berhasil melihat Dashboard

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Doctor Dashboard"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan jadwal hari ini dan jumlah pasien.

---

Test Case TC-069
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Daftar Pasien

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Patients"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Daftar Pasien dengan data yang sesuai.

---

Test Case TC-070
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Daftar Pasien

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Patients"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Daftar Pasien.

---

Test Case TC-071
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Daftar Pasien

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Patients"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-072
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Lihat Rekam Medis pada data tabel Daftar Pasien

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Patients"
2. Klik tombol "Lihat Rekam Medis" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Lihat Rekam Medis tanpa error.

---

Test Case TC-073
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Lihat Rekam Medis pada data tabel Daftar Pasien

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Patients"
2. Klik tombol "Lihat Rekam Medis" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Lihat Rekam Medis dan tidak ada data yang berubah.

---

Test Case TC-074
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Tulis Resep pada data tabel Daftar Pasien

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Patients"
2. Klik tombol "Tulis Resep" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Tulis Resep tanpa error.

---

Test Case TC-075
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Tulis Resep pada data tabel Daftar Pasien

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Patients"
2. Klik tombol "Tulis Resep" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Tulis Resep dan tidak ada data yang berubah.

---

Test Case TC-076
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Jadwal Konsultasi

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Consultations"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Jadwal Konsultasi dengan data yang sesuai.

---

Test Case TC-077
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Jadwal Konsultasi

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Consultations"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Jadwal Konsultasi.

---

Test Case TC-078
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Jadwal Konsultasi

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Consultations"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-079
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Mulai Chat pada data tabel Jadwal Konsultasi

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Consultations"
2. Klik tombol "Mulai Chat" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Mulai Chat tanpa error.

---

Test Case TC-080
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Mulai Chat pada data tabel Jadwal Konsultasi

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Consultations"
2. Klik tombol "Mulai Chat" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Mulai Chat dan tidak ada data yang berubah.

---

Test Case TC-081
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Selesai pada data tabel Jadwal Konsultasi

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Consultations"
2. Klik tombol "Selesai" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Selesai tanpa error.

---

Test Case TC-082
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Selesai pada data tabel Jadwal Konsultasi

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Consultations"
2. Klik tombol "Selesai" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Selesai dan tidak ada data yang berubah.

---

Test Case TC-083
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Batal pada data tabel Jadwal Konsultasi

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Consultations"
2. Klik tombol "Batal" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Batal tanpa error.

---

Test Case TC-084
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Batal pada data tabel Jadwal Konsultasi

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Consultations"
2. Klik tombol "Batal" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Batal dan tidak ada data yang berubah.

---

Test Case TC-085
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Jadwal Kunjungan

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visits"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Jadwal Kunjungan dengan data yang sesuai.

---

Test Case TC-086
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Jadwal Kunjungan

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visits"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Jadwal Kunjungan.

---

Test Case TC-087
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Jadwal Kunjungan

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visits"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-088
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Terima pada data tabel Jadwal Kunjungan

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visits"
2. Klik tombol "Terima" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Terima tanpa error.

---

Test Case TC-089
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Terima pada data tabel Jadwal Kunjungan

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visits"
2. Klik tombol "Terima" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Terima dan tidak ada data yang berubah.

---

Test Case TC-090
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Tolak pada data tabel Jadwal Kunjungan

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visits"
2. Klik tombol "Tolak" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Tolak tanpa error.

---

Test Case TC-091
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Tolak pada data tabel Jadwal Kunjungan

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visits"
2. Klik tombol "Tolak" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Tolak dan tidak ada data yang berubah.

---

Test Case TC-092
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Selesai pada data tabel Jadwal Kunjungan

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visits"
2. Klik tombol "Selesai" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Selesai tanpa error.

---

Test Case TC-093
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Selesai pada data tabel Jadwal Kunjungan

Pre Condition:
* Pengguna telah login sebagai Doctor

Steps (WAJIB LENGKAP):
1. Buka halaman "Home Visits"
2. Klik tombol "Selesai" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Selesai dan tidak ada data yang berubah.

---

## [MODULE: Ambulance]

Test Case TC-094
(type testing) Positive
Test Scenario:
Ambulans berhasil melihat Dashboard

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "Ambulance Dashboard"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan status ketersediaan ambulans.

---

Test Case TC-095
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Permintaan Aktif

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "Active Request"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Permintaan Aktif dengan data yang sesuai.

---

Test Case TC-096
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Permintaan Aktif

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "Active Request"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Permintaan Aktif.

---

Test Case TC-097
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Permintaan Aktif

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "Active Request"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-098
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Terima Panggilan pada data tabel Permintaan Aktif

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "Active Request"
2. Klik tombol "Terima Panggilan" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Terima Panggilan tanpa error.

---

Test Case TC-099
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Terima Panggilan pada data tabel Permintaan Aktif

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "Active Request"
2. Klik tombol "Terima Panggilan" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Terima Panggilan dan tidak ada data yang berubah.

---

Test Case TC-100
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Selesai pada data tabel Permintaan Aktif

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "Active Request"
2. Klik tombol "Selesai" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Selesai tanpa error.

---

Test Case TC-101
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Selesai pada data tabel Permintaan Aktif

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "Active Request"
2. Klik tombol "Selesai" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Selesai dan tidak ada data yang berubah.

---

Test Case TC-102
(type testing) Positive
Test Scenario:
Pengguna berhasil melihat daftar data pada tabel Riwayat Panggilan

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "History"

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan tabel Riwayat Panggilan dengan data yang sesuai.

---

Test Case TC-103
(type testing) Positive
Test Scenario:
Pengguna berhasil mencari data pada tabel Riwayat Panggilan

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "History"
2. Ketik nama valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem menampilkan data yang dicari pada tabel Riwayat Panggilan.

---

Test Case TC-104
(type testing) Negative
Test Scenario:
Pengguna gagal mencari data yang tidak tersedia pada tabel Riwayat Panggilan

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "History"
2. Ketik data tidak valid pada field "Search"
3. Tekan Enter

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem menampilkan tabel dalam kondisi empty state.

---

Test Case TC-105
(type testing) Positive
Test Scenario:
Pengguna berhasil melakukan aksi Lihat Detail pada data tabel Riwayat Panggilan

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "History"
2. Klik tombol "Lihat Detail" pada baris data pertama
3. Klik "Ya" pada modal konfirmasi

Expected Result:
Pengguna berhasil memproses instruksi sehingga sistem mengeksekusi aksi Lihat Detail tanpa error.

---

Test Case TC-106
(type testing) Negative
Test Scenario:
Pengguna membatalkan aksi Lihat Detail pada data tabel Riwayat Panggilan

Pre Condition:
* Pengguna telah login sebagai Ambulance

Steps (WAJIB LENGKAP):
1. Buka halaman "History"
2. Klik tombol "Lihat Detail" pada baris data pertama
3. Klik "Batal" pada modal konfirmasi

Expected Result:
Pengguna gagal memproses instruksi sehingga sistem membatalkan aksi Lihat Detail dan tidak ada data yang berubah.

---

