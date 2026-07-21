export const runtime = 'edge';

import { NextResponse } from 'next/server';

import { AppointmentStatus, DischargeStatus } from '@/lib/doctor/clinical-enums';

import { apiError, parseJsonArray, resolveDoctorId } from '@/lib/doctor/server/api-helpers';
import { getPrisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const ward = searchParams.get('ward');
    const status = searchParams.get('status')?.toUpperCase();
    const context = searchParams.get('context');
    const doctorId = await resolveDoctorId(request);

    if (context === 'ipd') {
      const admissions = await prisma.ipdAdmission.findMany({
        where: {
          doctorId,
          status: searchParams.get('status') === 'DISCHARGED' ? DischargeStatus.DISCHARGED : DischargeStatus.ADMITTED,
          ...(ward ? { wardName: ward } : {}),
        },
        include: { patient: true },
        orderBy: { admissionDate: 'desc' },
      });

      return NextResponse.json({
        success: true,
        admissions: admissions.map((a) => ({
          id: a.id,
          ward: a.wardName,
          bed: a.bedNumber,
          losDays: Math.max(1, Math.ceil((Date.now() - a.admissionDate.getTime()) / 86400000)),
          status: a.status,
          dailyProgressNotesJson: a.dailyProgressNotesJson,
          patient: mapPatient(a.patient),
        })),
      });
    }

    let patientIds: string[] | undefined;

    if (status === 'OPD') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const appts = await prisma.appointment.findMany({
        where: {
          doctorId,
          scheduledAt: { gte: start, lt: end },
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN, AppointmentStatus.IN_CONSULT] },
        },
        select: { patientId: true },
      });
      patientIds = appts.map((a) => a.patientId);
    } else if (status === 'IPD') {
      const rows = await prisma.ipdAdmission.findMany({
        where: { doctorId, status: DischargeStatus.ADMITTED },
        select: { patientId: true },
      });
      patientIds = rows.map((r) => r.patientId);
    } else if (status === 'EMERGENCY') {
      const alerts = await prisma.emergencyAlert.findMany({
        where: { doctorId, acknowledged: false },
        select: { patientId: true },
      });
      patientIds = alerts.map((a) => a.patientId).filter((id): id is string => !!id);
    }

    const patients = await prisma.patient.findMany({
      where: {
        ...(patientIds ? { id: { in: patientIds.length ? patientIds : ['__none__'] } } : {}),
        ...(search
          ? {
              OR: [
                { mrn: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { fullName: 'asc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      patients: patients.map(mapPatient),
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'NO_DOCTOR') {
      return apiError('No doctor profile configured', 503);
    }
    console.error(e);
    return apiError('Failed to fetch patients');
  }
}

function mapPatient(p: {
  id: string;
  mrn: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergiesJson: unknown;
  chronicConditionsJson: unknown;
}) {
  return {
    id: p.id,
    mrn: p.mrn,
    fullName: p.fullName,
    age: p.age,
    gender: p.gender,
    bloodGroup: p.bloodGroup,
    allergies: parseJsonArray(p.allergiesJson),
    chronicConditions: parseJsonArray(p.chronicConditionsJson),
  };
}

export async function POST(request: Request) {
  try {
    const prisma = await getPrisma();
    const body = await request.json();
    const { mrn, fullName, age, gender, bloodGroup, allergies, chronicConditions } = body;

    if (!mrn || !fullName || age == null || !gender || !bloodGroup) {
      return apiError('Missing required patient fields', 400);
    }

    const patient = await prisma.patient.create({
      data: {
        mrn,
        fullName,
        age: Number(age),
        gender,
        bloodGroup,
        allergiesJson: allergies ?? [],
        chronicConditionsJson: chronicConditions ?? [],
      },
    });

    return NextResponse.json({ success: true, patient: mapPatient(patient) }, { status: 201 });
  } catch (e) {
    console.error(e);
    return apiError('Failed to create patient');
  }
}
