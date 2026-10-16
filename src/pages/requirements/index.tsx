import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import Requirements from '../../components/requirement/index.tsx';
import PositionFormData from '../../components/position-details/index.tsx';
import { useState } from 'react';
import Rounds from '../../components/round/index.tsx';
import { Boxes, BriefcaseBusiness, SquareKanban } from 'lucide-react';

const tabs = [
  {
    name: 'Role',
    value: 'Role',
    icon: <BriefcaseBusiness />,
    content: <PositionFormData />,
  },
  {
    name: 'Requirements',
    value: 'Requirements',
    icon: <SquareKanban />,
    content: <Requirements />,
  },
  {
    name: 'Round',
    value: 'Round',
    icon: <Boxes />,
    content: <Rounds />,
  },
];

interface RequirementProps {
  children: React.ReactNode;
}

const Requirement: React.FC<RequirementProps> = () => {
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
              <a href="#" className="dropanc" onClick={handledrop}>
                {tabs[0].name}
              </a>
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

export default Requirement;
