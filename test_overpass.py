import httpx
import asyncio

async def test():
    query = """
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:5000,-6.2088,106.8456);
    );
    out body 5;
    """
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(
            'https://overpass-api.de/api/interpreter',
            data={'data': query}
        )
        print("Status:", r.status_code)
        print("Response:", r.text[:2000])

asyncio.run(test())
