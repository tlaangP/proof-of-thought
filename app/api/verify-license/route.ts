import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { licenseKey } = await req.json();

  if (!licenseKey) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GUMROAD_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      product_id: "geB67dAseGRaqslhf1BrXQ==",
      license_key: licenseKey,
    }),
  });

  const data = await res.json();

  if (data.success && data.purchase?.refunded === false) {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}
