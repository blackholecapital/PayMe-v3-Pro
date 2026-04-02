export function getParam(name) {
  try {
    const url = new URL(window.location.href)
    return url.searchParams.get(name) || ""
  } catch {
    return ""
  }
}
