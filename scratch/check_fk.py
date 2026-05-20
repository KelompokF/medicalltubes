import asyncio
import asyncpg

async def check_fk():
    conn = await asyncpg.connect('postgresql://postgres.eypuqdjmyjxllybocffq:Kelompok%40F12@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres')
    query = '''
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'users';
    '''
    rows = await conn.fetch(query)
    for row in rows:
        print(f"{row['table_name']}.{row['column_name']} -> {row['foreign_table_name']}.{row['foreign_column_name']} | ON DELETE {row['delete_rule']}")
    await conn.close()

asyncio.run(check_fk())
