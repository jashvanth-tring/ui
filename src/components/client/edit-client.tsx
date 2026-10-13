import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import Loader from '../loader';
import CityLocationAutocomplete from './CityLocationAutocomplete';
import PhoneField from '../form/PhoneField';

interface EditClientProps {
  client: {
    id: number | null;
    clientName: string;
    emailId?: string;
    spocName?: string;
    spocContactNumber?: string;
    locations: string[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (updatedClient: any) => void;
  onCancel: () => void;
}

const EditClient: React.FC<EditClientProps> = ({ client, onSave, onCancel }) => {
  const { loading } = useAppSelector((state: RootState) => state?.clientsSelector);
  const [inlineEditing, setInlineEditing] = useState(client);
  const [divs, setDivs] = useState<string[]>(client?.locations ?? []);
  const [locationsError, setLocationsError] = useState('');

  useEffect(() => {
    setInlineEditing(client);
    setDivs(client?.locations ?? []);
    setLocationsError('');
  }, [client]);

  const handleChangeEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInlineEditing({
      ...inlineEditing,
      [name]: value,
    });
  };

    const handlePhoneChange = (val: string) => {
    setInlineEditing((prev) => ({
      ...prev,
      spocContactNumber: val,
    }));
  };

  const handleSave = () => {
    if (divs.length === 0) {
      setLocationsError('Add at least one location');
      return;
    }
    setLocationsError('');
    onSave({
      ...inlineEditing,
      locations: divs,
    });
  };

  return (
    <div className="p-4 pb-5">
      <h2 className="mb-4 border-b border-slate-200 pb-2 text-lg font-semibold tracking-tight text-[var(--brand)]">
        Edit Client Information
      </h2>
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clientName">Client Name *</Label>
            <Input
              id="clientName"
              name="clientName"
              type="text"
              value={inlineEditing.clientName}
              onChange={handleChangeEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emailId">Email ID</Label>
            <Input
              id="emailId"
              name="emailId"
              type="email"
              value={inlineEditing.emailId ?? ''}
              onChange={handleChangeEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spocName">SPOC Name</Label>
            <Input
              id="spocName"
              name="spocName"
              type="text"
              value={inlineEditing?.spocName ?? ''}
              onChange={handleChangeEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNo">SPOC Contact Number</Label>
            <PhoneField
              value={inlineEditing.spocContactNumber ?? ''}
              onChange={handlePhoneChange}
            />
          </div>
        </div>

        <CityLocationAutocomplete
          label="Locations *"
          locations={divs}
          error={locationsError}
          onAdd={(city) => {
            setLocationsError('');
            setDivs((prev) => (prev.includes(city) ? prev : [...prev, city]));
          }}
          onRemove={(i) => setDivs((prev) => prev.filter((_, idx) => idx !== i))}
        />

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="px-4">
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[var(--brand)] px-4 hover:bg-[var(--brand)]"
            onClick={handleSave}
            disabled={loading}
          >
            Update Profile
          </Button>
        </div>
      </form>
      {loading && <Loader />}
    </div>
  );
};

export default EditClient;
