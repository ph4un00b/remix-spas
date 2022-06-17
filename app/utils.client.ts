export async function queryURL (endpoint: string, options: {} = {}) {
  const config = {
    method: 'get',
    ...options
  }

  const resp = await window
    .fetch(`https://pokeapi.co/api/v2/${endpoint}`, config)

  if (resp.ok) {
    try {
      return await resp.json()
    } catch (e) {
      console.log(e)
    }
  }
}
