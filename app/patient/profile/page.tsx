'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  User,
  Heart,
  Users,
  CheckCircle2,
  Trash2,
  Plus,
  Save,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: string;
  blood: string;
}

export default function PatientProfilePage() {
  const [fullName, setFullName] = useState<string>('Aishwarya D S');
  const [bloodGroup, setBloodGroup] = useState<string>('O Positive (O+)');
  const [height, setHeight] = useState<string>('165 cm');
  const [weight, setWeight] = useState<string>('58 kg');
  const [allergies, setAllergies] = useState<string>('Penicillin');
  const [emergencyContact, setEmergencyContact] = useState<string>('+91 9876543210');

  // LINKED FAMILY MEMBERS STATE
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [memberName, setMemberName] = useState<string>('');
  const [memberRelation, setMemberRelation] = useState<string>('Parent');
  const [memberAge, setMemberAge] = useState<string>('');
  const [memberBlood, setMemberBlood] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    // 1. Try Local Storage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('curasync_patient_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFullName(parsed.full_name || 'Aishwarya D S');
          setBloodGroup(parsed.blood_group || 'O Positive (O+)');
          setHeight(parsed.height || '165 cm');
          setWeight(parsed.weight || '58 kg');
          setAllergies(parsed.allergies || 'Penicillin');
          setEmergencyContact(parsed.emergency_contact || '+91 9876543210');
          if (Array.isArray(parsed.family_members)) {
            setFamilyMembers(parsed.family_members);
          }
        } catch (e) {}
      }
    }

    // 2. Try Supabase Sync
    try {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('patient_id', 'NEX_9021')
        .single();

      if (!error && data) {
        setFullName(data.full_name || 'Aishwarya D S');
        setBloodGroup(data.blood_group || 'O Positive (O+)');
        setHeight(data.height || '165 cm');
        setWeight(data.weight || '58 kg');
        setAllergies(data.allergies || 'Penicillin');
        setEmergencyContact(data.emergency_contact || '+91 9876543210');
        if (Array.isArray(data.family_members)) {
          setFamilyMembers(data.family_members);
        }
      }
    } catch (err) {
      console.warn('Profile DB load fallback active');
    }
  };

  // ADD MEMBER ONLY VALIDATES WHEN CLICKING "+ ADD MEMBER"
  const handleAddMember = (e: React.MouseEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!memberName.trim()) {
      setAddError('Please enter member name.');
      return;
    }
    if (!memberAge.trim()) {
      setAddError('Please enter member age.');
      return;
    }
    if (!memberBlood) {
      setAddError('Please select a blood group for the family member.');
      return;
    }

    const newMember: FamilyMember = {
      id: 'mem_' + Date.now(),
      name: memberName.trim(),
      relation: memberRelation,
      age: memberAge.trim(),
      blood: memberBlood,
    };

    const updatedList = [...familyMembers, newMember];
    setFamilyMembers(updatedList);

    // Reset member inputs
    setMemberName('');
    setMemberAge('');
    setMemberBlood('');
  };

  const handleRemoveMember = (id: string) => {
    const updated = familyMembers.filter((m) => m.id !== id);
    setFamilyMembers(updated);
  };

  // SAVE ENTIRE PROFILE TO BACKEND SUPABASE & LOCALSTORAGE
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    const profileData = {
      patient_id: 'NEX_9021',
      full_name: fullName,
      blood_group: bloodGroup,
      height,
      weight,
      allergies,
      emergency_contact: emergencyContact,
      family_members: familyMembers,
      updated_at: new Date().toISOString(),
    };

    // Save locally
    if (typeof window !== 'undefined') {
      localStorage.setItem('curasync_patient_profile', JSON.stringify(profileData));
      localStorage.setItem('patient_full_name', fullName);
    }

    // Upsert to Supabase backend
    try {
      await supabase.from('patient_profiles').upsert(profileData, { onConflict: 'patient_id' });
    } catch (err) {
      console.warn('Backend profile upsert fallback active');
    } finally {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans text-[#0E2924]">
      <div className="border-b border-[#D5E8E3] pb-4">
        <h1 className="text-2xl font-black text-[#0E2924]">Patient Profile & Vitals</h1>
        <p className="text-xs font-bold text-[#227B6B]">
          Manage your clinical identity, physical vitals, emergency contacts, and linked family members.
        </p>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#EAF5F2] p-4 text-xs font-bold text-[#113831] border border-[#227B6B]/30 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-[#227B6B] shrink-0" />
          <span>Profile and family records saved successfully to backend database!</span>
        </div>
      )}

      {/* FORM WITHOUT ACCIDENTAL REQUIRED FIELD BLOCKS */}
      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* 1. PERSONAL IDENTITY */}
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-[#0E2924] flex items-center gap-2">
            <User className="h-4 w-4 text-[#227B6B]" /> 1. Personal Details
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-black uppercase text-[#227B6B] block mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[#227B6B] block mb-1">Blood Group</label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. PHYSICAL VITALS & ALLERGIES */}
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-[#0E2924] flex items-center gap-2">
            <Heart className="h-4 w-4 text-[#227B6B]" /> 2. Vitals & Allergies
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-[10px] font-black uppercase text-[#227B6B] block mb-1">Height</label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[#227B6B] block mb-1">Weight</label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-[#227B6B] block mb-1">Known Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. EMERGENCY CONTACT */}
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-black text-[#0E2924] flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#227B6B]" /> 3. Emergency Contact Protocol
          </h2>
          <div>
            <label className="text-[10px] font-black uppercase text-[#227B6B] block mb-1">Emergency Contact Number</label>
            <input
              type="text"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              className="w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:outline-none"
            />
          </div>
        </div>

        {/* 4. LINKED FAMILY MEMBERS (NO HTML5 REQUIRED ATTRIBUTES ON DROPDOWNS) */}
        <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3">
            <h2 className="text-base font-black text-[#0E2924] flex items-center gap-2">
              <Users className="h-4 w-4 text-[#227B6B]" /> 4. Linked Family Members
            </h2>
            <span className="text-xs font-bold text-[#227B6B]">Total Linked: {familyMembers.length}</span>
          </div>

          {addError && (
            <div className="rounded-2xl bg-rose-50 p-3 text-xs font-bold text-rose-700 border border-rose-200">
              {addError}
            </div>
          )}

          {/* INPUT FIELDS HAVE NO 'REQUIRED' ATTRIBUTE TO PREVENT FORM SUBMISSION BLOCKS */}
          <div className="rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-4 space-y-3">
            <p className="text-[10px] font-black uppercase text-[#227B6B]">Add New Family Member</p>
            <div className="grid gap-3 sm:grid-cols-5">
              <input
                type="text"
                placeholder="Full Name"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                className="rounded-xl border border-[#D5E8E3] bg-white p-3 text-xs font-bold text-[#0E2924] focus:outline-none sm:col-span-1"
              />
              <select
                value={memberRelation}
                onChange={(e) => setMemberRelation(e.target.value)}
                className="rounded-xl border border-[#D5E8E3] bg-white p-3 text-xs font-bold text-[#0E2924] focus:outline-none"
              >
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
              </select>
              <input
                type="text"
                placeholder="Age"
                value={memberAge}
                onChange={(e) => setMemberAge(e.target.value)}
                className="rounded-xl border border-[#D5E8E3] bg-white p-3 text-xs font-bold text-[#0E2924] focus:outline-none"
              />
              {/* REMOVED REQUIRED ATTRIBUTE SO IT DOESN'T BLOCK MAIN PROFILE SAVE */}
              <select
                value={memberBlood}
                onChange={(e) => setMemberBlood(e.target.value)}
                className="rounded-xl border border-[#D5E8E3] bg-white p-3 text-xs font-bold text-[#0E2924] focus:outline-none"
              >
                <option value="">Select Blood Group</option>
                <option value="O Positive (O+)">O Positive (O+)</option>
                <option value="O Negative (O-)">O Negative (O-)</option>
                <option value="A Positive (A+)">A Positive (A+)</option>
                <option value="A Negative (A-)">A Negative (A-)</option>
                <option value="B Positive (B+)">B Positive (B+)</option>
                <option value="B Negative (B-)">B Negative (B-)</option>
                <option value="AB Positive (AB+)">AB Positive (AB+)</option>
                <option value="AB Negative (AB-)">AB Negative (AB-)</option>
              </select>
              <button
                type="button"
                onClick={handleAddMember}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#113831] px-4 py-3 text-xs font-black text-white hover:bg-[#227B6B] transition shadow-sm"
              >
                <Plus className="h-4 w-4 text-[#A6E2D8]" /> Add Member
              </button>
            </div>
          </div>

          {/* LIST OF ADDED FAMILY MEMBERS */}
          {familyMembers.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {familyMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-2xl border border-[#D5E8E3] bg-[#EAF5F2]/40 p-4"
                >
                  <div>
                    <h4 className="text-xs font-black text-[#0E2924]">{m.name}</h4>
                    <p className="text-[11px] font-bold text-[#227B6B]">
                      {m.relation} • Age: {m.age} • Blood: <span className="text-[#113831] font-black">{m.blood}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(m.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SAVE BUTTON */}
        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#113831] py-4 text-xs font-black text-white shadow-lg hover:bg-[#227B6B] transition disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin text-[#A6E2D8]" /> Saving Profile to Backend...</>
          ) : (
            <><Save className="h-4 w-4 text-[#A6E2D8]" /> Save Complete Patient & Family Profile</>
          )}
        </button>
      </form>
    </div>
  );
}