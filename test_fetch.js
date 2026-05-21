async function test() {
  const url = "https://hokkaido-har.com/";
  try {
    const fetchRes = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, 
      signal: AbortSignal.timeout(8000) 
    });
    console.log("Status:", fetchRes.status);
  } catch (e) {
    console.log("Error cause:", e.cause);
  }
}
test();
