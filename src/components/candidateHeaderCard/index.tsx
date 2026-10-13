import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface CandidateHeaderProps {
  name: string;
  location: string;
  phone: string;
  email: string;
  skillSet: any;
  noticePeriod: string;
  totalExp: number;
  source: string;
}

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase();

const InfoChip: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-1.5 text-sm text-gray-600">
    <span className="text-gray-400">{icon}</span>
    <span className="text-gray-400 text-xs">{label}:</span>
    <span className="font-medium text-gray-700">{value}</span>
  </div>
);

const CandidateHeaderCard: React.FC<CandidateHeaderProps> = ({
  name, location, phone, email, skillSet, noticePeriod, totalExp, source,
}) => {
  const skills = Array.isArray(skillSet) 
    ? skillSet 
    : (typeof skillSet === 'string' ? skillSet.split(",").map((s) => s.trim()).filter(Boolean) : []);

  return (
    <div className="rounded-xl border border-gray-100 bg-white px-5 pb-5 pt-3 shadow-sm transition-shadow duration-200 hover:shadow-md sm:pt-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left — Avatar + Info */}
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <Avatar className="w-14 h-14 rounded-full ring-2 ring-gray-100">
            <AvatarImage src="/placeholder.svg?height=96&width=96" alt={name} className="object-cover" />
            <AvatarFallback className="bg-[#06B6D4] text-white text-sm font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            {/* Name */}
            <h2 className="text-xl font-semibold text-gray-900 leading-tight">{name}</h2>

            {/* Row 1 — location, phone, email */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <InfoChip
                label="Location"
                value={location}
                icon={
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                }
              />
              <a href={`tel:${phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="font-medium">{phone}</span>
              </a>
              <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.27 4.84A2 2 0 0110.73 11H3v6a1 1 0 001 1h16a1 1 0 001-1v-6H13.27a2 2 0 01-.73 0L3 8z" />
                </svg>
                <span className="font-medium truncate max-w-[180px]">{email}</span>
              </a>
            </div>

            {/* Row 2 — notice period, exp, source */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <InfoChip
                label="Notice"
                value={`${noticePeriod} days`}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <InfoChip
                label="Exp"
                value={`${totalExp} yrs`}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />
              <InfoChip
                label="Source"
                value={source}
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                }
              />
            </div>

            {/* Row 3 — skills */}
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, i) => (
                <span key={i} className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-[#1558bc] rounded-full border border-blue-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateHeaderCard;