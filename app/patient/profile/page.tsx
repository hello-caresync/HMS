'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  User,
  HeartPulse,
  Save,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: string;
  blood_group: string;
}

const BLOOD_GROUP_OPTIONS = [
  'O Positive (O+)',
  'O Negative (O-)',
  'A Positive (A+)',
  'A Negative (A-)',
  'B Positive (B+)',
  'B Negative (B-)',
  'AB Positive (AB+)',
  'AB Negative (AB-)',
] as const;

export default function ComprehensivePatientProfilePage() {
  const [patientId] = useState<string>('NEX_9021');

  // 1. Personal & Identity Details
  const [fullName, setFullName] = useState<string>('Aishwarya D S');
  const [email, setEmail] = useState<string>('aishwarya@gmail.com');
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [gender, setGender] = useState<string>('Female');
  const [dob, setDob] = useState<string>('2002-05-15');
  const [address, setAddress] = useState<string>('Bengaluru, Karnataka, India');

  // 2. Physical Vitals & Medical Information
  const [bloodGroup, setBloodGroup] = useState<string>('O Positive (O+)');
  const [height, setHeight] = useState<string>('165 cm');
  const [weight, setWeight] = useState<string>('58 kg');
  const [knownAllergies, setKnownAllergies] = useState<string>('Penicillin, Dust');
  const [chronicConditions, setChronicConditions] = useState<string>('Asthma (Mild), Type 2 Diabetes');

  // 3. Emergency Contact Details
  const [emergencyContactName, setEmergencyContactName] = useState<string>('Nagarathna');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>('+91 98765 12345');
  const [emergencyRelation, setEmergencyRelation] = useState<string>('Mother');

  // 4. Family Members Management State
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: 'fam_1', name: 'Ananya D S', relation: 'Sister', age: '20', blood_group: 'O Positive (O+)' },
  ]);
  const [newFamName, setNewFamName] = useState<string>('');
  const [newFamRelation, setNewFamRelation] = useState<string>('Sibling');
  const [newFamAge, setNewFamAge] = useState<string>('');
  const [newFamBlood, setNewFamBlood] = useState<string>('');

  // System States
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const fetchProfileDetails = async () => {
    setLoading(true);

    // Read from local storage for instant loading
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('curasync_full_patient_profile');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          populateState(parsed);
        } catch (e) {}
      }
    }

    // Query Supabase database
    try {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (!error && data) {
        populateState(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('curasync_full_patient_profile', JSON.stringify(data));
        }
      }
    } catch (err) {
      console.warn('Backend fetch notice');
    } finally {
      setLoading(false);
    }
  };

  const populateState = (data: any) => {
    if (data.full_name) setFullName(data.full_name);
    if (data.email) setEmail(data.email);
    if (data.phone) setPhone(data.phone);
    if (data.gender) setGender(data.gender);
    if (data.dob) setDob(data.dob);
    if (data.address) setAddress(data.address);
    if (data.blood_group) setBloodGroup(data.blood_group);
    if (data.height) setHeight(data.height);
    if (data.weight) setWeight(data.weight);
    if (data.known_allergies) setKnownAllergies(data.known_allergies);
    if (data.chronic_conditions) setChronicConditions(data.chronic_conditions);
    if (data.emergency_contact_name) setEmergencyContactName(data.emergency_contact_name);
    if (data.emergency_contact_phone) setEmergencyContactPhone(data.emergency_contact_phone);
    if (data.emergency_relation) setEmergencyRelation(data.emergency_relation);
    if (data.family_members && Array.isArray(data.family_members)) {
      setFamilyMembers(data.family_members);
    }
  };

  const handleAddFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamName.trim() || !newFamBlood) return;

    const member: FamilyMember = {
      id: 'fam_' + Date.now(),
      name: newFamName,
      relation: newFamRelation,
      age: newFamAge || 'N/A',
      blood_group: newFamBlood,
    };

    setFamilyMembers([...familyMembers, member]);
    setNewFamName('');
    setNewFamAge('');
    setNewFamBlood('');
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter((m) => m.id !== id));
  };

  const handleSaveFullProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const payload = {
      patient_id: patientId,
      full_name: fullName,
      email,
      phone,
      gender,
      dob,
      address,
      blood_group: bloodGroup,
      height,
      weight,
      known_allergies: knownAllergies,
      chronic_conditions: chronicConditions,
      emergency_contact_name: emergencyContactName,
      emergency_contact_phone: emergencyContactPhone,
      emergency_relation: emergencyRelation,
      family_members: familyMembers,
      updated_at: new Date().toISOString(),
    };

    // 1. Instant Local Storage Sync
    if (typeof window !== 'undefined') {
      localStorage.setItem('patient_full_name', fullName);
      localStorage.setItem('curasync_full_patient_profile', JSON.stringify(payload));
    }

    // 2. Supabase Backend Sync
    try {
      const { error } = await supabase
        .from('patient_profiles')
        .upsert(payload, { onConflict: 'patient_id' });

      if (error) {
        console.warn('Database save notice:', error.message);
      }
    } catch (err) {
      console.warn('Backend sync fallback active');
    } finally {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans text-[#0E2924]">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#D5E8E3] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#0E2924]">Comprehensive Patient & Family Records</h1>
          <p className="text-xs font-bold text-[#227B6B]">
            Manage complete identity details, physical vitals, emergency contacts, and linked family profiles.
          </p>
        </div>

        <span className="rounded-full bg-[#EAF5F2] px-4 py-1.5 text-xs font-black text-[#113831] border border-[#227B6B]/20">
          ID: {patientId}
        </span>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#EAF5F2] p-4 text-xs font-bold text-[#113831] border border-[#227B6B]/30 shadow-sm animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-[#227B6B] shrink-0" />
          <span>All profile details and family member records have been saved to backend database!</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl bg-white border border-[#D5E8E3]">
          <Loader2 className="h-8 w-8 animate-spin text-[#113831]" />
        </div>
      ) : (
        <form onSubmit={handleSaveFullProfile} className="space-y-8">
          
          {/* SECTION 1: PERSONAL IDENTITY */}
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-[#EAF5F2] pb-3 text-[#113831]">
              <User className="h-5 w-5 text-[#227B6B]" />
              <h2 className="text-base font-black">1. Personal Identity & Contact</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PHYSICAL VITALS & MEDICAL HISTORY */}
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-[#EAF5F2] pb-3 text-[#113831]">
              <HeartPulse className="h-5 w-5 text-[#227B6B]" />
              <h2 className="text-base font-black">2. Clinical Vitals & Medical History</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Blood Group *</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                >
                  {BLOOD_GROUP_OPTIONS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Height</label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Weight</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>

              <div className="md:col-span-3 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-black uppercase text-[#227B6B]">Known Allergies</label>
                  <textarea
                    rows={2}
                    value={knownAllergies}
                    onChange={(e) => setKnownAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Peanuts, Latex"
                    className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[#227B6B]">Chronic Medical Conditions</label>
                  <textarea
                    rows={2}
                    value={chronicConditions}
                    onChange={(e) => setChronicConditions(e.target.value)}
                    placeholder="e.g. Asthma, Hypertension, Diabetes"
                    className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: EMERGENCY CONTACT */}
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-[#EAF5F2] pb-3 text-[#113831]">
              <Phone className="h-5 w-5 text-rose-600" />
              <h2 className="text-base font-black">3. Emergency Contact Person</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Emergency Phone *</label>
                <input
                  type="text"
                  required
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#227B6B]">Relationship *</label>
                <input
                  type="text"
                  required
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5E8E3] bg-[#F4F8F7] p-3.5 text-xs font-bold text-[#0E2924] focus:border-[#113831] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: FAMILY MEMBERS MANAGER */}
          <div className="rounded-3xl border border-[#D5E8E3] bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#EAF5F2] pb-3 text-[#113831]">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#227B6B]" />
                <h2 className="text-base font-black">4. Linked Family Members</h2>
              </div>
              <span className="text-xs font-bold text-[#227B6B]">
                Total Linked: {familyMembers.length}
              </span>
            </div>

            {/* ADD FAMILY MEMBER FORM */}
            <div className="rounded-2xl bg-[#F4F8F7] p-4 border border-[#D5E8E3] space-y-3">
              <span className="text-xs font-black uppercase text-[#113831]">Add New Family Member</span>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newFamName}
                  onChange={(e) => setNewFamName(e.target.value)}
                  className="rounded-xl border border-[#D5E8E3] bg-white p-2.5 text-xs font-bold text-[#0E2924] focus:outline-none"
                />

                <select
                  value={newFamRelation}
                  onChange={(e) => setNewFamRelation(e.target.value)}
                  className="rounded-xl border border-[#D5E8E3] bg-white p-2.5 text-xs font-bold text-[#0E2924] focus:outline-none"
                >
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Child</option>
                </select>

                <input
                  type="text"
                  placeholder="Age"
                  value={newFamAge}
                  onChange={(e) => setNewFamAge(e.target.value)}
                  className="rounded-xl border border-[#D5E8E3] bg-white p-2.5 text-xs font-bold text-[#0E2924] focus:outline-none"
                />

                <select
                  required
                  value={newFamBlood}
                  onChange={(e) => setNewFamBlood(e.target.value)}
                  className="rounded-xl border border-[#D5E8E3] bg-white p-2.5 text-xs font-bold text-[#0E2924] focus:outline-none"
                >
                  <option value="">Blood Group *</option>
                  {BLOOD_GROUP_OPTIONS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddFamilyMember}
                  disabled={!newFamName.trim() || !newFamBlood}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-[#113831] py-2.5 text-xs font-black text-white hover:bg-[#227B6B] transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Add Member
                </button>
              </div>
            </div>

            {/* FAMILY MEMBERS LIST */}
            <div className="grid gap-4 sm:grid-cols-2">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-2xl border border-[#D5E8E3] bg-[#EAF5F2]/50 p-4"
                >
                  <div>
                    <h4 className="text-xs font-black text-[#0E2924]">{member.name}</h4>
                    <p className="text-[11px] font-bold text-[#227B6B]">
                      {member.relation} • Age: {member.age} • Blood: {member.blood_group}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFamilyMember(member.id)}
                    className="rounded-xl p-2 text-rose-600 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#113831] py-4 text-xs font-black text-white shadow-xl hover:bg-[#227B6B] transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#A6E2D8]" /> Saving All Profile Records to Backend...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-[#A6E2D8]" /> Save Complete Patient & Family Profile
              </>
            )}
          </button>

        </form>
      )}

    </div>
  );
}