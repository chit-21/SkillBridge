// skillbridge/src/components/ProfileCard.tsx
import React, { useState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";

type ProfileData = {
  uid: string;
  name: string;
  email: string;
  timezone: string;
  profile?: Record<string, any>;
  teachingSkills: string[];
  learningSkills: string[];
};

interface Props {
  profile: ProfileData;
  onSave: (updates: Partial<ProfileData>) => Promise<void>;
  onAddSkill: (type: "teaching" | "learning", skill: string) => Promise<void>;
  onRemoveSkill: (type: "teaching" | "learning", skill: string) => Promise<void>;
}

export function ProfileCard({ profile, onSave, onAddSkill, onRemoveSkill }: Props) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name || "");
  const [timezone, setTimezone] = useState(profile.timezone || "UTC");
  const [teachInput, setTeachInput] = useState("");
  const [learnInput, setLearnInput] = useState("");

  const save = async () => {
    await onSave({ name, timezone });
    setEditing(false);
  };

  const addTeach = async () => {
    if (teachInput.trim()) {
      await onAddSkill("teaching", teachInput.trim());
      setTeachInput("");
    }
  };

  const addLearn = async () => {
    if (learnInput.trim()) {
      await onAddSkill("learning", learnInput.trim());
      setLearnInput("");
    }
  };

  return (
    <Card>
      <CardHeader
        title="Profile"
        subtitle="Manage your public information and skills"
        action={
          editing ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={save}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
          )
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
          <input
            disabled={!editing}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <input
            disabled
            value={profile.email}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
          <select
            disabled={!editing}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Calcutta">Asia/Calcutta</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Teaching Skills</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.teachingSkills.map((s) => (
              <span key={s} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">
                {s}
                <button onClick={() => onRemoveSkill("teaching", s)} className="text-blue-600 dark:text-blue-300">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={teachInput}
              onChange={(e) => setTeachInput(e.target.value)}
              placeholder="Add skill"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button onClick={addTeach}>Add</Button>
          </div>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Learning Skills</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {profile.learningSkills.map((s) => (
              <span key={s} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm">
                {s}
                <button onClick={() => onRemoveSkill("learning", s)} className="text-indigo-600 dark:text-indigo-300">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={learnInput}
              onChange={(e) => setLearnInput(e.target.value)}
              placeholder="Add skill"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button onClick={addLearn}>Add</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}