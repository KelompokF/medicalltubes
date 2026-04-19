import asyncio

from sqlalchemy import update, select

from app.database import AsyncSessionLocal
from app.models.user import User


async def set_roles():
    async with AsyncSessionLocal() as session:
        # find users with emails starting with doctor and set role='doctor'
        res = await session.execute(select(User).where(User.email.ilike('doctor%')))
        users = res.scalars().all()
        if not users:
            print('No doctor users found to update.')
            return
        for u in users:
            if getattr(u, 'role', None) != 'doctor':
                stmt = update(User).where(User.id == u.id).values(role='doctor')
                await session.execute(stmt)
                print(f'Updated role for {u.email}')
        await session.commit()
        print('Done updating doctor roles')


if __name__ == '__main__':
    asyncio.run(set_roles())
