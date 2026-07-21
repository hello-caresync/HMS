export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { apiError, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import prisma from '@/lib/prisma';

const CHANNELS = [
  { id: 'ch-nurse', name: 'Nursing Station · Ward 3', role: 'Nursing' },
  { id: 'ch-lab', name: 'Pathology Lab', role: 'Lab' },
  { id: 'ch-rad', name: 'Radiology · PACS', role: 'Radiology' },
  { id: 'ch-pharm', name: 'Central Pharmacy', role: 'Pharmacy' },
  { id: 'ch-admin', name: 'On-Call Admin', role: 'Admin' },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId') ?? 'ch-nurse';
    await resolveDoctorId(request);

    const messages = await prisma.clinicalMessage.findMany({
      where: { channelId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const channels = await Promise.all(
      CHANNELS.map(async (ch) => {
        const latest = await prisma.clinicalMessage.findFirst({
          where: { channelId: ch.id },
          orderBy: { createdAt: 'desc' },
        });
        const unread = await prisma.clinicalMessage.count({
          where: { channelId: ch.id, sender: { not: 'You' } },
        });
        return {
          ...ch,
          unread: Math.min(unread, 9),
          lastMessage: latest?.body ?? 'No messages yet',
          lastAt: latest?.createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) ?? '—',
        };
      }),
    );

    return NextResponse.json({
      success: true,
      channels,
      messages: messages.map((m) => ({
        id: m.id,
        channelId: m.channelId,
        sender: m.sender,
        body: m.body,
        at: m.createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        stat: m.stat,
        attachment: m.attachment ?? undefined,
      })),
    });
  } catch (e) {
    console.error(e);
    return apiError('Failed to load messages');
  }
}

export async function POST(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const body = await request.json();
    const { channelId, body: text, stat } = body;

    if (!channelId || !text) {
      return apiError('channelId and body required', 400);
    }

    const msg = await prisma.clinicalMessage.create({
      data: {
        channelId,
        doctorId,
        sender: 'You',
        body: text,
        stat: !!stat,
      },
    });

    return NextResponse.json({ success: true, message: msg }, { status: 201 });
  } catch (e) {
    console.error(e);
    return apiError('Failed to send message');
  }
}
