import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function getBackendOrigin(): string {
  const raw =
    process.env.BACKEND_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000/api'
  return raw.replace(/\/api\/?$/, '')
}

const FORWARDED_REQ_HEADERS = [
  'x-api-key',
  'authorization',
  'content-type',
  'idempotency-key',
  'x-account-pin',
]

const FORWARDED_RES_HEADERS = [
  'content-type',
  'content-disposition',
  'x-request-id',
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset',
  'x-idempotency-replayed',
  'retry-after',
]

async function proxyRequest(
  req: NextRequest,
  context: { params: { path?: string[] } }
) {
  const segments = context.params?.path || []
  const subPath = segments.length ? '/' + segments.join('/') : ''
  const targetUrl = `${getBackendOrigin()}/api/v1${subPath}${req.nextUrl.search}`

  const headers = new Headers()
  for (const name of FORWARDED_REQ_HEADERS) {
    const val = req.headers.get(name)
    if (val) headers.set(name, val)
  }

  // Preserve client IP for backend IP-whitelist checks & audit logs
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
  if (clientIp) headers.set('x-forwarded-for', clientIp)

  // Inform backend OpenAPI generator of the public frontend gateway URL
  const publicBase = process.env.NEXT_PUBLIC_BASE_URL?.trim()
  headers.set(
    'x-public-base-url',
    publicBase ? `${publicBase.replace(/\/$/, '')}/api/v1` : `${req.nextUrl.origin}/api/v1`
  )

  const hasBody = !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  let body: ArrayBuffer | undefined
  if (hasBody) {
    const buf = await req.arrayBuffer()
    if (buf.byteLength > 0) body = buf
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    })

    const resHeaders = new Headers()
    for (const name of FORWARDED_RES_HEADERS) {
      const val = upstream.headers.get(name)
      if (val) resHeaders.set(name, val)
    }

    const resBody = await upstream.arrayBuffer()
    return new NextResponse(resBody, {
      status: upstream.status,
      headers: resHeaders,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GATEWAY_UNAVAILABLE',
          message: err?.message || 'Unable to reach core banking service.',
        },
      },
      { status: 502 }
    )
  }
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
export const OPTIONS = proxyRequest
