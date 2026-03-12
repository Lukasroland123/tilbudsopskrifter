const SALLING_API_BASE = "https://api.sallinggroup.com";

export interface SallingProduct {
  ean: string;
  description: string;
  price: number;
  currency: string;
  unitPrice?: number;
  unitDescription?: string;
}

export async function fetchProductByEan(
  ean: string,
  storeId: string
): Promise<SallingProduct | null> {
  const url = `${SALLING_API_BASE}/v2/products/${ean}?storeId=${storeId}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.SALLING_API_KEY}`,
    },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Salling API fejl: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
