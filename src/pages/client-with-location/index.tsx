import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import Client from '../../components/client/index.tsx';
// import Location from "../../components/location/index.tsx";
// import ClientLocationFormData from "../../components/client-location/index.tsx";
import { useState } from 'react';
import { User } from 'lucide-react';

const tabs = [
  {
    name: 'Client',
    value: 'Client',
    icon: <User />,
    content: <Client />,
  },
];

const ClientWithLocation: React.FC = () => {
  const [drop, isDrop] = useState(false);

  const [loading] = useState(false);
  const [currentTab, setCurrentTab] = useState(tabs[0].value);

  const handledrop = (event: React.MouseEvent) => {
    event.preventDefault();
    isDrop((prevState) => !prevState);
    const appDiv = document.getElementsByClassName('dropanc')[0];
    const text = (event.target as HTMLElement)?.textContent;
    if (appDiv && text) {
      appDiv.textContent = '';
      appDiv.append(text);
    }
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  return (
    <>
      <div className="main">
        <Tabs defaultValue={tabs[0].value} className="tabdiv" value={currentTab}>
          <TabsList className="p-0 h-auto w-100 bg-background gap-1">
            <div className="dropdown">
              <button type="button" className="dropanc" onClick={handledrop}>
  {tabs[0].name}
</button>
              <div className={drop ? 'tabmain1 show' : 'tabmain1'}>
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="customebt data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    onClick={(e) => {
                      handleTabChange(tab.value);
                      handledrop(e);
                    }}
                  >
                    {/* add icons here */}
                    <span className="mr-1 tabcon">{tab.icon}</span>{' '}
                    <code className="text-[13px]">{tab.name}</code>
                  </TabsTrigger>
                ))}
              </div>
            </div>
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              <div className="tab-content relative">
                <code className={`text-[13px] ${loading ? 'opacity-0' : 'opacity-100'}`}>
                  {tab.content}
                </code>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
};

export default ClientWithLocation;
