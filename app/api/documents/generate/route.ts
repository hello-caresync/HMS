import { NextResponse } from 'next/server';

import { DocumentType } from '@prisma/client';

import { apiError, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import prisma from '@/lib/prisma';

const TYPE_MAP: Record<string, DocumentType> = {
  DISCHARGE_SUMMARY: DocumentType.DISCHARGE_SUMMARY,
  REFERRAL_LETTER: DocumentType.REFERRAL_LETTER,
  MEDICAL_FITNESS: DocumentType.FITNESS_CERTIFICATE,
  SICK_LEAVE: DocumentType.SICK_LEAVE,
  PROGRESS_NOTE: DocumentType.PROGRESS_NOTE,
};

export async function POST(request: Request) {
  try {
    const doctorId = await resolveDoctorId(request);
    const body = await request.json();
    const { patientId, documentType, content, dateFrom, dateTo, signed, digitalSignature } = body;

    if (!patientId || !documentType) {
      return apiError('patientId and documentType required', 400);
    }

    const mapped = TYPE_MAP[documentType] ?? DocumentType.PROGRESS_NOTE;
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });

    const doc = await prisma.clinicalDocument.create({
      data: {
        patientId,
        doctorId,
        documentType: mapped,
        contentJson: {
          ...(content ?? {}),
          dateFrom,
          dateTo,
          signed: !!signed,
        },
        digitalSignature: signed ? digitalSignature ?? doctor?.fullName ?? 'Signed' : null,
      },
    });

    const previewHtml = `
      <h1 style="color:#0F172A">${documentType.replace(/_/g, ' ')}</h1>
      <p><strong>Patient:</strong> ${patient?.fullName ?? ''} (${patient?.mrn ?? ''})</p>
      <p><strong>Period:</strong> ${dateFrom ?? '—'} to ${dateTo ?? '—'}</p>
      <p>${typeof content === 'string' ? content : JSON.stringify(content ?? {})}</p>
      <p style="margin-top:24px;border-top:1px solid #ccc;padding-top:12px;">
        ${signed ? `<em>${doctor?.fullName ?? 'Attending Physician'}</em>` : 'Unsigned draft'}
      </p>
    `;

    return NextResponse.json({ success: true, id: doc.id, previewHtml });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to generate document');
  }
}
