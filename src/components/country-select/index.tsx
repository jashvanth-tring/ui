import { useState, useMemo } from 'react';
import Select from 'react-select';
import countryList from 'react-select-country-list';

function CountrySelector() {
  const [value, setValue] = useState('');
  const options = useMemo(
    () =>
      countryList()
        .getData()
        .map((country) => ({ value: country.label, label: country.label })),
    []
  );

  // eslint-disable-next-line
  const changeHandler = (newValue: any) => {
    setValue(newValue ? newValue.value : '');
  };

  return (
    <Select
      options={options}
      value={options.find((option) => option.value === value)}
      onChange={changeHandler}
    />
  );
}

export default CountrySelector;
