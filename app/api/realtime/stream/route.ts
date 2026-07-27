import { getPrisma } from '@/lib/prisma';
import { requireDoctorSession } from '@/lib/doctor/server/auth';
import { apiError } from '@/lib/doctor/server/api-http';

export const dynamic = 'force-dynamic';

/** Server-Sent Events stream for live clinical updates */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('access_token');
    const doctorId = url.searchParams.get('doctor_id');

    let session = await requireDoctorSession(request);
    if (!session && token) {
      const fakeRequest = new Request(request.url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      session = await requireDoctorSession(fakeRequest);
    }
    if (!session && doctorId) {
      const fakeRequest = new Request(request.url, {
        headers: { 'x-doctor-id': doctorId },
      });
      session = await requireDoctorSession(fakeRequest);
    }
    if (!session) throw new Error('UNAUTHORIZED');
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        send('connected', { doctorId: session.doctorId, at: new Date().toISOString() });

        let lastCheck = new Date();
        const interval = setInterval(async () => {
          try {
            const prisma = await getPrisma();
            const [notifications, appointments] = await Promise.all([
              prisma.clinicalNotification.count({
                where: {
                  doctorId: session.doctorId,
                  acknowledged: false,
                  createdAt: { gt: lastCheck },
                },
              }),
              prisma.appointment.count({
                where: {
                  doctorId: session.doctorId,
                  updatedAt: { gt: lastCheck },
                  deletedAt: null,
                },
              }),
            ]);

            if (notifications > 0 || appointments > 0) {
              send('update', {
                notifications,
                appointments,
                at: new Date().toISOString(),
              });
            }
            lastCheck = new Date();
          } catch {
            send('error', { message: 'poll failed' });
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
