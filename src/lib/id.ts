const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseUuid(value: string) {
  if (!UUID.test(value)) {
    return null;
  }

  return value.toLowerCase();
}
