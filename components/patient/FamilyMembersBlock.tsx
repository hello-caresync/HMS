'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2, Users, X } from 'lucide-react';

import { BLOOD_GROUPS, normalizeBloodGroup } from '@/lib/patient/blood-groups';
import {
  createEmptyFamilyMemberDraft,
  type FamilyMember,
  type FamilyGender,
  type FamilyRelationship,
} from '@/lib/patient/family-members';

const inputClass =
  'w-full rounded-lg border border-[#EADBCE] bg-white px-3 py-2 text-xs font-medium text-[#2B1810] focus:border-[#8C5A3C] focus:outline-none focus:ring-2 focus:ring-[#8C5A3C]/20';

type FamilyMembersBlockProps = {
  members: FamilyMember[];
  onChange: (members: FamilyMember[]) => void;
  disabled?: boolean;
};

export function FamilyMembersBlock({ members, onChange, disabled = false }: FamilyMembersBlockProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(createEmptyFamilyMemberDraft());

  const openAdd = () => {
    setDraft(createEmptyFamilyMemberDraft());
    setEditingId(null);
    setShowAddMember(true);
  };

  const openEdit = (member: FamilyMember) => {
    setDraft({
      fullName: member.fullName,
      relationship: member.relationship,
      age: member.age,
      gender: member.gender,
      bloodGroup: member.bloodGroup || '',
    });
    setEditingId(member.id);
    setShowAddMember(true);
  };

  const closeModal = () => {
    setShowAddMember(false);
    setEditingId(null);
    setDraft(createEmptyFamilyMemberDraft());
  };

  const saveMember = () => {
    if (!draft.fullName.trim()) return;

    if (editingId) {
      onChange(
        members.map((member) =>
          member.id === editingId
            ? {
                id: member.id,
                fullName: draft.fullName.trim(),
                relationship: draft.relationship,
                age: draft.age.trim(),
                gender: draft.gender,
                bloodGroup: draft.bloodGroup?.trim() || undefined,
              }
            : member,
        ),
      );
    } else {
      onChange([
        ...members,
        {
          id: crypto.randomUUID(),
          fullName: draft.fullName.trim(),
          relationship: draft.relationship,
          age: draft.age.trim(),
          gender: draft.gender,
          bloodGroup: draft.bloodGroup?.trim() || undefined,
        },
      ]);
    }
    closeModal();
  };

  const removeMember = (id: string) => {
    onChange(members.filter((member) => member.id !== id));
  };

  return (
    <>
      <div className="flex flex-col justify-between rounded-xl border border-[#EADBCE] bg-white p-5 shadow-xs">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#8C5A3C]" aria-hidden />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C5C48]">
                Family & Dependents
              </h3>
            </div>
            {!disabled ? (
              <button
                type="button"
                onClick={openAdd}
                className="flex items-center gap-1.5 rounded-lg bg-[#8C5A3C] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#6F4E37]"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Member
              </button>
            ) : null}
          </div>

          <p className="mb-4 text-xs text-stone-500">
            Link family members to your patient ID to book appointments and view prescriptions on
            their behalf.
          </p>

          {members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E6CCB2] bg-[#FAF6F0]/60 p-6 text-center">
              <Users className="mx-auto mb-2 h-8 w-8 text-[#8C5A3C]/40" aria-hidden />
              <p className="text-xs font-semibold text-[#2B1810]">No family members added yet</p>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Add your children, spouse, or parents to manage their care under one account.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-xl border border-[#EADBCE] bg-[#FAF6F0]/40 p-3.5"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#2B1810]">{member.fullName}</h4>
                    <p className="text-[11px] text-[#7C5C48]">
                      {member.relationship}
                      {member.age ? ` • ${member.age} yrs` : ''} • {member.gender}
                      {member.bloodGroup ? ` • ${member.bloodGroup}` : ''}
                    </p>
                  </div>
                  {!disabled ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="rounded-lg p-1.5 text-stone-400 transition hover:bg-white hover:text-[#8C5A3C]"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="rounded-lg p-1.5 text-stone-400 transition hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[#EADBCE]/80 pt-4 text-xs text-stone-500">
          <span>Linked Facility Node:</span>
          <span className="font-mono font-bold text-[#8C5A3C]">HOSP-01 (Bengaluru)</span>
        </div>
      </div>

      {showAddMember ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B1810]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#EADBCE] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#2B1810]">
                {editingId ? 'Edit Family Member' : 'Add Family Member'}
              </h4>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-[#FAF6F0] hover:text-[#2B1810]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase text-[#7C5C48]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={draft.fullName}
                  onChange={(e) => setDraft((current) => ({ ...current, fullName: e.target.value }))}
                  className={inputClass}
                  placeholder="Dependent full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-[#7C5C48]">
                    Relationship
                  </label>
                  <select
                    value={draft.relationship}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        relationship: e.target.value as FamilyRelationship,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-[#7C5C48]">
                    Age
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={draft.age}
                    onChange={(e) => setDraft((current) => ({ ...current, age: e.target.value }))}
                    className={inputClass}
                    placeholder="Age"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-[#7C5C48]">
                    Gender
                  </label>
                  <select
                    value={draft.gender}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        gender: e.target.value as FamilyGender,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase text-[#7C5C48]">
                    Blood Group
                  </label>
                  <select
                    value={normalizeBloodGroup(draft.bloodGroup || '')}
                    onChange={(e) =>
                      setDraft((current) => ({ ...current, bloodGroup: e.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-[#7C5C48] hover:bg-[#FAF6F0]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveMember}
                disabled={!draft.fullName.trim()}
                className="rounded-xl bg-[#8C5A3C] px-4 py-2 text-xs font-bold text-white hover:bg-[#6F4E37] disabled:opacity-50"
              >
                {editingId ? 'Update Member' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default FamilyMembersBlock;
