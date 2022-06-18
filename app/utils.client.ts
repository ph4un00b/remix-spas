
export async function queryURL (endpoint: string, options: {} = {}) {
  const controller = new AbortController()
  const signal = controller.signal
  // todo: improve abort for react-query, check for a async/await way
  const config = {
    method: 'get',
    signal,
    ...options
  }

  await new Promise(resolve => setTimeout(resolve, 1000))

  const resp = await window
    .fetch(`https://pokeapi.co/api/v2/${endpoint}`, config)

  if (resp.ok) {
    try {
      return await resp.json()
    } catch (e) {
      console.log(e)
    }
  }

  return await Promise.reject(Error('response not ok'))
}
