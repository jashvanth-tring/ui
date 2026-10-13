'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  addPositionDetails,
  getPositionDetails,
} from '../../store/services/position-details';
import { PositionPayload } from '../../store/model/position-details.types';

interface Position {
  id: number;
  positionName: string;
}

interface Props {
  value?: number;
  positionName?: string;
  onChange: (id: number, name: string) => void;
}

const PositionAutocomplete: React.FC<Props> = ({ onChange, positionName  }) => {
  const [search, setSearch] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // 🔹 Fetch positions
  const fetchPositions = async () => {
    try {
      const res = await getPositionDetails();
      setPositions(res.data?.data || []);
    } catch (err) {
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // 🔹 Filter positions
  const filteredPositions = positions.filter((p) =>
    p.positionName.toLowerCase().includes(search.toLowerCase())
  );

  // 🔹 Add new position
  const handleAddNew = async () => {
    try {
      if (!search.trim()) return;

      setLoading(true);

      const payload: PositionPayload = {
        positionName: search,
        description: '',
        createdBy: {
          id: 1, // ⚠️ replace with logged-in user id if needed
        },
      };

      const res = await addPositionDetails(payload);
      const newItem = res.data?.data;

      // update list
      setPositions((prev) => [...prev, newItem]);

      // select it
      setSearch(newItem.positionName);
      onChange(newItem.id, newItem.positionName);

      setShowDropdown(false);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (positionName) {
      setSearch(positionName);
    }
  }, [positionName]);

  return (
    <div ref={wrapperRef} className="relative">
      
      {/* INPUT */}
      <div className="flex gap-2">
    {/* INPUT */}
    <input
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setShowDropdown(true);
      }}
      placeholder="e.g Software Developer"
      className="flex-1 border rounded px-3 py-2 bg-white"
    />

    {/* ADD BUTTON */}
    <button
      type="button"
      onClick={handleAddNew}
      disabled={!search.trim() || loading}
      className="px-4 py-2 text-sm bg-[var(--brand)] text-white rounded hover:bg-[#1a4a7a] disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Adding...' : '+ Add'}
    </button>
  </div>

      {/* DROPDOWN */}
      {showDropdown && filteredPositions.length > 0 && (
        <div className="absolute w-full bg-white border z-10 max-h-48 overflow-y-auto rounded shadow mt-1">
          {filteredPositions.map((pos) => (
            <div
              key={pos.id}
              className="p-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setSearch(pos.positionName);
                onChange(pos.id, pos.positionName);
                setShowDropdown(false);
              }}
            >
              {pos.positionName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PositionAutocomplete;