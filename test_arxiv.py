import httpx
import asyncio

async def test():
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                'https://export.arxiv.org/api/query',
                params={'search_query': 'all:electron', 'start': 0, 'max_results': 1}
            )
            print(f'Status: {response.status_code}')
            print(f'Content length: {len(response.content)}')
            print('Success!')
    except Exception as e:
        print(f'Error: {type(e).__name__}: {e}')
        import traceback
        traceback.print_exc()

asyncio.run(test())

