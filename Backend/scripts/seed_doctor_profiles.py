"""
Seed Script: Create doctor profiles for all 20 existing doctor users.
Assigns realistic specializations, hospitals across DKI Jakarta with GPS coordinates.

Run with:
    python scripts/seed_doctor_profiles.py
"""

import sys
import os
import uuid
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.doctor_profile import DoctorProfile


DOCTOR_PROFILES = [
    {
        "email": "doctor1@example.com",
        "full_name": "Dr. Andi Saputra, Sp.JP",
        "specialization": "Kardiologi",
        "hospital_name": "RS Jantung dan Pembuluh Darah Harapan Kita",
        "hospital_address": "Jl. Letjen S. Parman Kav.87, Slipi, Jakarta Barat",
        "about": "Spesialis jantung dan pembuluh darah dengan pengalaman lebih dari 15 tahun. Ahli dalam penanganan penyakit jantung koroner, gagal jantung, dan aritmia. Pernah menjalani fellowship di National Heart Centre Singapore.",
        "experience_years": 15,
        "fee": 350000,
        "phone": "021-5684093",
        "lat": -6.1688,
        "lng": 106.7907,
        "rating": 4.9,
        "total_reviews": 287,
        "total_patients": 1520,
    },
    {
        "email": "doctor2@example.com",
        "full_name": "Dr. Siti Rahma, Sp.KK",
        "specialization": "Dermatologi",
        "hospital_name": "RS Siloam Semanggi",
        "hospital_address": "Jl. Garnisun Dalam No.2-3, Karet Semanggi, Jakarta Selatan",
        "about": "Dokter spesialis kulit dan kelamin berpengalaman dalam menangani masalah kulit seperti jerawat, eksim, psoriasis, dan prosedur estetika. Lulusan terbaik FKUI.",
        "experience_years": 10,
        "fee": 300000,
        "phone": "021-29307888",
        "lat": -6.2226,
        "lng": 106.8143,
        "rating": 4.8,
        "total_reviews": 194,
        "total_patients": 980,
    },
    {
        "email": "doctor3@example.com",
        "full_name": "Dr. Budi Hartono, Sp.A",
        "specialization": "Pediatri",
        "hospital_name": "RS Pondok Indah - Bintaro Jaya",
        "hospital_address": "Jl. MH Thamrin No.3, Pondok Jaya, Tangerang Selatan",
        "about": "Dokter spesialis anak yang fokus pada tumbuh kembang anak, imunisasi, dan penyakit anak. Berpengalaman 12 tahun dengan pendekatan ramah anak.",
        "experience_years": 12,
        "fee": 280000,
        "phone": "021-80828888",
        "lat": -6.2846,
        "lng": 106.7143,
        "rating": 4.7,
        "total_reviews": 356,
        "total_patients": 2100,
    },
    {
        "email": "doctor4@example.com",
        "full_name": "Dr. Maya Sari, Sp.OG",
        "specialization": "Obstetri & Ginekologi",
        "hospital_name": "RS Bunda Jakarta",
        "hospital_address": "Jl. Teuku Cik Ditiro No.28, Menteng, Jakarta Pusat",
        "about": "Spesialis kebidanan dan kandungan dengan keahlian dalam kehamilan risiko tinggi, persalinan, dan masalah kesehatan reproduksi wanita.",
        "experience_years": 14,
        "fee": 400000,
        "phone": "021-31923344",
        "lat": -6.1944,
        "lng": 106.8382,
        "rating": 4.9,
        "total_reviews": 412,
        "total_patients": 1850,
    },
    {
        "email": "doctor5@example.com",
        "full_name": "Dr. Reza Firmansyah, Sp.PD",
        "specialization": "Penyakit Dalam",
        "hospital_name": "RSCM (Rumah Sakit Cipto Mangunkusumo)",
        "hospital_address": "Jl. Diponegoro No.71, Salemba, Jakarta Pusat",
        "about": "Dokter spesialis penyakit dalam dengan keahlian dalam penanganan diabetes, hipertensi, dan penyakit metabolik. Staff pengajar FKUI.",
        "experience_years": 18,
        "fee": 450000,
        "phone": "021-1500135",
        "lat": -6.1944,
        "lng": 106.8529,
        "rating": 4.8,
        "total_reviews": 523,
        "total_patients": 3200,
    },
    {
        "email": "doctor6@example.com",
        "full_name": "Dr. Lina Wulandari, Sp.M",
        "specialization": "Mata",
        "hospital_name": "Jakarta Eye Center (JEC) Menteng",
        "hospital_address": "Jl. Cik Ditiro No.46, Menteng, Jakarta Pusat",
        "about": "Spesialis mata dengan keahlian dalam operasi katarak, LASIK, dan penanganan glaukoma. Fellow dari Singapore National Eye Centre.",
        "experience_years": 11,
        "fee": 500000,
        "phone": "021-29221000",
        "lat": -6.1953,
        "lng": 106.8367,
        "rating": 4.9,
        "total_reviews": 178,
        "total_patients": 890,
    },
    {
        "email": "doctor7@example.com",
        "full_name": "Dr. Hendra Wijaya, Sp.B",
        "specialization": "Bedah Umum",
        "hospital_name": "RS Fatmawati",
        "hospital_address": "Jl. RS Fatmawati Raya No.4, Cilandak, Jakarta Selatan",
        "about": "Spesialis bedah umum berpengalaman dalam operasi laparoskopi, bedah digestif, dan penanganan tumor. 13 tahun pengalaman.",
        "experience_years": 13,
        "fee": 400000,
        "phone": "021-7501524",
        "lat": -6.2927,
        "lng": 106.7972,
        "rating": 4.7,
        "total_reviews": 145,
        "total_patients": 720,
    },
    {
        "email": "doctor8@example.com",
        "full_name": "Dr. Dewi Kusuma, Sp.KJ",
        "specialization": "Psikiatri",
        "hospital_name": "RS Jiwa Dr. Soeharto Heerdjan",
        "hospital_address": "Jl. Prof. Dr. Latumeten No.1, Grogol, Jakarta Barat",
        "about": "Psikiater berpengalaman dalam menangani gangguan kecemasan, depresi, gangguan bipolar, dan masalah kesehatan mental lainnya. Pendekatan terapi holistik.",
        "experience_years": 9,
        "fee": 350000,
        "phone": "021-5682011",
        "lat": -6.1632,
        "lng": 106.7879,
        "rating": 4.8,
        "total_reviews": 203,
        "total_patients": 650,
    },
    {
        "email": "doctor9@example.com",
        "full_name": "Dr. Farhan Hidayat, Sp.OT",
        "specialization": "Ortopedi",
        "hospital_name": "RS Premier Bintaro",
        "hospital_address": "Jl. MH Thamrin No.1, Pondok Jaya, Tangerang Selatan",
        "about": "Spesialis ortopedi dan traumatologi dengan keahlian dalam bedah tulang belakang, penggantian sendi, dan penanganan cedera olahraga.",
        "experience_years": 16,
        "fee": 450000,
        "phone": "021-27625500",
        "lat": -6.2789,
        "lng": 106.7189,
        "rating": 4.6,
        "total_reviews": 167,
        "total_patients": 890,
    },
    {
        "email": "doctor10@example.com",
        "full_name": "Dr. Putri Amelia, Sp.THT-KL",
        "specialization": "THT",
        "hospital_name": "RS Mitra Keluarga Kelapa Gading",
        "hospital_address": "Jl. Bukit Gading Raya Kav.2, Kelapa Gading, Jakarta Utara",
        "about": "Dokter spesialis THT dengan keahlian dalam penanganan sinusitis, gangguan pendengaran, vertigo, dan operasi tonsilektomi.",
        "experience_years": 8,
        "fee": 300000,
        "phone": "021-45867888",
        "lat": -6.1564,
        "lng": 106.9062,
        "rating": 4.7,
        "total_reviews": 134,
        "total_patients": 560,
    },
    {
        "email": "doctor11@example.com",
        "full_name": "Dr. Ahmad Fauzi, Sp.P",
        "specialization": "Pulmonologi",
        "hospital_name": "RS Persahabatan",
        "hospital_address": "Jl. Persahabatan Raya No.1, Rawamangun, Jakarta Timur",
        "about": "Spesialis paru-paru dengan keahlian dalam penanganan asma, PPOK, TBC, dan penyakit paru interstitial. Konsultan paru senior.",
        "experience_years": 20,
        "fee": 400000,
        "phone": "021-4891708",
        "lat": -6.2113,
        "lng": 106.8838,
        "rating": 4.8,
        "total_reviews": 298,
        "total_patients": 1800,
    },
    {
        "email": "doctor12@example.com",
        "full_name": "Dr. Nurul Hikmah, Sp.S",
        "specialization": "Neurologi",
        "hospital_name": "RS Siloam Kebon Jeruk",
        "hospital_address": "Jl. Raya Perjuangan No.8, Kebon Jeruk, Jakarta Barat",
        "about": "Spesialis saraf berpengalaman dalam penanganan stroke, epilepsi, sakit kepala kronis, dan gangguan saraf tepi.",
        "experience_years": 12,
        "fee": 380000,
        "phone": "021-25567890",
        "lat": -6.1870,
        "lng": 106.7680,
        "rating": 4.6,
        "total_reviews": 189,
        "total_patients": 920,
    },
    {
        "email": "doctor13@example.com",
        "full_name": "Dr. Irfan Maulana, Sp.U",
        "specialization": "Urologi",
        "hospital_name": "RS Pondok Indah - Puri Indah",
        "hospital_address": "Jl. Puri Lingkar Dalam Blok U1, Puri Indah, Jakarta Barat",
        "about": "Spesialis urologi dengan keahlian dalam penanganan batu ginjal, gangguan prostat, dan bedah urologi minimal invasif.",
        "experience_years": 14,
        "fee": 450000,
        "phone": "021-25695200",
        "lat": -6.1897,
        "lng": 106.7354,
        "rating": 4.7,
        "total_reviews": 156,
        "total_patients": 780,
    },
    {
        "email": "doctor14@example.com",
        "full_name": "Dr. Ratna Dewi, Sp.GK",
        "specialization": "Gizi Klinik",
        "hospital_name": "RS Medistra",
        "hospital_address": "Jl. Jend. Gatot Subroto Kav.59, Kuningan, Jakarta Selatan",
        "about": "Spesialis gizi klinik yang fokus pada diet terapi, manajemen obesitas, nutrisi untuk penyakit kronis, dan konsultasi gizi untuk ibu hamil.",
        "experience_years": 7,
        "fee": 250000,
        "phone": "021-5210200",
        "lat": -6.2340,
        "lng": 106.8282,
        "rating": 4.8,
        "total_reviews": 245,
        "total_patients": 1200,
    },
    {
        "email": "doctor15@example.com",
        "full_name": "Dr. Teguh Prasetyo, Sp.JP",
        "specialization": "Kardiologi",
        "hospital_name": "RS Jantung Jakarta",
        "hospital_address": "Jl. Matraman Raya No.23, Matraman, Jakarta Timur",
        "about": "Kardiolog intervensi dengan spesialisasi pemasangan ring jantung dan kateterisasi jantung. Alumni Tokyo Heart Institute.",
        "experience_years": 17,
        "fee": 500000,
        "phone": "021-8191212",
        "lat": -6.2082,
        "lng": 106.8590,
        "rating": 4.9,
        "total_reviews": 310,
        "total_patients": 1650,
    },
    {
        "email": "doctor16@example.com",
        "full_name": "Dr. Winda Sari, Sp.A",
        "specialization": "Pediatri",
        "hospital_name": "RSAB Harapan Kita",
        "hospital_address": "Jl. Letjen S. Parman Kav.87, Slipi, Jakarta Barat",
        "about": "Dokter spesialis anak dengan sub-spesialisasi alergi dan imunologi anak. Berpengalaman menangani alergi makanan dan asma pada anak.",
        "experience_years": 10,
        "fee": 320000,
        "phone": "021-5668284",
        "lat": -6.1695,
        "lng": 106.7913,
        "rating": 4.7,
        "total_reviews": 278,
        "total_patients": 1450,
    },
    {
        "email": "doctor17@example.com",
        "full_name": "Dr. Agus Setiawan, Sp.PD-KGEH",
        "specialization": "Gastroenterologi",
        "hospital_name": "RS Gatot Soebroto",
        "hospital_address": "Jl. Dr. Abdul Rachman Saleh No.24, Senen, Jakarta Pusat",
        "about": "Konsultan gastroenterologi dan hepatologi. Ahli dalam endoskopi, penanganan penyakit liver, dan gangguan pencernaan.",
        "experience_years": 19,
        "fee": 450000,
        "phone": "021-3440693",
        "lat": -6.1760,
        "lng": 106.8465,
        "rating": 4.8,
        "total_reviews": 267,
        "total_patients": 1380,
    },
    {
        "email": "doctor18@example.com",
        "full_name": "Dr. Fitri Handayani, Sp.KK",
        "specialization": "Dermatologi",
        "hospital_name": "RS Mayapada Kuningan",
        "hospital_address": "Jl. HR Rasuna Said Kav.C-21, Kuningan, Jakarta Selatan",
        "about": "Dermatologis dengan keahlian dalam dermatologi kosmetik, perawatan laser, chemical peeling, dan penanganan penyakit kulit kronis.",
        "experience_years": 8,
        "fee": 350000,
        "phone": "021-5219388",
        "lat": -6.2292,
        "lng": 106.8333,
        "rating": 4.9,
        "total_reviews": 324,
        "total_patients": 1100,
    },
    {
        "email": "doctor19@example.com",
        "full_name": "Dr. Dimas Prabowo, Sp.BS",
        "specialization": "Bedah Saraf",
        "hospital_name": "RS Siloam Lippo Village",
        "hospital_address": "Jl. Siloam No.6, Lippo Karawaci, Tangerang",
        "about": "Spesialis bedah saraf dengan keahlian dalam operasi tumor otak, cedera kepala, dan bedah tulang belakang minimal invasif.",
        "experience_years": 13,
        "fee": 600000,
        "phone": "021-54210900",
        "lat": -6.2250,
        "lng": 106.6103,
        "rating": 4.7,
        "total_reviews": 98,
        "total_patients": 420,
    },
    {
        "email": "doctor20@example.com",
        "full_name": "Dr. Kartika Sari, Sp.Rad",
        "specialization": "Radiologi",
        "hospital_name": "RS Husada",
        "hospital_address": "Jl. Mangga Besar No.137-139, Tamansari, Jakarta Barat",
        "about": "Spesialis radiologi diagnostik dan intervensi. Ahli dalam interpretasi CT Scan, MRI, USG, dan prosedur radiologi intervensi.",
        "experience_years": 11,
        "fee": 300000,
        "phone": "021-6260108",
        "lat": -6.1487,
        "lng": 106.8234,
        "rating": 4.6,
        "total_reviews": 112,
        "total_patients": 650,
    },
]


async def seed():
    async with AsyncSessionLocal() as session:
        created = 0
        updated = 0

        for data in DOCTOR_PROFILES:
            # Find the user by email
            result = await session.execute(
                select(User).where(User.email == data["email"])
            )
            user = result.scalar_one_or_none()

            if not user:
                print(f"  [SKIP] User not found: {data['email']}")
                continue

            # Update user full_name to the realistic name
            user.full_name = data["full_name"]

            # Check if profile already exists
            result = await session.execute(
                select(DoctorProfile).where(DoctorProfile.user_id == user.id)
            )
            existing = result.scalar_one_or_none()

            if existing:
                # Update existing profile
                existing.specialization = data["specialization"]
                existing.hospital_name = data["hospital_name"]
                existing.hospital_address = data["hospital_address"]
                existing.about = data["about"]
                existing.experience_years = data["experience_years"]
                existing.fee = data["fee"]
                existing.phone = data["phone"]
                existing.lat = data["lat"]
                existing.lng = data["lng"]
                existing.rating = data["rating"]
                existing.total_reviews = data["total_reviews"]
                existing.total_patients = data["total_patients"]
                updated += 1
                print(f"  [UPDATE] {data['full_name']} - {data['specialization']} @ {data['hospital_name']}")
            else:
                profile = DoctorProfile(
                    user_id=user.id,
                    specialization=data["specialization"],
                    hospital_name=data["hospital_name"],
                    hospital_address=data["hospital_address"],
                    about=data["about"],
                    experience_years=data["experience_years"],
                    fee=data["fee"],
                    phone=data["phone"],
                    lat=data["lat"],
                    lng=data["lng"],
                    is_available=True,
                    rating=data["rating"],
                    total_reviews=data["total_reviews"],
                    total_patients=data["total_patients"],
                )
                session.add(profile)
                created += 1
                print(f"  [OK] {data['full_name']} - {data['specialization']} @ {data['hospital_name']}")

        await session.commit()

        print("\n" + "=" * 60)
        print("  SEEDING SELESAI!")
        print(f"  Profil dokter baru     : {created}")
        print(f"  Profil dokter di-update: {updated}")
        print(f"  Total data             : {len(DOCTOR_PROFILES)}")
        print("=" * 60)

        print("\n  Daftar Dokter:")
        for d in DOCTOR_PROFILES:
            print(f"    - {d['full_name']} ({d['specialization']}) @ {d['hospital_name']}")
        print()


if __name__ == "__main__":
    print("=" * 60)
    print("  MEDICALL - Seed Doctor Profiles (DKI Jakarta)")
    print("=" * 60)
    asyncio.run(seed())
