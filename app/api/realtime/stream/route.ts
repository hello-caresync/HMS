export const runtime = 'edge';

import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { apiError } from '@/lib/doctor/server/api-http';

export const dynamic = 'force-dynamic';

/** Server-Sent Events stream for live clinical updates (mock polling — no database). */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('access_token');
    const doctorId = url.searchParams.get('doctor_id');

    let session = await requireDoctorSession(request);
    if (!session && token) {
      session = await requireDoctorSession(
        new Request(request.url, { headers: { Authorization: `Bearer ${token}` } }),
      );
    }
    if (!session && doctorId) {
      session = await requireDoctorSession(
        new Request(request.url, { headers: { 'x-doctor-id': doctorId } }),
      );
    }
    if (!session) throw new Error('UNAUTHORIZED');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        send('connected', { doctorId: session.doctorId, at: new Date().toISOString() });

        let tick = 0;
        const interval = setInterval(() => {
          tick += 1;
          if (tick % 3 === 0) {
            send('update', {
              notifications: tick % 6 === 0 ? 1 : 0,
              appointments: 0,
              at: new Date().toISOString(),
            });
          }
        }, 5000);

        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    if (msg === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError(msg, 500);
  }
}
