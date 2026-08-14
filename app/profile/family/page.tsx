'use client';

import React, { useState } from 'react';

export interface FamilyMemberProfile {
  id: string;
  name: string;
  relation: string;
  allergies: string[];
  doctorAdvisedRestrictions: string[];
  dislikes: string[];
  mealStrategyPreference: 'common' | 'allow_separate';
}

export default function FamilyProfilePage() {
  const [members, setMembers] = useState<FamilyMemberProfile[]>([
    {
      id: 'm1',
      name: 'Rajesh',
      relation: 'Self / Parent',
      allergies: ['Peanuts'],
      doctorAdvisedRestrictions: ['Low Sodium / Reduced Salt'],
      dislikes: ['Karela (Bitter Gourd)', 'Mushroom'],
      mealStrategyPreference: 'common',
    },
  ]);

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('');
  const [allergyInput, setAllergyInput] = useState('');
  const [doctorInput, setDoctorInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [mealStrategy, setMealStrategy] = useState<'common' | 'allow_separate'>('common');

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !relation) return;

    const newMember: FamilyMemberProfile = {
      id: `m_${Date.now()}`,
      name,
      relation,
      allergies: allergyInput ? allergyInput.split(',').map((s) => s.trim()) : [],
      doctorAdvisedRestrictions: doctorInput ? doctorInput.split(',').map((s) => s.trim()) : [],
      dislikes: dislikeInput ? dislikeInput.split(',').map((s) => s.trim()) : [],
      mealStrategyPreference: mealStrategy,
    };

    setMembers([...members, newMember]);
    setName('');
    setRelation('');
    setAllergyInput('');
    setDoctorInput('');
    setDislikeInput('');
    setMealStrategy('common');
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Family Profiles & Restrictions</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure dietary constraints for each family member to guide MAMAAI&apos;s meal engine.
          </p>
        </div>

        {/* Form: Add Family Member */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4">Add Family Member</h2>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aarav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Son, Spouse, Parent"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Hard Constraint 1 */}
            <div>
              <label className="block text-xs font-semibold text-red-700 mb-1">
                🔴 Medical Allergies & Intolerances (Hard Safety Constraint)
              </label>
              <input
                type="text"
                placeholder="Comma separated: Peanuts, Shellfish, Lactose"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                className="w-full px-3 py-2 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none bg-red-50/30"
              />
            </div>

            {/* Hard Constraint 2 */}
            <div>
              <label className="block text-xs font-semibold text-amber-700 mb-1">
                ⚠️ Doctor-Advised Restrictions (Hard Medical Constraint)
              </label>
              <input
                type="text"
                placeholder="Comma separated: Low Sodium, Low Sugar, Gluten-Free"
                value={doctorInput}
                onChange={(e) => setDoctorInput(e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50/30"
              />
            </div>

            {/* Soft Constraint */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                🟢 General Taste Dislikes (Soft Optimization Constraint)
              </label>
              <input
                type="text"
                placeholder="Comma separated: Karela, Capsicum, Spicy Food"
                value={dislikeInput}
                onChange={(e) => setDislikeInput(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Meal Strategy Preference</label>
              <select
                value={mealStrategy}
                onChange={(e) => setMealStrategy(e.target.value as 'common' | 'allow_separate')}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="common">Prefer One Common Family Meal</option>
                <option value="allow_separate">Allow Custom Separate Dish If Restricted</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition shadow"
            >
              Add Member Profile
            </button>
          </form>
        </div>

        {/* Household Members List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Configured Household Members</h2>
          {members.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border text-center text-xs text-gray-500">
              No family members added yet. Add a profile above.
            </div>
          ) : (
            members.map((m) => (
              <div key={m.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{m.name}</h3>
                    <span className="text-xs font-medium text-gray-500">{m.relation}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    className="text-xs text-red-600 hover:text-red-800 font-semibold"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  {/* Allergies */}
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <span className="font-bold text-red-800 block mb-1">Medical Allergies</span>
                    {m.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.allergies.map((a, i) => (
                          <span key={i} className="bg-red-200 text-red-900 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>

                  {/* Doctor Restrictions */}
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="font-bold text-amber-800 block mb-1">Doctor Restrictions</span>
                    {m.doctorAdvisedRestrictions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.doctorAdvisedRestrictions.map((d, i) => (
                          <span key={i} className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>

                  {/* Dislikes */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold text-gray-800 block mb-1">Taste Dislikes</span>
                    {m.dislikes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.dislikes.map((dl, i) => (
                          <span key={i} className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {dl}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </main>
  );
}