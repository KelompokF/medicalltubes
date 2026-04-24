"""
Seed Script: Inject 10 ambulance users + 10 ambulance services across DKI Jakarta.

Run with:
    python scripts/seed_ambulances.py
"""

import sys
import os
import uuid
import asyncio

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import AsyncSessionLocal
from app.models.user import User
from app.models.ambulance import AmbulanceService
from app.core.security import hash_password


# 10 ambulance data spread across DKI Jakarta areas
AMBULANCE_DATA = [
    # --- Jakarta Selatan ---
    {
        "user": {
            "full_name": "Ambulans RS Fatmawati",
            "email": "ambulans.fatmawati@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans RS Fatmawati",
            "description": "Unit ambulans IGD Rumah Sakit Fatmawati, Jakarta Selatan",
            "phone": "021-7501524",
            "lat": -6.2927,
            "lng": 106.7972,
            "address": "Jl. RS Fatmawati Raya No.4, Cilandak, Jakarta Selatan",
            "area": "Jakarta Selatan",
            "vehicle_plate": "B 1234 AMB",
            "vehicle_type": "standard",
        },
    },
    {
        "user": {
            "full_name": "Ambulans RS Siloam Kebayoran",
            "email": "ambulans.siloam.kby@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans RS Siloam Kebayoran",
            "description": "Unit ambulans RS Siloam Kebayoran Baru, Jakarta Selatan",
            "phone": "021-29531900",
            "lat": -6.2436,
            "lng": 106.7839,
            "address": "Jl. Sisingamangaraja No.21, Kebayoran Baru, Jakarta Selatan",
            "area": "Jakarta Selatan",
            "vehicle_plate": "B 2345 AMB",
            "vehicle_type": "icu",
        },
    },
    {
        "user": {
            "full_name": "Ambulans PMI Jakarta Selatan",
            "email": "ambulans.pmi.jaksel@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans PMI Jakarta Selatan",
            "description": "Unit ambulans Palang Merah Indonesia cabang Jakarta Selatan",
            "phone": "021-7993232",
            "lat": -6.2615,
            "lng": 106.8106,
            "address": "Jl. Kramat Pela No.4, Gandaria Utara, Jakarta Selatan",
            "area": "Jakarta Selatan",
            "vehicle_plate": "B 3456 PMI",
            "vehicle_type": "standard",
        },
    },
    # --- Jakarta Utara ---
    {
        "user": {
            "full_name": "Ambulans RS Koja",
            "email": "ambulans.koja@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans RSUD Koja",
            "description": "Unit ambulans RSUD Koja, Jakarta Utara",
            "phone": "021-43938484",
            "lat": -6.1194,
            "lng": 106.8984,
            "address": "Jl. Deli No.4, Tugu Utara, Koja, Jakarta Utara",
            "area": "Jakarta Utara",
            "vehicle_plate": "B 4567 AMB",
            "vehicle_type": "standard",
        },
    },
    {
        "user": {
            "full_name": "Ambulans RS Atma Jaya Kelapa Gading",
            "email": "ambulans.atmajaya.kg@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans RS Atma Jaya Kelapa Gading",
            "description": "Unit ambulans RS Atma Jaya, Kelapa Gading, Jakarta Utara",
            "phone": "021-45867901",
            "lat": -6.1564,
            "lng": 106.9062,
            "address": "Jl. Pluit Raya No.2, Kelapa Gading, Jakarta Utara",
            "area": "Jakarta Utara",
            "vehicle_plate": "B 5678 AMB",
            "vehicle_type": "icu",
        },
    },
    # --- Jakarta Barat ---
    {
        "user": {
            "full_name": "Ambulans RS Sumber Waras",
            "email": "ambulans.sumberwaras@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans RS Sumber Waras",
            "description": "Unit ambulans RS Sumber Waras, Grogol, Jakarta Barat",
            "phone": "021-5682011",
            "lat": -6.1685,
            "lng": 106.7851,
            "address": "Jl. Kyai Tapa No.1, Grogol, Jakarta Barat",
            "area": "Jakarta Barat",
            "vehicle_plate": "B 6789 AMB",
            "vehicle_type": "standard",
        },
    },
    {
        "user": {
            "full_name": "Ambulans RS Cengkareng",
            "email": "ambulans.cengkareng@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans RSUD Cengkareng",
            "description": "Unit ambulans RSUD Cengkareng, Jakarta Barat",
            "phone": "021-54396975",
            "lat": -6.1457,
            "lng": 106.7274,
            "address": "Jl. Bumi Cengkareng Indah No.1, Cengkareng, Jakarta Barat",
            "area": "Jakarta Barat",
            "vehicle_plate": "B 7890 AMB",
            "vehicle_type": "standard",
        },
    },
    # --- Jakarta Timur ---
    {
        "user": {
            "full_name": "Ambulans RS UKI Cawang",
            "email": "ambulans.uki.cawang@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans RS UKI Cawang",
            "description": "Unit ambulans RS UKI, Cawang, Jakarta Timur",
            "phone": "021-80888120",
            "lat": -6.2476,
            "lng": 106.8744,
            "address": "Jl. Mayjen Sutoyo No.2, Cawang, Jakarta Timur",
            "area": "Jakarta Timur",
            "vehicle_plate": "B 8901 AMB",
            "vehicle_type": "icu",
        },
    },
    {
        "user": {
            "full_name": "Ambulans RS Islam Jakarta Timur",
            "email": "ambulans.rsijkt@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans RS Islam Jakarta Timur",
            "description": "Unit ambulans RSIJ Pondok Kopi, Jakarta Timur",
            "phone": "021-8630654",
            "lat": -6.2240,
            "lng": 106.9182,
            "address": "Jl. Raya Pondok Kopi, Duren Sawit, Jakarta Timur",
            "area": "Jakarta Timur",
            "vehicle_plate": "B 9012 AMB",
            "vehicle_type": "standard",
        },
    },
    # --- Jakarta Pusat ---
    {
        "user": {
            "full_name": "Ambulans RS Cipto Mangunkusumo",
            "email": "ambulans.rscm@medicall.id",
            "password": "ambulance123",
        },
        "ambulance": {
            "name": "Ambulans RSCM Jakarta Pusat",
            "description": "Unit ambulans RSCM (Rumah Sakit Cipto Mangunkusumo), Jakarta Pusat",
            "phone": "021-1500135",
            "lat": -6.1944,
            "lng": 106.8529,
            "address": "Jl. Diponegoro No.71, Salemba, Jakarta Pusat",
            "area": "Jakarta Pusat",
            "vehicle_plate": "B 1122 AMB",
            "vehicle_type": "icu",
        },
    },
]


async def seed():
    async with AsyncSessionLocal() as session:
        created_users = 0
        created_ambulances = 0

        for item in AMBULANCE_DATA:
            user_data = item["user"]
            amb_data = item["ambulance"]

            # Check if user already exists
            result = await session.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": user_data["email"]},
            )
            existing = result.scalar_one_or_none()

            if existing:
                user_id = existing
                print(f"  [SKIP] User sudah ada: {user_data['email']}")
            else:
                user_id = uuid.uuid4()
                user = User(
                    id=user_id,
                    full_name=user_data["full_name"],
                    email=user_data["email"],
                    hashed_password=hash_password(user_data["password"]),
                    is_active=True,
                    role="ambulance",
                )
                session.add(user)
                await session.flush()
                created_users += 1
                print(f"  [OK] User dibuat: {user_data['email']} (role=ambulance)")

            # Check if ambulance service already exists for this user
            result = await session.execute(
                text("SELECT id FROM ambulance_services WHERE user_id = :uid"),
                {"uid": user_id},
            )
            existing_amb = result.scalar_one_or_none()

            if existing_amb:
                print(f"  [SKIP] Ambulans sudah ada: {amb_data['name']}")
            else:
                ambulance = AmbulanceService(
                    id=uuid.uuid4(),
                    user_id=user_id,
                    name=amb_data["name"],
                    description=amb_data["description"],
                    phone=amb_data["phone"],
                    lat=amb_data["lat"],
                    lng=amb_data["lng"],
                    address=amb_data["address"],
                    area=amb_data["area"],
                    status="available",
                    is_active=True,
                    vehicle_plate=amb_data["vehicle_plate"],
                    vehicle_type=amb_data["vehicle_type"],
                )
                session.add(ambulance)
                created_ambulances += 1
                print(f"  [OK] Ambulans dibuat: {amb_data['name']} ({amb_data['area']})")

        await session.commit()

        print("\n" + "=" * 60)
        print(f"  SEEDING SELESAI!")
        print(f"  User ambulance baru   : {created_users}")
        print(f"  Layanan ambulans baru : {created_ambulances}")
        print(f"  Total data seed       : {len(AMBULANCE_DATA)}")
        print("=" * 60)
        print("\n  Login credentials (semua sama):")
        print("  Password: ambulance123")
        print("  Email list:")
        for item in AMBULANCE_DATA:
            print(f"    - {item['user']['email']}")
        print()


if __name__ == "__main__":
    print("=" * 60)
    print("  MEDICALL - Seed Ambulance Data (DKI Jakarta)")
    print("=" * 60)
    asyncio.run(seed())
